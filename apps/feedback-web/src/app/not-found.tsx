import { Card } from '@yuta/ui';

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10 text-primary">
      <Card padding="lg" radius="lg" className="w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold">Page indisponible</h1>
        <p className="mt-2 text-secondary">
          Ce lien de retour est invalide ou n&apos;est plus actif.
        </p>
      </Card>
    </main>
  );
}
