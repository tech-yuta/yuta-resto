import { Button, Card, EmptyState } from '@yuta/ui';
import { CalendarX } from 'lucide-react';
import Link from 'next/link';
import { BackofficePage } from '../../../../components/backoffice-page';

export default function NotFound() {
  return (
    <BackofficePage title="Réservation introuvable">
      <Card padding="none">
        <EmptyState
          icon={<CalendarX aria-hidden />}
          title="Réservation introuvable ou inaccessible"
          description="Cette réservation n’existe pas dans l’établissement actif ou vous ne pouvez pas y accéder."
          action={
            <Button asChild>
              <Link href="/reservations">Retour aux réservations</Link>
            </Button>
          }
        />
      </Card>
    </BackofficePage>
  );
}
