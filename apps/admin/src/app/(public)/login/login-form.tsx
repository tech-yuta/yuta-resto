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
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { loginAction, type LoginActionState } from './actions';

const initialState: LoginActionState = { error: null };

export function LoginForm({
  returnTo,
  passwordReset,
  membershipError,
}: {
  returnTo: string;
  passwordReset: boolean;
  membershipError: boolean;
}) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <Card padding="lg" radius="lg" className="w-full max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-black">Connexion</h1>
        <p className="mt-2 text-sm text-secondary">
          Accédez à votre espace de gestion YuTa.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {passwordReset && (
          <Alert tone="success">
            <AlertDescription>
              Votre mot de passe a été modifié. Vous pouvez vous connecter.
            </AlertDescription>
          </Alert>
        )}
        {membershipError && (
          <Alert tone="danger">
            <AlertDescription>
              Aucun établissement actif n&apos;est associé à ce compte.
            </AlertDescription>
          </Alert>
        )}
        {state.error && (
          <Alert tone="danger">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </div>

      <form action={formAction} className="mt-6 grid gap-5">
        <input type="hidden" name="returnTo" value={returnTo} />
        <FormField label={<Label htmlFor="email">Adresse e-mail</Label>}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="pl-10"
              placeholder="vous@restaurant.fr"
            />
          </div>
        </FormField>
        <FormField
          label={
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          }
        >
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="pl-10"
            />
          </div>
        </FormField>
        <LoginSubmitButton />
      </form>

      <p className="mt-5 text-center text-xs leading-5 text-muted">
        La session est sécurisée par un cookie HttpOnly et expire
        automatiquement.
      </p>
    </Card>
  );
}

function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth loading={pending}>
      Se connecter
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
