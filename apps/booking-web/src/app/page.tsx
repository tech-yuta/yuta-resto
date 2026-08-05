import { EmptyState } from '@yuta/ui';
import { Utensils } from 'lucide-react';

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <EmptyState
        icon={<Utensils aria-hidden />}
        title="Réservation YuTa"
        description="Utilisez le lien de réservation fourni par votre restaurant."
      />
    </main>
  );
}
