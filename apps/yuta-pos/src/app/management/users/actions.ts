'use server';

import {
  createLocalUserInputSchema,
  localPinSchema,
  updateLocalUserInputSchema,
} from '@yuta/contracts/local-pos';
import { revalidatePath } from 'next/cache';
import {
  siteAgentClient,
  SiteAgentClientError,
} from '../../../lib/site-agent-client';
import { requireLocalManagementCredentials } from '../../../server/local-management-session';

export type LocalUserActionState = {
  error: string | null;
  success: string | null;
};

export async function createLocalUserAction(
  _previousState: LocalUserActionState,
  formData: FormData,
): Promise<LocalUserActionState> {
  const input = createLocalUserInputSchema.safeParse({
    name: formData.get('name'),
    email: optionalEmail(formData.get('email')),
    role: formData.get('role'),
    pin: formData.get('pin'),
  });
  if (!input.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.createLocalUser(token, input.data);
    revalidatePath('/management/users');
    return { error: null, success: 'Utilisateur créé.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function updateLocalUserAction(
  userId: string,
  _previousState: LocalUserActionState,
  formData: FormData,
): Promise<LocalUserActionState> {
  const input = updateLocalUserInputSchema.safeParse({
    name: formData.get('name'),
    email: optionalEmail(formData.get('email')),
    role: formData.get('role'),
    isActive: formData.get('isActive') === 'true',
  });
  if (!input.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.updateLocalUser(token, userId, input.data);
    revalidatePath('/management/users');
    return { error: null, success: 'Utilisateur mis à jour.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function setLocalUserActiveAction(
  userId: string,
  isActive: boolean,
  _previousState: LocalUserActionState,
): Promise<LocalUserActionState> {
  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.updateLocalUser(token, userId, { isActive });
    revalidatePath('/management/users');
    return {
      error: null,
      success: isActive ? 'Utilisateur activé.' : 'Utilisateur désactivé.',
    };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function resetLocalUserPinAction(
  userId: string,
  _previousState: LocalUserActionState,
  formData: FormData,
): Promise<LocalUserActionState> {
  const pin = localPinSchema.safeParse(formData.get('pin'));
  const confirmation = localPinSchema.safeParse(
    formData.get('pinConfirmation'),
  );
  if (!pin.success || !confirmation.success || pin.data !== confirmation.data) {
    return {
      error: 'Saisissez deux fois le même PIN de 4 à 8 chiffres.',
      success: null,
    };
  }

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.resetLocalUserPin(token, userId, { pin: pin.data });
    revalidatePath('/management/users');
    return { error: null, success: 'Code PIN modifié.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

function optionalEmail(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function validationError(): LocalUserActionState {
  return {
    error: 'Vérifiez les informations saisies.',
    success: null,
  };
}

function toActionError(error: unknown): LocalUserActionState {
  if (error instanceof SiteAgentClientError) {
    const messages: Record<string, string> = {
      LOCAL_USER_EMAIL_CONFLICT: 'Cette adresse e-mail est déjà utilisée.',
      LAST_ACTIVE_ADMIN_REQUIRED:
        'Le dernier administrateur actif ne peut pas être désactivé ou rétrogradé.',
      LOCAL_USER_MANAGEMENT_FORBIDDEN:
        "Vous n'avez pas le droit de gérer ce rôle.",
      LOCAL_USER_NOT_FOUND: "L'utilisateur n'existe plus.",
    };
    return {
      error: messages[error.code] ?? "L'opération n'a pas pu être effectuée.",
      success: null,
    };
  }
  return {
    error: 'Site-agent indisponible.',
    success: null,
  };
}
