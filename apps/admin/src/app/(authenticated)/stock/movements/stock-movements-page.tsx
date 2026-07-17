'use client';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
  cn,
} from '@yuta/ui';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Download,
  Filter,
  MoreVertical,
  Package,
  Plus,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type MovementType = 'Entrée' | 'Sortie' | 'Ajustement' | 'Transfert';

type StockMovement = {
  id: string;
  date: string;
  time: string;
  type: MovementType;
  item: string;
  itemId: string;
  emoji: string;
  category: string;
  quantity: number;
  unit: string;
  zone: string;
  destination?: string;
  reference: string;
  referenceDetail: string;
  user: string;
  userInitials: string;
  value: number;
  status: 'Validé' | 'Annulé';
  note: string;
  supplier?: string;
  deliveryNote?: string;
  shelf?: string;
  purchasePrice?: string;
};

const stockMovements: StockMovement[] = [
  {
    id: 'MVT-001',
    date: '12/07/2025',
    time: '09:30',
    type: 'Entrée',
    item: 'Bœuf mariné',
    itemId: 'STK-0048',
    emoji: '🥩',
    category: 'Viandes',
    quantity: 10,
    unit: 'kg',
    zone: 'Chambre froide',
    reference: 'BC-2025-0712-001',
    referenceDetail: 'METRO Poitiers',
    user: 'Sophie L.',
    userInitials: 'SL',
    value: 150,
    status: 'Validé',
    note: 'Réception conforme',
    supplier: 'METRO Poitiers',
    deliveryNote: 'BL-2025-0712-0456',
    shelf: 'Étagère 2',
    purchasePrice: '15,00 € / kg',
  },
  {
    id: 'MVT-002',
    date: '12/07/2025',
    time: '14:10',
    type: 'Sortie',
    item: 'Bœuf mariné',
    itemId: 'STK-0048',
    emoji: '🥩',
    category: 'Viandes',
    quantity: -1.2,
    unit: 'kg',
    zone: 'Cuisine',
    reference: 'CMD-248',
    referenceDetail: 'Vente',
    user: 'Lucas M.',
    userInitials: 'LM',
    value: -18,
    status: 'Validé',
    note: 'Sortie automatique POS',
  },
  {
    id: 'MVT-003',
    date: '12/07/2025',
    time: '18:45',
    type: 'Ajustement',
    item: 'Vermicelles frais',
    itemId: 'STK-0021',
    emoji: '🍜',
    category: 'Pâtes',
    quantity: -0.3,
    unit: 'kg',
    zone: 'Réserve cuisine',
    reference: 'ADJ-2025-0712-001',
    referenceDetail: 'Perte / casse',
    user: 'Sophie L.',
    userInitials: 'SL',
    value: -1.8,
    status: 'Validé',
    note: 'Produit détérioré',
  },
  {
    id: 'MVT-004',
    date: '11/07/2025',
    time: '16:20',
    type: 'Transfert',
    item: 'Lait de coco 400ml',
    itemId: 'STK-0015',
    emoji: '🥫',
    category: 'Épicerie',
    quantity: -6,
    unit: 'unité',
    zone: 'Réserve sèche',
    destination: 'Bar',
    reference: 'TRF-2025-0711-003',
    referenceDetail: 'Transfert interne',
    user: 'Tam P.',
    userInitials: 'TP',
    value: -13.2,
    status: 'Validé',
    note: 'Réapprovisionnement du bar',
  },
  {
    id: 'MVT-005',
    date: '11/07/2025',
    time: '10:15',
    type: 'Entrée',
    item: 'Lait de coco 400ml',
    itemId: 'STK-0015',
    emoji: '🥫',
    category: 'Épicerie',
    quantity: 12,
    unit: 'unité',
    zone: 'Réserve sèche',
    reference: 'BC-2025-0711-002',
    referenceDetail: 'Asia Store',
    user: 'Yen N.',
    userInitials: 'YN',
    value: 31.8,
    status: 'Validé',
    note: 'Réception conforme',
    supplier: 'Asia Store',
    deliveryNote: 'BL-2025-0711-0212',
    shelf: 'Étagère 4',
    purchasePrice: '2,65 € / unité',
  },
  {
    id: 'MVT-006',
    date: '10/07/2025',
    time: '21:30',
    type: 'Sortie',
    item: 'Sauce poisson',
    itemId: 'STK-0012',
    emoji: '🍶',
    category: 'Épicerie',
    quantity: -725,
    unit: 'ml',
    zone: 'Cuisine',
    reference: 'CMD-246',
    referenceDetail: 'Vente',
    user: 'Lucas M.',
    userInitials: 'LM',
    value: -4.35,
    status: 'Validé',
    note: 'Sortie automatique POS',
  },
  {
    id: 'MVT-007',
    date: '10/07/2025',
    time: '08:00',
    type: 'Entrée',
    item: 'Coca-Cola 33cl',
    itemId: 'STK-0056',
    emoji: '🥤',
    category: 'Boissons',
    quantity: 48,
    unit: 'unité',
    zone: 'Bar',
    reference: 'BC-2025-0710-001',
    referenceDetail: 'Promocash',
    user: 'Sophie L.',
    userInitials: 'SL',
    value: 28.8,
    status: 'Validé',
    note: 'Réception conforme',
    supplier: 'Promocash',
    deliveryNote: 'BL-2025-0710-0088',
    shelf: 'Réserve bar',
    purchasePrice: '0,60 € / unité',
  },
  {
    id: 'MVT-008',
    date: '09/07/2025',
    time: '17:45',
    type: 'Ajustement',
    item: 'Salade iceberg',
    itemId: 'STK-0033',
    emoji: '🥬',
    category: 'Légumes',
    quantity: -2,
    unit: 'pièce',
    zone: 'Chambre froide',
    reference: 'ADJ-2025-0709-002',
    referenceDetail: 'Périmé',
    user: 'Tam P.',
    userInitials: 'TP',
    value: -1.2,
    status: 'Validé',
    note: 'Produits périmés',
  },
];

