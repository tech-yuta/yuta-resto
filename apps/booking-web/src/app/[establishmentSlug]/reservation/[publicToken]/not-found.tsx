import { EmptyState } from '@yuta/ui';
import { CalendarX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-10">
      <EmptyState
        icon={<CalendarX aria-hidden />}
        titleAs="h1"
        title="Réservation introuvable"
        description="Ce lien est invalide ou n’est plus disponible. Contactez le restaurant si vous avez besoin d’aide."
      />
    </main>
  );
}
