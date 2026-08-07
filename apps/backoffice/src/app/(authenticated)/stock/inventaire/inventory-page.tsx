'use client';

import {
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
  Switch,
  cn,
} from '@yuta/ui';
import {
  AlertTriangle,
  ArchiveX,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Euro,
  Filter,
  MoreVertical,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Scale,
  X,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type StockStatus = 'Disponible' | 'Stock faible' | 'Rupture';

type InventoryItem = {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  category: string;
  location: string;
  stock: number;
  minimum: number;
  maximum: number;
  value: number;
  status: StockStatus;
  movementDay: string;
  movementTime: string;
  supplier: string;
  packaging: string;
  purchasePrice: string;
  barcode: string;
};

const inventoryItems: InventoryItem[] = [
  {
    id: 'STK-0048',
    name: 'Bœuf mariné',
    emoji: '🥩',
    unit: 'kg',
    category: 'Viandes',
    location: 'Chambre froide',
    stock: 8.4,
    minimum: 5,
    maximum: 15,
    value: 126,
    status: 'Disponible',
    movementDay: "Aujourd'hui",
    movementTime: '09:30',
    supplier: 'Métro',
    packaging: 'Carton de 10 kg',
    purchasePrice: '15,00 € / kg',
    barcode: '3760123456789',
  },
  {
    id: 'STK-0021',
    name: 'Vermicelles frais',
    emoji: '🍜',
    unit: 'kg',
    category: 'Pâtes',
    location: 'Réserve cuisine',
    stock: 3.2,
    minimum: 4,
    maximum: 12,
    value: 19.2,
    status: 'Stock faible',
    movementDay: 'Il y a 2 h',
    movementTime: '14:10',
    supplier: 'Asia Marché',
    packaging: 'Sac de 5 kg',
    purchasePrice: '6,00 € / kg',
    barcode: '3760123456796',
  },
  {
    id: 'STK-0015',
    name: 'Lait de coco 400ml',
    emoji: '🥫',
    unit: 'unité',
    category: 'Épicerie',
    location: 'Réserve sèche',
    stock: 0,
    minimum: 6,
    maximum: 36,
    value: 0,
    status: 'Rupture',
    movementDay: 'Hier',
    movementTime: '18:45',
    supplier: 'Métro',
    packaging: 'Carton de 12',
    purchasePrice: '2,10 € / unité',
    barcode: '3760123456802',
  },
  {
    id: 'STK-0033',
    name: 'Salade iceberg',
    emoji: '🥬',
    unit: 'pièce',
    category: 'Légumes',
    location: 'Chambre froide',
    stock: 6,
    minimum: 6,
    maximum: 20,
    value: 3,
    status: 'Disponible',
    movementDay: "Aujourd'hui",
    movementTime: '08:50',
    supplier: 'Primeur local',
    packaging: 'Caisse de 10',
    purchasePrice: '0,50 € / pièce',
    barcode: '3760123456819',
  },
  {
    id: 'STK-0012',
    name: 'Sauce poisson',
    emoji: '🍶',
    unit: 'ml',
    category: 'Épicerie',
    location: 'Réserve sèche',
    stock: 725,
    minimum: 500,
    maximum: 2000,
    value: 4.35,
    status: 'Disponible',
    movementDay: "Aujourd'hui",
    movementTime: '08:20',
    supplier: 'Asia Marché',
    packaging: 'Bouteille 725 ml',
    purchasePrice: '4,35 € / bouteille',
    barcode: '3760123456826',
  },
  {
    id: 'STK-0056',
    name: 'Coca-Cola 33cl',
    emoji: '🥤',
    unit: 'unité',
    category: 'Boissons',
    location: 'Bar',
    stock: 48,
    minimum: 24,
    maximum: 96,
    value: 28.8,
    status: 'Disponible',
    movementDay: "Aujourd'hui",
    movementTime: '09:15',
    supplier: 'Coca-Cola',
    packaging: 'Pack de 24',
    purchasePrice: '0,60 € / unité',
    barcode: '3760123456833',
  },
  {
    id: 'STK-0009',
    name: 'Œufs calibre M',
    emoji: '🥚',
    unit: 'pièce',
    category: 'Produits frais',
    location: 'Chambre froide',
    stock: 12,
    minimum: 30,
    maximum: 90,
    value: 2.4,
    status: 'Stock faible',
    movementDay: 'Hier',
    movementTime: '17:30',
    supplier: 'Ferme du Centre',
    packaging: 'Plateau de 30',
    purchasePrice: '0,20 € / pièce',
    barcode: '3760123456840',
  },
  {
    id: 'STK-0037',
    name: 'Riz jasmin 5kg',
    emoji: '🍚',
    unit: 'kg',
    category: 'Épicerie',
    location: 'Réserve sèche',
    stock: 18,
    minimum: 10,
    maximum: 40,
    value: 27,
    status: 'Disponible',
    movementDay: 'Hier',
    movementTime: '16:12',
    supplier: 'Asia Marché',
    packaging: 'Sac de 5 kg',
    purchasePrice: '1,50 € / kg',
    barcode: '3760123456857',
  },
];

const statusTones: Record<StockStatus, 'success' | 'warning' | 'danger'> = {
  Disponible: 'success',
  'Stock faible': 'warning',
  Rupture: 'danger',
};

const metrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    label: 'Références actives',
    value: '248',
    helper: '+8 ce mois',
    icon: Boxes,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Stocks faibles',
    value: '12',
    helper: 'Voir la liste ›',
    icon: AlertTriangle,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: 'Ruptures',
    value: '4',
    helper: 'Voir la liste ›',
    icon: ArchiveX,
    tone: 'bg-status-danger-soft text-status-danger',
  },
  {
    label: 'Écarts à valider',
    value: '8',
    helper: 'Voir la liste ›',
    icon: Scale,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Valeur estimée',
    value: '8 420,00 €',
    helper: "Mise à jour : aujourd'hui 09:30",
    icon: Euro,
    tone: 'bg-status-success-soft text-status-success',
  },
];

