'use server';

import { AuthError, resetPasswordInputSchema } from '@yuta/auth';
import { redirect } from 'next/navigation';
import { authRepository } from '../../../server/auth/session';

export type ResetPasswordState = { error: string | null };

export async function resetPasswordAction(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = formData.get('password')?.toString() ?? '';
  const confirmation = formData.get('confirmation')?.toString() ?? '';
  if (password !== confirmation) {
    return { error: 'Les mots de passe ne correspondent pas.' };
  }
  const parsed = resetPasswordInputSchema.safeParse({
    token: formData.get('token'),
    password,
  });
  if (!parsed.success) {
    return {
      error: 'Utilisez un mot de passe d’au moins 12 caractères.',
    };
  }
  try {
    await authRepository.resetPassword(parsed.data);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return {
        error: 'Ce lien est invalide ou a expiré.',
      };
    }
    console.error('Password reset failed.', error);
    return {
      error: 'La réinitialisation est momentanément indisponible.',
    };
  }
  redirect('/login?reset=1');
}
