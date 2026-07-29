'use client';

import type { LocalUser } from '@yuta/contracts/local-pos';
import {
  Alert,
  AlertDescription,
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { LockKeyhole } from 'lucide-react';
import { useActionState, useState } from 'react';
import { signInManagementAction, type ManagementLoginState } from '../actions';

const initialState: ManagementLoginState = { error: null };

export function ManagementLoginForm({ users }: { users: LocalUser[] }) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '');
  const [state, formAction, pending] = useActionState(
    signInManagementAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="userId" value={selectedUserId} />
      <FormField label="Utilisateur">
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un utilisateur" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} · {roleLabel(user.role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Code PIN" hint="Saisissez entre 4 et 8 chiffres.">
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          minLength={4}
          maxLength={8}
          pattern="[0-9]{4,8}"
          required
          className="text-center text-xl tracking-[0.35em]"
        />
      </FormField>

      {state.error && (
        <Alert tone="danger">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={pending}
        disabled={users.length === 0 || selectedUserId.length === 0}
        fullWidth
      >
        <LockKeyhole className="h-5 w-5" />
        Ouvrir la gestion
      </Button>
    </form>
  );
}

function roleLabel(role: LocalUser['role']): string {
  return role === 'admin' ? 'Administrateur' : 'Manager';
}
