'use client';

import {
  Badge,
  Button,
  Card,
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Download,
  Filter,
  MessageCircle,
  MoreVertical,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  UsersRound,
  X,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type SupplierStatus = 'Actif' | 'Inactif';

type Supplier = {
  id: string;
  name: string;
  logo: string;
  logoTone: string;
  categories: string;
  phone: string;
  email: string;
  payment: string;
  delivery: string;
  lastOrderDate: string;
  lastOrderAmount: string;
  status: SupplierStatus;
  zone: string;
  address: string;
  minimum: string;
  shipping: string;
  monthlyPurchases: string;
  annualPurchases: string;
  orderCount: string;
};

const suppliers: Supplier[] = [
  {
    id: 'F-0001',
    name: 'METRO Poitiers',
    logo: 'M',
    logoTone: 'bg-status-info text-inverse',
    categories: 'Épicerie, Boissons, Produits frais',
    phone: '05 49 45 12 12',
    email: 'poitiers@metro.fr',
    payment: '30 jours',
    delivery: '24–48h',
    lastOrderDate: '12/07/2025',
    lastOrderAmount: '356,20 €',
    status: 'Actif',
    zone: 'Poitiers et alentours',
    address: '15 Rue des Frères Lumière, 86000 Poitiers',
    minimum: '150,00 €',
    shipping: 'Gratuit dès 300,00 €',
    monthlyPurchases: '356,20 €',
    annualPurchases: '4 256,80 €',
    orderCount: '18',
  },
  {
    id: 'F-0002',
    name: 'Promocash Poitiers',
    logo: 'PC',
    logoTone: 'bg-status-danger text-inverse',
    categories: 'Viandes, Produits surgelés',
    phone: '05 49 62 34 34',
    email: 'poitiers@promocash.fr',
    payment: '30 jours',
    delivery: '24h',
    lastOrderDate: '10/07/2025',
    lastOrderAmount: '542,80 €',
    status: 'Actif',
    zone: 'Poitiers',
    address: '8 Avenue de la Loge, 86000 Poitiers',
    minimum: '100,00 €',
    shipping: '15,00 €',
    monthlyPurchases: '542,80 €',
    annualPurchases: '6 890,00 €',
    orderCount: '24',
  },
  {
    id: 'F-0003',
    name: 'Asia Store',
    logo: 'AS',
    logoTone: 'bg-status-danger-soft text-status-danger',
    categories: 'Produits asiatiques, Épicerie',
    phone: '05 49 88 10 29',
    email: 'contact@asia-store.fr',
    payment: 'Comptant',
    delivery: 'Enlèvement',
    lastOrderDate: '08/07/2025',
    lastOrderAmount: '128,60 €',
    status: 'Actif',
    zone: 'Poitiers',
    address: '21 Rue Carnot, 86000 Poitiers',
    minimum: '50,00 €',
    shipping: 'Enlèvement',
    monthlyPurchases: '385,80 €',
    annualPurchases: '3 840,40 €',
    orderCount: '31',
  },
  {
    id: 'F-0004',
    name: 'Fresh Express',
    logo: 'F',
    logoTone: 'bg-status-success text-inverse',
    categories: 'Fruits & Légumes',
    phone: '06 12 34 56 78',
    email: 'commande@fresh.fr',
    payment: '7 jours',
    delivery: 'Quotidienne',
    lastOrderDate: "Aujourd'hui",
    lastOrderAmount: '78,40 €',
    status: 'Actif',
    zone: 'Vienne',
    address: '4 Route du Marché, 86180 Buxerolles',
    minimum: '40,00 €',
    shipping: 'Gratuit',
    monthlyPurchases: '940,80 €',
    annualPurchases: '9 480,00 €',
    orderCount: '96',
  },
  {
    id: 'F-0005',
    name: 'Boucherie du Centre',
    logo: 'BC',
    logoTone: 'bg-primary text-inverse',
    categories: 'Viandes fraîches',
    phone: '05 49 41 22 33',
    email: 'contact@boucherie-centre.fr',
    payment: '15 jours',
    delivery: 'À la demande',
    lastOrderDate: '05/07/2025',
    lastOrderAmount: '215,90 €',
    status: 'Actif',
    zone: 'Poitiers',
    address: '6 Place du Marché, 86000 Poitiers',
    minimum: '80,00 €',
    shipping: 'Gratuit',
    monthlyPurchases: '680,20 €',
    annualPurchases: '7 920,00 €',
    orderCount: '42',
  },
  {
    id: 'F-0006',
    name: 'Paprec',
    logo: 'P',
    logoTone: 'bg-status-info-soft text-status-info',
    categories: 'Emballages, Jetables',
    phone: '05 49 01 02 03',
    email: 'poitiers@paprec.com',
    payment: '30 jours',
    delivery: '48h',
    lastOrderDate: '01/07/2025',
    lastOrderAmount: '96,30 €',
    status: 'Inactif',
    zone: 'Nouvelle-Aquitaine',
    address: 'Zone industrielle République, 86000 Poitiers',
    minimum: '100,00 €',
    shipping: '20,00 €',
    monthlyPurchases: '0,00 €',
    annualPurchases: '1 245,00 €',
    orderCount: '7',
  },
  {
    id: 'F-0007',
    name: 'LDC',
    logo: 'LDC',
    logoTone: 'bg-status-danger text-inverse',
    categories: 'Poulet, Volaille',
    phone: '05 49 18 77 66',
    email: 'commande@ldc.fr',
    payment: '30 jours',
    delivery: '48h',
    lastOrderDate: '28/06/2025',
    lastOrderAmount: '482,10 €',
    status: 'Actif',
    zone: 'Vienne',
    address: '12 Route de Châtellerault, 86000 Poitiers',
    minimum: '200,00 €',
    shipping: 'Gratuit dès 400,00 €',
    monthlyPurchases: '964,20 €',
    annualPurchases: '11 480,00 €',
    orderCount: '36',
  },
];

const metrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    label: 'Fournisseurs actifs',
    value: '24',
    helper: '+2 ce mois',
    icon: UsersRound,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Commandes en cours',
    value: '12',
    helper: '8 430,50 €',
    icon: ShoppingCart,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: 'Livraisons prévues',
    value: '5',
    helper: 'Cette semaine',
    icon: Truck,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Achats ce mois',
    value: '18 769,30 €',
    helper: '-6,2% vs mois dernier',
    icon: CreditCard,
    tone: 'bg-status-info-soft text-status-info',
  },
];

