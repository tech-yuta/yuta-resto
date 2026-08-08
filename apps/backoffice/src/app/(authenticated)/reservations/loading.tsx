import { Card, Skeleton } from '@yuta/ui';

export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-6" aria-busy="true">
      <div className="border-b border-border-default pb-5">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-3 h-9 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
      <Card padding="none" className="overflow-hidden">
        <div className="grid gap-4 border-b border-border-default p-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
        <div className="grid gap-3 p-5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
