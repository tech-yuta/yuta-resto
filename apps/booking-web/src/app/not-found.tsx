import { EmptyState } from '@yuta/ui';
import { CalendarX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <EmptyState
        icon={<CalendarX aria-hidden />}
        titleAs="h1"
        title="Réservation indisponible"
        description="Ce restaurant n'accepte pas de réservation en ligne pour le moment."
      />
    </main>
  );
}
