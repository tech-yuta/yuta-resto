import { Button, Card } from '@yuta/ui';
import { ChevronRight, Lightbulb } from 'lucide-react';

export function CreativeInspirationCard() {
  return (
    <Card className="relative overflow-hidden bg-surface-selected">
      <div className="max-w-[240px]">
        <p className="font-bold">Besoin d&apos;inspiration ?</p>
        <p className="mt-1 text-sm text-secondary">
          Découvrez des idées adaptées à votre restaurant et à la saison.
        </p>
        <Button variant="secondary" size="sm" className="mt-4" disabled>
          Voir les idées <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Lightbulb className="absolute -bottom-3 right-4 h-20 w-20 text-brand-500/40" />
    </Card>
  );
}
