'use client';

import { Button, Card, ErrorState } from '@yuta/ui';

export default function ReservationsError({ reset }: { reset: () => void }) {
  return (
    <Card padding="none">
      <ErrorState
        title="Impossible de charger les réservations"
        description="Les données sont temporairement indisponibles. Réessayez sans quitter cette page."
        action={
          <Button type="button" variant="secondary" onClick={reset}>
            Réessayer
          </Button>
        }
      />
    </Card>
  );
}
