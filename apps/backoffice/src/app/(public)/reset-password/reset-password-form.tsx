'use client';

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  FormField,
  Input,
  Label,
} from '@yuta/ui';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { resetPasswordAction, type ResetPasswordState } from './actions';

const initialState: ResetPasswordState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  if (!token) {
    return (
      <Card padding="lg" className="w-full max-w-md text-center">
        <h1 className="text-2xl font-black">Lien invalide</h1>
        <p className="mt-3 text-sm text-secondary">
          Ce lien de réinitialisation est incomplet.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="w-full max-w-md">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-selected text-brand-800">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black">
          Choisir un nouveau mot de passe
        </h1>
      </div>
      {state.error && (
        <Alert tone="danger" className="mt-5">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <form action={formAction} className="mt-6 grid gap-5">
        <input type="hidden" name="token" value={token} />
        <FormField
          label={<Label htmlFor="password">Nouveau mot de passe</Label>}
          hint="12 caractères minimum."
        >
          <Input
            id="password"
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </FormField>
        <FormField
          label={
            <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
          }
        >
          <Input
            id="confirmation"
            name="confirmation"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </FormField>
        <ResetSubmitButton />
      </form>
    </Card>
  );
}

function ResetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending}>
      Enregistrer le mot de passe
    </Button>
  );
}
