'use client';

import { Button, Card, ErrorState } from '@yuta/ui';
import { RotateCcw } from 'lucide-react';

export default function ErrorPage({ reset }: { reset(): void }) {
  return (
    <Card padding="none">
      <ErrorState
        title="Impossible de charger les horaires"
        description="Les horaires et les règles de réservation n’ont pas pu être chargés."
        action={
          <Button type="button" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Réessayer
          </Button>
        }
      />
    </Card>
  );
}
