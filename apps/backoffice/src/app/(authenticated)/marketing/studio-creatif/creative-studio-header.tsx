import { Badge, Button } from '@yuta/ui';
import { CircleHelp, Settings } from 'lucide-react';

export function CreativeStudioHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">
            Création visuelle
          </h1>
          <Badge tone="brand" variant="soft">
            IA
          </Badge>
        </div>
        <p className="mt-1 text-sm text-secondary">
          Générez des visuels professionnels avec l&apos;IA, selon le style de
          votre restaurant.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="lg" disabled>
          <CircleHelp className="h-4 w-4" />
          Guide d&apos;utilisation
        </Button>
        <Button variant="secondary" size="lg" disabled>
          <Settings className="h-4 w-4" />
          Paramètres de style
        </Button>
      </div>
    </header>
  );
}
