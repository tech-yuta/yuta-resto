import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLocaleLowerCase('en-US'));

export const passwordSchema = z.string().min(12).max(128);

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(32).max(200),
  password: passwordSchema,
});

export type AuthenticatedSession = Readonly<{
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  establishmentId: string;
  expiresAt: Date;
}>;

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_RATE_LIMITED'
  | 'SESSION_INVALID'
  | 'SESSION_EXPIRED'
  | 'NO_ACTIVE_MEMBERSHIP'
  | 'RESET_TOKEN_INVALID';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: AuthErrorCode,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