const tabs = ['Stock actuel', 'Comptages', 'Écarts', 'Alertes'] as const;

export function InventoryPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>('Stock actuel');
  const [category, setCategory] = useState('all');
  const [zone, setZone] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('STK-0048');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    if (activeTab !== 'Stock actuel') return [];
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return inventoryItems.filter((item) => {
      const searchable =
        `${item.name} ${item.id} ${item.category}`.toLocaleLowerCase('fr');
      return (
        (category === 'all' || item.category === category) &&
        (zone === 'all' || item.location === zone) &&
        (status === 'all' || item.status === status) &&
        searchable.includes(normalizedQuery)
      );
    });
  }, [activeTab, category, query, status, zone]);

  const selectedItem =
    inventoryItems.find((item) => item.id === selectedId) ?? inventoryItems[0];
  const allChecked =
    filteredItems.length > 0 &&
    filteredItems.every((item) => checkedIds.includes(item.id));

  function toggleItem(id: string, checked: boolean) {
    setCheckedIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((currentId) => currentId !== id),
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Inventaire</h1>
          <p className="mt-1 text-sm text-secondary">
            Suivez vos stocks, réalisez vos comptages et identifiez les écarts.
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
          <Button size="lg">
            <Plus className="h-5 w-5" />
            Nouvel inventaire
          </Button>
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
                'flex min-w-0 items-center gap-3 border-b border-r border-border-default p-4 xl:border-b-0',
                metric.label === 'Valeur estimée' && 'col-span-2 md:col-span-1',
              )}
            >
              <div
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full',
                  metric.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-2xl font-black">{metric.value}</p>
                <p className="text-xs font-semibold text-secondary">
                  {metric.label}
                </p>
                <p className="mt-2 truncate text-xs text-brand-800">
                  {metric.helper}
                </p>
              </div>
            </div>
          );
        })}
      </Card>

      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
        <Card padding="none" className="overflow-hidden">
          <nav
            className="flex overflow-x-auto border-b border-border-default px-3"
            aria-label="Sections de l'inventaire"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative min-w-max px-5 py-4 text-sm font-semibold text-secondary',
                  activeTab === tab && 'text-brand-800',
                )}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
                )}
              </button>
            ))}
          </nav>
          <div className="grid gap-3 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[180px_180px_180px_minmax(240px,1fr)_auto]">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {[...new Set(inventoryItems.map((item) => item.category))].map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les zones</SelectItem>
                {[...new Set(inventoryItems.map((item) => item.location))].map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.keys(statusTones).map((value) => (
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
                placeholder="Rechercher un article, code, ..."
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setCategory('all');
                setZone('all');
                setStatus('all');
                setQuery('');
              }}
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
          <InventoryTable
            items={filteredItems}
            selectedId={selectedId}
            checkedIds={checkedIds}
            allChecked={allChecked}
            onSelect={setSelectedId}
            onToggle={toggleItem}
            onToggleAll={(checked) =>
              setCheckedIds(checked ? filteredItems.map((item) => item.id) : [])
            }
          />
        </Card>
        <InventoryDetails item={selectedItem} />
      </div>
    </div>
  );
}