const typeConfig: Record<
  MovementType,
  {
    tone: 'success' | 'danger' | 'warning' | 'brand';
    icon: ComponentType<{ className?: string }>;
  }
> = {
  Entrée: { tone: 'success', icon: ArrowDown },
  Sortie: { tone: 'danger', icon: ArrowUp },
  Ajustement: { tone: 'warning', icon: ArrowLeftRight },
  Transfert: { tone: 'brand', icon: Package },
};

const metrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    label: 'Entrées',
    value: '128',
    helper: '8 942,30 €',
    icon: ArrowDown,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Sorties',
    value: '245',
    helper: '-9 321,70 €',
    icon: ArrowUp,
    tone: 'bg-status-danger-soft text-status-danger',
  },
  {
    label: 'Ajustements',
    value: '18',
    helper: '-382,20 €',
    icon: ArrowLeftRight,
    tone: 'bg-status-info-soft text-status-info',
  },
  {
    label: 'Transferts',
    value: '12',
    helper: '-126,50 €',
    icon: Package,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Total mouvements',
    value: '403',
    helper: 'Cette période',
    icon: ClipboardList,
    tone: 'bg-status-warning-soft text-status-warning',
  },
];

export function StockMovementsPage() {
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [zone, setZone] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('MVT-001');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const filteredMovements = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return stockMovements.filter((movement) => {
      const searchable =
        `${movement.item} ${movement.itemId} ${movement.reference}`.toLocaleLowerCase(
          'fr',
        );
      return (
        (type === 'all' || movement.type === type) &&
        (category === 'all' || movement.category === category) &&
        (zone === 'all' || movement.zone === zone) &&
        searchable.includes(normalizedQuery)
      );
    });
  }, [category, query, type, zone]);

  const selectedMovement =
    stockMovements.find((movement) => movement.id === selectedId) ??
    stockMovements[0];
  const allChecked =
    filteredMovements.length > 0 &&
    filteredMovements.every((movement) => checkedIds.includes(movement.id));

  return (
    <div className="flex w-full flex-col gap-5">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="lg">
                <Download className="h-4 w-4" />
                Exporter
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exporter en CSV</DropdownMenuItem>
              <DropdownMenuItem>Exporter en PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5" />
                Nouveau mouvement
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Nouvelle entrée</DropdownMenuItem>
              <DropdownMenuItem>Nouvelle sortie</DropdownMenuItem>
              <DropdownMenuItem>Nouvel ajustement</DropdownMenuItem>
              <DropdownMenuItem>Nouveau transfert</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <Card
        padding="none"
        className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-5"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={cn(
                'flex min-w-0 items-center gap-4 border-b border-r border-border-default p-5 xl:border-b-0',
                metric.label === 'Total mouvements' &&
                  'col-span-2 md:col-span-1',
              )}
            >
              <div
                className={cn(
                  'grid h-12 w-12 shrink-0 place-items-center rounded-full',
                  metric.tone,
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black">{metric.value}</p>
                <p className="text-xs font-semibold text-secondary">
                  {metric.label}
                </p>
                <p className="mt-2 whitespace-nowrap text-xs font-semibold">
                  {metric.helper}
                </p>
              </div>
            </div>
          );
        })}
      </Card>
      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
        <Card padding="none" className="overflow-hidden">
          <div className="grid gap-3 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[240px_140px_170px_150px_minmax(240px,1fr)_auto]">
            <Button variant="secondary" className="justify-start">
              <CalendarDays className="h-4 w-4" />
              01/07/2025 <span className="text-muted">→</span> 31/07/2025
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.keys(typeConfig).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {[
                  ...new Set(
                    stockMovements.map((movement) => movement.category),
                  ),
                ].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les zones</SelectItem>
                {[
                  ...new Set(stockMovements.map((movement) => movement.zone)),
                ].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un article, référence..."
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setType('all');
                setCategory('all');
                setZone('all');
                setQuery('');
              }}
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
          <MovementsTable
            movements={filteredMovements}
            selectedId={selectedId}
            checkedIds={checkedIds}
            allChecked={allChecked}
            onSelect={setSelectedId}
            onToggle={(id, checked) =>
              setCheckedIds((current) =>
                checked
                  ? [...new Set([...current, id])]
                  : current.filter((currentId) => currentId !== id),
              )
            }
            onToggleAll={(checked) =>
              setCheckedIds(
                checked ? filteredMovements.map((movement) => movement.id) : [],
              )
            }
          />
        </Card>
        <MovementDetails movement={selectedMovement} />
      </div>
    </div>
  );
}

