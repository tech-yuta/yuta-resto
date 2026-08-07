import { Badge, Button, Card, IconButton } from '@yuta/ui';
import { MessageCircle, PackageCheck, Pencil, X } from 'lucide-react';
import { SupplierLogo } from './supplier-logo';
import type { Supplier } from './suppliers-model';

export function SupplierDetails({ supplier }: { supplier: Supplier }) {
  return (
    <Card padding="none" className="overflow-hidden 2xl:sticky 2xl:top-0">
      <div className="flex items-start justify-between p-4">
        <div className="flex min-w-0 items-center gap-3">
          <SupplierLogo supplier={supplier} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black">{supplier.name}</h2>
              <Badge tone={supplier.status === 'Actif' ? 'success' : 'neutral'}>
                ● {supplier.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{supplier.id}</p>
          </div>
        </div>
        <IconButton size="sm" aria-label="Fermer les détails">
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="flex overflow-x-auto border-y border-border-default px-2">
        {['Détails', 'Produits', 'Commandes', 'Livraisons'].map(
          (tab, index) => (
            <button
              key={tab}
              type="button"
              className={
                index === 0
                  ? 'min-w-max border-b-2 border-action-primary px-4 py-3 text-sm font-semibold text-brand-800'
                  : 'min-w-max px-4 py-3 text-sm font-semibold text-secondary'
              }
            >
              {tab}
            </button>
          ),
        )}
      </div>
      <div className="divide-y divide-border-default px-4">
        <DetailSection title="Informations générales" editable>
          <DetailRows
            rows={[
              ['Catégorie', supplier.categories],
              ['Téléphone', supplier.phone],
              ['Email', supplier.email],
              ['Adresse', supplier.address],
              ['Zone de livraison', supplier.zone],
              ['Contact principal', 'Service Client'],
              ['Statut', supplier.status],
              ['Notes', '—'],
            ]}
          />
        </DetailSection>
        <DetailSection title="Conditions d'achat" editable>
          <DetailRows
            rows={[
              ['Paiement', `${supplier.payment} fin de mois`],
              ['Livraison', supplier.delivery],
              ['Montant minimum', supplier.minimum],
              ['Frais de livraison', supplier.shipping],
            ]}
          />
        </DetailSection>
        <DetailSection title="Statistiques">
          <DetailRows
            rows={[
              ['Achats ce mois', supplier.monthlyPurchases],
              ['Achats (12 derniers mois)', supplier.annualPurchases],
              ['Nombre de commandes', supplier.orderCount],
              ['Dernière commande', supplier.lastOrderDate],
            ]}
          />
        </DetailSection>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border-default p-4">
        <Button variant="secondary" disabled>
          <MessageCircle className="h-4 w-4" />
          Contacter
        </Button>
        <Button disabled>
          <PackageCheck className="h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>
    </Card>
  );
}

function DetailSection({
  title,
  editable,
  children,
}: {
  title: string;
  editable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">{title}</h3>
        {editable && (
          <IconButton size="sm" disabled aria-label={`Modifier ${title}`}>
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>
      {children}
    </section>
  );
}
function DetailRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right font-medium leading-5">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