const supplierTabs = [
  { value: 'all', label: 'Tous (28)' },
  { value: 'Actif', label: 'Actifs (24)' },
  { value: 'Inactif', label: 'Inactifs (4)' },
] as const;

export function SuppliersPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof supplierTabs)[number]['value']>('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [zone, setZone] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('F-0001');

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return suppliers.filter((supplier) => {
      const searchable =
        `${supplier.name} ${supplier.id} ${supplier.categories}`.toLocaleLowerCase(
          'fr',
        );
      return (
        (activeTab === 'all' || supplier.status === activeTab) &&
        (category === 'all' || supplier.categories.includes(category)) &&
        (status === 'all' || supplier.status === status) &&
        (zone === 'all' || supplier.zone.includes(zone)) &&
        searchable.includes(normalizedQuery)
      );
    });
  }, [activeTab, category, query, status, zone]);

  const selectedSupplier =
    suppliers.find((supplier) => supplier.id === selectedId) ?? suppliers[0];

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Fournisseurs</h1>
          <p className="mt-1 text-sm text-secondary">
            Gérez vos fournisseurs et les informations d&apos;achat.
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
            Nouveau fournisseur
          </Button>
        </div>
      </header>
      <Card
        padding="none"
        className="grid grid-cols-2 overflow-hidden lg:grid-cols-4"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex min-w-0 items-center gap-4 border-b border-r border-border-default p-5 lg:border-b-0"
            >
              <div
                className={cn(
                  'grid h-12 w-12 shrink-0 place-items-center rounded-full',
                  metric.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'truncate font-black',
                    metric.label === 'Achats ce mois' ? 'text-xl' : 'text-2xl',
                  )}
                >
                  {metric.value}
                </p>
                <p className="text-xs font-semibold text-secondary">
                  {metric.label}
                </p>
                <p
                  className={cn(
                    'mt-2 truncate text-xs',
                    metric.label === 'Commandes en cours'
                      ? 'text-status-warning'
                      : 'text-status-success',
                  )}
                >
                  {metric.helper}
                </p>
              </div>
            </div>
          );
        })}
      </Card>
      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card padding="none" className="overflow-hidden">
          <nav
            className="flex overflow-x-auto border-b border-border-default px-4"
            aria-label="Statut des fournisseurs"
          >
            {supplierTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'relative min-w-max px-5 py-4 text-sm font-semibold text-secondary',
                  activeTab === tab.value && 'text-brand-800',
                )}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
                )}
              </button>
            ))}
          </nav>
          <div className="grid gap-3 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[minmax(250px,1fr)_170px_140px_150px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un fournisseur, produit..."
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="Épicerie">Épicerie</SelectItem>
                <SelectItem value="Viandes">Viandes</SelectItem>
                <SelectItem value="Boissons">Boissons</SelectItem>
                <SelectItem value="Emballages">Emballages</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes zones</SelectItem>
                <SelectItem value="Poitiers">Poitiers</SelectItem>
                <SelectItem value="Vienne">Vienne</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                setCategory('all');
                setStatus('all');
                setZone('all');
                setQuery('');
              }}
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
          <SuppliersTable
            suppliers={filteredSuppliers}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Card>
        <SupplierDetails supplier={selectedSupplier} />
      </div>
    </div>
  );
}