function MovementsTable({
  movements,
  selectedId,
  checkedIds,
  allChecked,
  onSelect,
  onToggle,
  onToggleAll,
}: {
  movements: StockMovement[];
  selectedId: string;
  checkedIds: string[];
  allChecked: boolean;
  onSelect(id: string): void;
  onToggle(id: string, checked: boolean): void;
  onToggleAll(checked: boolean): void;
}) {
  return (
    <>
      <SimpleTable className="min-w-[1060px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead className="w-12">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label="Sélectionner tous les mouvements"
              />
            </SimpleTableHead>
            <SimpleTableHead>Date / Heure</SimpleTableHead>
            <SimpleTableHead>Type</SimpleTableHead>
            <SimpleTableHead>Article</SimpleTableHead>
            <SimpleTableHead>Quantité</SimpleTableHead>
            <SimpleTableHead>Unité</SimpleTableHead>
            <SimpleTableHead>Zone</SimpleTableHead>
            <SimpleTableHead>Référence</SimpleTableHead>
            <SimpleTableHead>Utilisateur</SimpleTableHead>
            <SimpleTableHead>Valeur</SimpleTableHead>
            <SimpleTableHead />
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {movements.map((movement) => {
            const config = typeConfig[movement.type];
            const TypeIcon = config.icon;
            return (
              <SimpleTableRow
                key={movement.id}
                onClick={() => onSelect(movement.id)}
                className={cn(
                  'cursor-pointer',
                  movement.id === selectedId &&
                    'bg-surface-selected hover:bg-surface-selected',
                )}
              >
                <SimpleTableCell>
                  <Checkbox
                    checked={checkedIds.includes(movement.id)}
                    onCheckedChange={(value) =>
                      onToggle(movement.id, value === true)
                    }
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Sélectionner ${movement.reference}`}
                  />
                </SimpleTableCell>
                <SimpleTableCell>
                  <p className="font-medium tabular-nums">{movement.date}</p>
                  <p className="text-xs text-muted">{movement.time}</p>
                </SimpleTableCell>
                <SimpleTableCell>
                  <Badge
                    tone={config.tone}
                    className="whitespace-nowrap rounded-md"
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                    {movement.type}
                  </Badge>
                </SimpleTableCell>
                <SimpleTableCell>
                  <p className="whitespace-nowrap font-semibold">
                    {movement.item}
                  </p>
                  <p className="text-xs text-muted">{movement.itemId}</p>
                </SimpleTableCell>
                <SimpleTableCell
                  className={cn(
                    'whitespace-nowrap font-bold tabular-nums',
                    movement.quantity > 0
                      ? 'text-status-success'
                      : 'text-status-danger',
                  )}
                >
                  {formatQuantity(movement.quantity)}
                </SimpleTableCell>
                <SimpleTableCell>{movement.unit}</SimpleTableCell>
                <SimpleTableCell>
                  <p className="whitespace-nowrap">{movement.zone}</p>
                  {movement.destination && (
                    <p className="text-xs text-muted">
                      → {movement.destination}
                    </p>
                  )}
                </SimpleTableCell>
                <SimpleTableCell>
                  <p className="whitespace-nowrap font-medium">
                    {movement.reference}
                  </p>
                  <p className="text-xs text-muted">
                    {movement.referenceDetail}
                  </p>
                </SimpleTableCell>
                <SimpleTableCell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      fallback={movement.userInitials}
                      size="sm"
                      className="bg-surface-muted"
                    />
                    <span className="whitespace-nowrap">{movement.user}</span>
                  </div>
                </SimpleTableCell>
                <SimpleTableCell className="whitespace-nowrap font-medium tabular-nums">
                  {formatCurrency(movement.value)}
                </SimpleTableCell>
                <SimpleTableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton
                        size="sm"
                        aria-label={`Actions pour ${movement.reference}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                      <DropdownMenuItem>Imprimer</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive>
                        Annuler le mouvement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SimpleTableCell>
              </SimpleTableRow>
            );
          })}
        </SimpleTableBody>
      </SimpleTable>
      {movements.length === 0 && (
        <div className="p-16 text-center">
          <ArrowLeftRight className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-semibold">Aucun mouvement trouvé</p>
          <p className="mt-1 text-sm text-muted">
            Modifiez votre recherche ou vos filtres.
          </p>
        </div>
      )}
      <footer className="flex flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <strong>1 à {movements.length}</strong> sur 403 mouvements
        </p>
        <div className="flex items-center gap-2">
          <IconButton
            variant="secondary"
            size="sm"
            aria-label="Première page"
            disabled
          >
            <ChevronsLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            variant="secondary"
            size="sm"
            aria-label="Page précédente"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          {[1, 2, 3, 4, 5].map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === 1 ? 'primary' : 'secondary'}
              className="w-9 px-0"
            >
              {page}
            </Button>
          ))}
          <IconButton variant="secondary" size="sm" aria-label="Page suivante">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <IconButton variant="secondary" size="sm" aria-label="Dernière page">
            <ChevronsRight className="h-4 w-4" />
          </IconButton>
        </div>
        <Select defaultValue="25">
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </footer>
    </>
  );
}

function MovementDetails({ movement }: { movement: StockMovement }) {
  const config = typeConfig[movement.type];
  const TypeIcon = config.icon;
  return (
    <Card padding="none" className="overflow-hidden 2xl:sticky 2xl:top-0">
      <div className="flex items-center justify-between p-4">
        <h2 className="font-black">Détail du mouvement</h2>
        <IconButton size="sm" aria-label="Fermer les détails">
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
                `${formatQuantity(movement.quantity)} ${movement.unit}`,
              ],
              ["Prix d'achat", movement.purchasePrice ?? '—'],
              ['Valeur totale', formatCurrency(movement.value)],
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
        <Button variant="secondary">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button>Annuler le mouvement</Button>
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
function formatQuantity(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
