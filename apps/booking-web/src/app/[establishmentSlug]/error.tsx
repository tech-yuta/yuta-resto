'use client';

import { Button, Card, ErrorState } from '@yuta/ui';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-10">
      <Card padding="none" className="w-full">
        <ErrorState
          title="Impossible de charger la réservation"
          description="Le service est temporairement indisponible. Vous pouvez réessayer dans quelques instants."
          action={
            <Button type="button" onClick={reset}>
              Réessayer
            </Button>
          }
        />
      </Card>
    </main>
  );
}
