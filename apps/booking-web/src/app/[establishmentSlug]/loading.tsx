import { Card, Skeleton } from '@yuta/ui';

export default function Loading() {
  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-surface sm:bg-canvas sm:px-6 sm:py-10"
      aria-busy="true"
      aria-label="Chargement de la réservation"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-72 bg-surface-selected opacity-70 sm:block" />
      <div className="relative mx-auto min-h-dvh w-full max-w-[420px] sm:min-h-0">
        <Card
          padding="lg"
          radius="lg"
          className="min-h-dvh rounded-none border-0 shadow-none sm:min-h-[38rem] sm:rounded-lg sm:border sm:shadow-lg"
        >
          <Skeleton className="mx-auto h-14 w-14 rounded-full" />
          <Skeleton className="mx-auto mt-5 h-7 w-56 max-w-full" />
          <Skeleton className="mx-auto mt-3 h-4 w-72 max-w-full" />
          <div className="mt-10 grid gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>
    </main>
  );
}
