import { z } from 'zod';

export const tenantRoleContractSchema = z.enum(['OWNER', 'MANAGER', 'STAFF']);
export const systemRoleSchema = z.enum(['YUTA_ADMIN', 'YUTA_SUPPORT']);
export const userStatusSchema = z.enum(['ACTIVE', 'DISABLED']);
export const activeMembershipStatusSchema = z.enum(['active', 'suspended']);

export const tenantAccountSchema = z.object({
  organizationId: z.string().uuid(),
  organizationName: z.string().min(1).max(255),
  establishmentId: z.string().uuid(),
  establishmentName: z.string().min(1).max(255),
  establishmentSlug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const cloudUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().max(160).nullable(),
  status: userStatusSchema,
  systemRole: systemRoleSchema.nullable(),
});

export const tenantMembershipContractSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  establishmentId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  role: tenantRoleContractSchema,
  status: activeMembershipStatusSchema,
  joinedAt: z.coerce.date(),
});

export type TenantRoleContract = z.infer<typeof tenantRoleContractSchema>;
export type SystemRole = z.infer<typeof systemRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type TenantAccount = z.infer<typeof tenantAccountSchema>;
export type CloudUserContract = z.infer<typeof cloudUserSchema>;
export type TenantMembershipContract = z.infer<
  typeof tenantMembershipContractSchema
>;
