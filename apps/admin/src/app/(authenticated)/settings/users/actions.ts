'use server';

import { emailSchema, passwordSchema } from '@yuta/auth';
import {
  createTenantUserRepository,
  TenantUserError,
} from '@yuta/db-cloud';
import { tenantRoleSchema, type TenantContext } from '@yuta/tenant';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUserManagementTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';

const manageableRoleSchema = tenantRoleSchema;
const membershipStatusSchema = z.enum(['active', 'suspended']);

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: passwordSchema,
  role: manageableRoleSchema,
  establishmentIds: z.array(z.string().uuid()).min(1),
});

const updateMembershipSchema = z.object({
  membershipId: z.string().uuid(),
  role: manageableRoleSchema,
  status: membershipStatusSchema,
});

export type UserManagementActionState = {
  error: string | null;
  success: string | null;
};

const tenantUserRepository = createTenantUserRepository(cloudDatabase);

export async function createTenantUserAction(
  _previousState: UserManagementActionState,
  formData: FormData,
): Promise<UserManagementActionState> {
  const { session, tenant } = await requireUserManagementTenant();
  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    establishmentIds: formData
      .getAll('establishmentId')
      .map((value) => value.toString()),
  });
  if (!parsed.success) {
    return {
      error:
        'Vérifiez les informations, le mot de passe et les établissements.',
      success: null,
    };
  }

  const scope = await getManagementScope(tenant);
  try {
    const result = await tenantUserRepository.createOrAttachUser({
      actorUserId: session.userId,
      actorRole: scope.actorRole,
      organizationId: tenant.organizationId,
      allowedEstablishmentIds: scope.establishmentIds,
      ...parsed.data,
    });
    revalidateUserManagement();
    return {
      error: null,
      success: result.created
        ? 'Utilisateur créé et accès attribués.'
        : 'Compte existant rattaché aux établissements sélectionnés.',
    };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function updateTenantMembershipAction(
  _previousState: UserManagementActionState,
  formData: FormData,
): Promise<UserManagementActionState> {
  const { session, tenant } = await requireUserManagementTenant();
  const parsed = updateMembershipSchema.safeParse({
    membershipId: formData.get('membershipId'),
    role: formData.get('role'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    return {
      error: "La modification demandée n'est pas valide.",
      success: null,
    };
  }
  if (tenant.actor.type !== 'user') {
    return { error: 'Permission refusée.', success: null };
  }

  const scope = await getManagementScope(tenant);
  try {
    await tenantUserRepository.updateMembership({
      actorUserId: session.userId,
      actorMembershipId: tenant.actor.membershipId,
      actorRole: scope.actorRole,
      organizationId: tenant.organizationId,
      allowedEstablishmentIds: scope.establishmentIds,
      ...parsed.data,
    });
    revalidateUserManagement();
    return { error: null, success: 'Accès mis à jour.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

async function getManagementScope(tenant: TenantContext): Promise<{
  actorRole: 'owner' | 'admin';
  establishmentIds: string[];
}> {
  if (
    tenant.actor.type !== 'user' ||
    (tenant.actor.role !== 'owner' && tenant.actor.role !== 'admin') ||
    !tenant.establishmentId
  ) {
    throw new Error('User management requires an owner or administrator.');
  }
  const establishments =
    await tenantUserRepository.listManageableEstablishments({
      organizationId: tenant.organizationId,
      establishmentId:
        tenant.actor.role === 'admin' ? tenant.establishmentId : undefined,
    });
  return {
    actorRole: tenant.actor.role,
    establishmentIds: establishments.map((establishment) => establishment.id),
  };
}

function revalidateUserManagement(): void {
  revalidatePath('/settings/users');
  revalidatePath('/', 'layout');
}

function toActionError(error: unknown): UserManagementActionState {
  if (!(error instanceof TenantUserError)) {
    console.error('Tenant user management failed.', error);
    return {
      error: 'La gestion des accès est momentanément indisponible.',
      success: null,
    };
  }
  const messages: Record<TenantUserError['code'], string> = {
    ESTABLISHMENT_NOT_ALLOWED:
      "Un établissement sélectionné n'est pas autorisé.",
    MEMBERSHIP_NOT_FOUND: "Cet accès n'existe plus.",
    ROLE_NOT_ALLOWED: 'Vous ne pouvez pas attribuer ou modifier ce rôle.',
    CURRENT_MEMBERSHIP_LOCKED:
      "Vous ne pouvez pas modifier l'accès de votre session actuelle.",
    LAST_OWNER_REQUIRED:
      "L'organisation doit conserver au moins un owner actif.",
    USER_INACTIVE:
      'Ce compte global est désactivé et ne peut pas être rattaché.',
  };
  return { error: messages[error.code], success: null };
}
