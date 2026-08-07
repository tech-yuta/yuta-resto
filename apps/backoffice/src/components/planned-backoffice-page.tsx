import { Card, EmptyState } from '@yuta/ui';
import { Construction } from 'lucide-react';
import { BackofficePage } from './backoffice-page';

export function PlannedBackofficePage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <BackofficePage title={title} description={description}>
      <Card padding="none">
        <EmptyState
          icon={<Construction className="mx-auto h-8 w-8" aria-hidden />}
          title="Contenu à mettre à jour"
          description="Cette page cloud est prête à accueillir le contenu et les interactions du module."
        />
      </Card>
    </BackofficePage>
  );
}
