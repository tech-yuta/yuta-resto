import { Card, Skeleton } from '@yuta/ui';

export default function GeneralInformationLoading() {
  return (
    <div className="grid gap-5">
      <div>
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Card key={index} className="min-h-52">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="mt-6 h-32 w-full" />
            </Card>
          ))}
        </div>
        <Card className="min-h-96">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-6 h-72 w-full" />
        </Card>
      </div>
    </div>
  );
}
