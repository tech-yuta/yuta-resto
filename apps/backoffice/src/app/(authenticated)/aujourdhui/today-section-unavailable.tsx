import { Button, ErrorState } from '@yuta/ui';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function TodaySectionUnavailable() {
  return (
    <ErrorState
      title="Données temporairement indisponibles"
      description="Réessayez dans quelques instants."
      action={
        <Button asChild variant="secondary" size="sm">
          <Link href="/aujourdhui">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Réessayer
          </Link>
        </Button>
      }
      className="min-h-48"
    />
  );
}
