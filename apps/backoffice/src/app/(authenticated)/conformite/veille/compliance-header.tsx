import { Button } from '@yuta/ui';
import { Download, Plus, ShieldCheck } from 'lucide-react';

export function ComplianceHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          Veille &amp; conformité
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Anticipez les obligations, suivez vos actions et préparez vos
          contrôles.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="lg" disabled>
          <Download className="h-4 w-4" />
          Exporter le dossier
        </Button>
        <Button variant="secondary" size="lg" disabled>
          <ShieldCheck className="h-4 w-4" />
          Préparer un contrôle
        </Button>
        <Button size="lg" disabled>
          <Plus className="h-5 w-5" />
          Ajouter une obligation
        </Button>
      </div>
    </header>
  );
}
