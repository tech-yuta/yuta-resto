import { Badge, Button, Card, IconButton } from '@yuta/ui';
import { Printer, X } from 'lucide-react';
import { movementTypePresentation } from './stock-movement-presentation';
import {
  formatStockCurrency,
  formatStockQuantity,
  type StockMovement,
} from './stock-movements-model';

export function StockMovementDetails({
  movement,
  onClose,
}: {
  movement: StockMovement;
  onClose: () => void;
}) {
  const config = movementTypePresentation[movement.type];
  const TypeIcon = config.icon;

  return (
    <Card padding="none" className="overflow-hidden 2xl:sticky 2xl:top-0">
      <div className="flex items-center justify-between p-4">
        <h2 className="font-black">Détail du mouvement</h2>
        <IconButton size="sm" aria-label="Fermer les détails" onClick={onClose}>
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="flex items-center justify-between border-y border-border-default px-4 py-3">
        <Badge tone={config.tone}>
          <TypeIcon className="h-4 w-4" />
          {movement.type}
        </Badge>
        <span className="text-xs font-semibold">{movement.reference}</span>
      </div>
      <div className="divide-y divide-border-default px-4">
        <DetailSection title="Informations générales">
          <DetailRows
            rows={[
              ['Date / heure', `${movement.date} ${movement.time}`],
              ['Référence', movement.reference],
              ['Type', `${movement.type} de stock`],
              ['Statut', movement.status],
              ['Utilisateur', movement.user],
              ['Note', movement.note],
            ]}
          />
        </DetailSection>
        <DetailSection title="Article">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-surface-muted text-2xl">
              {movement.emoji}
            </span>
            <div>
              <p className="font-bold">{movement.item}</p>
              <p className="text-xs text-muted">
                {movement.itemId} · {movement.category}
              </p>
            </div>
          </div>
          <DetailRows rows={[['Unité de stock', movement.unit]]} />
        </DetailSection>
        <DetailSection title="Quantité & valeur">
          <DetailRows
            rows={[
              [
                'Quantité',
                `${formatStockQuantity(movement.quantity)} ${movement.unit}`,
              ],
              ["Prix d'achat", movement.purchasePrice ?? '—'],
              ['Valeur totale', formatStockCurrency(movement.value)],
            ]}
          />
        </DetailSection>
        <DetailSection title="Emplacement">
          <DetailRows
            rows={[
              ['Zone', movement.zone],
              [
                'Emplacement précis',
                movement.shelf ?? movement.destination ?? '—',
              ],
            ]}
          />
        </DetailSection>
        {movement.supplier && (
          <DetailSection title="Fournisseur">
            <DetailRows
              rows={[
                ['Fournisseur', movement.supplier],
                ['Bon de livraison', movement.deliveryNote ?? '—'],
              ]}
            />
          </DetailSection>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border-default p-4">
        <Button variant="secondary" disabled>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button disabled>Annuler le mouvement</Button>
      </div>
    </Card>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-4">
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}

function DetailRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right font-medium leading-5">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
