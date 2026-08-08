import { Button } from '@yuta/ui';
import { Download, Plus } from 'lucide-react';

export function StockMovementsHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          Entrées / sorties
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Consultez l&apos;historique de tous les mouvements de stock.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="lg" disabled>
          <Download className="h-4 w-4" />
          Exporter
        </Button>
        <Button size="lg" disabled>
          <Plus className="h-5 w-5" />
          Nouveau mouvement
        </Button>
      </div>
    </header>
  );
}
