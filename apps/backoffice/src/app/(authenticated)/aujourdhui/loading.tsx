import { Card, Skeleton } from '@yuta/ui';

export default function TodayLoading() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true">
      <div className="border-b border-border-default pb-5">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-3 h-9 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} padding="lg" className="min-h-44">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-6 h-9 w-16" />
            <Skeleton className="mt-3 h-4 w-48 max-w-full" />
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
        <Card padding="none" className="min-h-96">
          <div className="border-b border-border-default p-5">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          </div>
          <div className="grid gap-4 p-5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        </Card>
        <div className="grid gap-5">
          <Card className="min-h-52">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-6 h-28 w-full" />
          </Card>
          <Card className="min-h-52">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-6 h-28 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