function InventoryTable({
  items,
  selectedId,
  checkedIds,
  allChecked,
  onSelect,
  onToggle,
  onToggleAll,
}: {
  items: InventoryItem[];
  selectedId: string;
  checkedIds: string[];
  allChecked: boolean;
  onSelect(id: string): void;
  onToggle(id: string, checked: boolean): void;
  onToggleAll(checked: boolean): void;
}) {
  return (
    <>
      <SimpleTable className="min-w-[960px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead className="w-12">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label="Sélectionner tous les articles"
              />
            </SimpleTableHead>
            <SimpleTableHead>Article</SimpleTableHead>
            <SimpleTableHead>Catégorie</SimpleTableHead>
            <SimpleTableHead>Emplacement</SimpleTableHead>
            <SimpleTableHead>Stock actuel</SimpleTableHead>
            <SimpleTableHead>Seuil min.</SimpleTableHead>
            <SimpleTableHead>Valeur</SimpleTableHead>
            <SimpleTableHead>Statut</SimpleTableHead>
            <SimpleTableHead>Dernier mouvement</SimpleTableHead>
            <SimpleTableHead />
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {items.map((item) => (
            <SimpleTableRow
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'cursor-pointer',
                selectedId === item.id &&
                  'bg-surface-selected hover:bg-surface-selected',
              )}
            >
              <SimpleTableCell>
                <Checkbox
                  checked={checkedIds.includes(item.id)}
                  onCheckedChange={(value) => onToggle(item.id, value === true)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Sélectionner ${item.name}`}
                />
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-xl">
                    {item.emoji}
                  </span>
                  <div>
                    <p className="whitespace-nowrap font-bold">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.id} · {item.unit}
                    </p>
                  </div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap">
                {item.category}
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap">
                {item.location}
              </SimpleTableCell>
              <SimpleTableCell
                className={cn(
                  'whitespace-nowrap font-semibold tabular-nums',
                  item.status === 'Rupture'
                    ? 'text-status-danger'
                    : item.status === 'Stock faible'
                      ? 'text-status-warning'
                      : '',
                )}
              >
                {formatStock(item.stock, item.unit)}
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap tabular-nums">
                {formatStock(item.minimum, item.unit)}
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap font-medium tabular-nums">
                {formatCurrency(item.value)}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge
                  tone={statusTones[item.status]}
                  className="whitespace-nowrap rounded-md"
                >
                  {item.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-sm">{item.movementDay}</p>
                <p className="text-xs text-muted">{item.movementTime}</p>
              </SimpleTableCell>
              <SimpleTableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      size="sm"
                      aria-label={`Actions pour ${item.name}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ajuster le stock</DropdownMenuItem>
                    <DropdownMenuItem>Voir les mouvements</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive>
                      Archiver l&apos;article
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        </SimpleTableBody>
      </SimpleTable>
      {items.length === 0 && (
        <div className="p-16 text-center">
          <Boxes className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-semibold">Aucun article trouvé</p>
          <p className="mt-1 text-sm text-muted">
            Modifiez les filtres ou choisissez Stock actuel.
          </p>
        </div>
      )}
      <footer className="flex flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <strong>1 à {items.length}</strong> sur 248 références
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

function InventoryDetails({ item }: { item: InventoryItem }) {
  return (
    <Card padding="none" className="overflow-hidden 2xl:sticky 2xl:top-0">
      <div className="flex items-start justify-between p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-muted text-3xl">
            {item.emoji}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black">{item.name}</h2>
            <Badge tone={statusTones[item.status]} className="mt-1">
              ● {item.status}
            </Badge>
            <p className="mt-2 text-xs text-muted">
              {item.category} · {item.id}
            </p>
          </div>
        </div>
        <IconButton size="sm" aria-label="Fermer les détails">
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="flex overflow-x-auto border-y border-border-default px-3">
        <button
          type="button"
          className="min-w-max border-b-2 border-action-primary px-4 py-3 text-sm font-semibold text-brand-800"
        >
          Détails
        </button>
        <button
          type="button"
          className="min-w-max px-4 py-3 text-sm font-semibold text-secondary"
        >
          Mouvements
        </button>
        <button
          type="button"
          className="min-w-max px-4 py-3 text-sm font-semibold text-secondary"
        >
          Fiche technique
        </button>
      </div>
      <div className="divide-y divide-border-default px-4">
        <DetailSection title="Stock et emplacements">
          <DetailRows
            rows={[
              ['Stock actuel', formatStock(item.stock, item.unit)],
              ['Stock minimum', formatStock(item.minimum, item.unit)],
              ['Stock maximum', formatStock(item.maximum, item.unit)],
              ['Valeur estimée', formatCurrency(item.value)],
            ]}
          />
          <h4 className="mb-2 mt-4 text-xs font-bold">Par emplacement</h4>
          <DetailRows
            rows={[
              [
                item.location,
                formatStock(Math.max(0, item.stock - 2.4), item.unit),
              ],
              ['Cuisine', formatStock(Math.min(2.4, item.stock), item.unit)],
            ]}
          />
        </DetailSection>
        <DetailSection title="Informations d'achat">
          <DetailRows
            rows={[
              ['Fournisseur principal', item.supplier],
              ['Conditionnement', item.packaging],
              ["Prix d'achat", item.purchasePrice],
              ['Dernière réception', '12/07/2025 (10 kg)'],
              ['Délai de livraison', '2 jours'],
            ]}
          />
        </DetailSection>
        <DetailSection title="Statut et paramètres">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-muted">Suivi du stock</span>
            <Switch defaultChecked aria-label="Suivi du stock" />
          </div>
          <DetailRows
            rows={[
              ['Périssable', 'Oui'],
              ['Unité de stock', item.unit],
              ['Catégorie', item.category],
              ['Code barre', item.barcode],
            ]}
          />
        </DetailSection>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border-default p-4">
        <Button variant="secondary">
          <PackagePlus className="h-4 w-4" />
          Ajuster le stock
        </Button>
        <Button>
          <Pencil className="h-4 w-4" />
          Modifier l&apos;article
        </Button>
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
          <dd className="truncate text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatStock(value: number, unit: string) {
  const formatted = Number.isInteger(value)
    ? value.toString()
    : value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return `${formatted} ${unit}${unit === 'unité' && value !== 1 ? 's' : ''}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
