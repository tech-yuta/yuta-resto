import { Button, Card } from '@yuta/ui';
import { ArrowLeft, MailQuestion } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <Card padding="lg" radius="lg" className="w-full max-w-md text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-selected text-brand-800">
        <MailQuestion className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-2xl font-black">Mot de passe oublié</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">
        L&apos;envoi automatique d&apos;e-mails de réinitialisation n&apos;est
        pas encore configuré. Contactez un administrateur YuTa pour recevoir un
        lien sécurisé valable 30 minutes.
      </p>
      <Button asChild variant="secondary" className="mt-6">
        <Link href="/login">
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </Button>
    </Card>
  );
}