function SuppliersTable({
  suppliers: items,
  selectedId,
  onSelect,
}: {
  suppliers: Supplier[];
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <>
      <SimpleTable className="min-w-[820px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead>Fournisseur</SimpleTableHead>
            <SimpleTableHead>Catégorie</SimpleTableHead>
            <SimpleTableHead>Contact</SimpleTableHead>
            <SimpleTableHead>Conditions</SimpleTableHead>
            <SimpleTableHead>Dernière commande</SimpleTableHead>
            <SimpleTableHead>Statut</SimpleTableHead>
            <SimpleTableHead>Actions</SimpleTableHead>
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {items.map((supplier) => (
            <SimpleTableRow
              key={supplier.id}
              onClick={() => onSelect(supplier.id)}
              className={cn(
                'cursor-pointer',
                supplier.id === selectedId &&
                  'bg-surface-selected hover:bg-surface-selected',
              )}
            >
              <SimpleTableCell>
                <div className="flex items-center gap-3">
                  <SupplierLogo supplier={supplier} size="sm" />
                  <div>
                    <p className="whitespace-nowrap font-bold">
                      {supplier.name}
                    </p>
                    <p className="text-xs text-muted">{supplier.id}</p>
                  </div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="max-w-44 text-xs leading-5">
                {supplier.categories}
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-sm">{supplier.phone}</p>
                <p className="whitespace-nowrap text-xs text-muted">
                  {supplier.email}
                </p>
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-xs">
                  Paiement : {supplier.payment}
                </p>
                <p className="whitespace-nowrap text-xs">
                  Livraison : {supplier.delivery}
                </p>
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-sm">
                  {supplier.lastOrderDate}
                </p>
                <p className="text-xs font-medium">
                  {supplier.lastOrderAmount}
                </p>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge
                  tone={supplier.status === 'Actif' ? 'success' : 'neutral'}
                  className="rounded-md"
                >
                  {supplier.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      size="sm"
                      aria-label={`Actions pour ${supplier.name}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                    <DropdownMenuItem>Nouvelle commande</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive>Désactiver</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        </SimpleTableBody>
      </SimpleTable>
      {items.length === 0 && (
        <div className="p-16 text-center">
          <Truck className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-semibold">Aucun fournisseur trouvé</p>
          <p className="mt-1 text-sm text-muted">
            Modifiez votre recherche ou vos filtres.
          </p>
        </div>
      )}
      <footer className="flex flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <strong>1 à {items.length}</strong> sur 28 fournisseurs
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
          <Button size="sm" className="w-9 px-0">
            1
          </Button>
          <Button variant="secondary" size="sm" className="w-9 px-0">
            2
          </Button>
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

function SupplierDetails({ supplier }: { supplier: Supplier }) {
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
          Produits
        </button>
        <button
          type="button"
          className="min-w-max px-4 py-3 text-sm font-semibold text-secondary"
        >
          Commandes
        </button>
        <button
          type="button"
          className="min-w-max px-4 py-3 text-sm font-semibold text-secondary"
        >
          Livraisons
        </button>
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
        <Button variant="secondary">
          <MessageCircle className="h-4 w-4" />
          Contacter
        </Button>
        <Button>
          <PackageCheck className="h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>
    </Card>
  );
}

function SupplierLogo({
  supplier,
  size,
}: {
  supplier: Supplier;
  size: 'sm' | 'lg';
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-black shadow-xs',
        supplier.logoTone,
        size === 'lg' ? 'h-14 w-14 text-sm' : 'h-10 w-10 text-[10px]',
      )}
    >
      {supplier.logo}
    </span>
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
          <IconButton size="sm" aria-label={`Modifier ${title}`}>
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
