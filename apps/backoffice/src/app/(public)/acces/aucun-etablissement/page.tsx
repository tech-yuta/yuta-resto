import { Button, Card } from '@yuta/ui';
import { CircleOff } from 'lucide-react';
import Link from 'next/link';

export default function NoEstablishmentPage() {
  return (
    <Card padding="lg" className="w-full max-w-lg text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-secondary">
        <CircleOff className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-primary">
        Aucun établissement disponible
      </h1>
      <p className="mt-2 text-sm leading-6 text-secondary">
        Votre compte ne dispose d’aucun accès actif au back-office restaurant.
        Contactez l’assistance YuTa ou le propriétaire de votre établissement.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/connexion">Revenir à la connexion</Link>
      </Button>
    </Card>
  );
}
