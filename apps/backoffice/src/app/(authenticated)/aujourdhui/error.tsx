'use client';

import { Button, Card, ErrorState } from '@yuta/ui';

export default function TodayError({ reset }: { reset: () => void }) {
  return (
    <Card padding="none">
      <ErrorState
        title="Impossible de charger la journée"
        description="Les données du tableau de bord sont temporairement indisponibles."
        action={
          <Button type="button" variant="secondary" onClick={reset}>
            Réessayer
          </Button>
        }
      />
    </Card>
  );
}
