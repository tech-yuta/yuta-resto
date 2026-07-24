'use client';

import { Button, ErrorState } from '@yuta/ui';
import Link from 'next/link';

export default function UserManagementError() {
  return (
    <ErrorState
      title="Accès non autorisé"
      description="Seuls les owners et administrateurs autorisés peuvent gérer les utilisateurs de cet établissement."
      action={
        <Button asChild variant="secondary">
          <Link href="/today">Retour au tableau de bord</Link>
        </Button>
      }
    />
  );
}
