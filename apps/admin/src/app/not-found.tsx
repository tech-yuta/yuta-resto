import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <p className="text-6xl font-black text-primary/10">404</p>
      <p className="text-lg font-semibold text-primary">Page introuvable.</p>
      <p className="text-sm text-primary/50">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/today"
        className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
