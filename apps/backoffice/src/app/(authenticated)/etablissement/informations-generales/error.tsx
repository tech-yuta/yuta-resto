'use client';

import { Button, Card, ErrorState } from '@yuta/ui';

export default function GeneralInformationError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <Card padding="none">
      <ErrorState
        title="Impossible de charger les informations"
        description="Les données de l’établissement sont temporairement indisponibles."
        action={
          <Button type="button" variant="secondary" onClick={reset}>
            Réessayer
          </Button>
        }
      />
    </Card>
  );
}
