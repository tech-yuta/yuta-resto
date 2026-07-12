'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
          <p className="text-lg font-semibold text-primary">Erreur critique.</p>
          <p className="text-sm text-primary/50">{error.message}</p>
          <button
            onClick={reset}
            className="rounded-lg bg-action-primary px-4 py-2 text-sm font-medium text-white hover:bg-action-primary-hover"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
