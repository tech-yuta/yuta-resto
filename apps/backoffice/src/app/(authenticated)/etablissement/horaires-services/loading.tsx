import { Card, Skeleton } from '@yuta/ui';
import { BackofficePage } from '../../../../components/backoffice-page';

export default function Loading() {
  return (
    <BackofficePage
      title="Horaires & services"
      description="Chargement des services et des jours exceptionnels…"
    >
      <Skeleton className="h-16 w-full" />
      <Card className="grid gap-3">
        <Skeleton className="h-10 w-72 max-w-full" />
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </Card>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="grid gap-3">
          <Skeleton className="h-8 w-64 max-w-full" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </Card>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </BackofficePage>
  );
}
