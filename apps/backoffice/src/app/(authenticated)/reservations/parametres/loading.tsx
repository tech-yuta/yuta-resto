import { Card, Skeleton } from '@yuta/ui';
import { BackofficePage } from '../../../../components/backoffice-page';

export default function Loading() {
  return (
    <BackofficePage
      title="Paramètres de réservation"
      description="Chargement des règles générales de réservation…"
    >
      <Card className="grid max-w-2xl gap-4">
        <Skeleton className="h-8 w-64 max-w-full" />
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </Card>
    </BackofficePage>
  );
}
