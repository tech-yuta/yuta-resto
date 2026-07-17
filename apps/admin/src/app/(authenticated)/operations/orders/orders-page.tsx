'use client';

import {
  Avatar,
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
  ArrowDownUp,
  Bike,
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
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Utensils,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type OrderStatus = 'En préparation' | 'Servie' | 'Terminée' | 'Annulée';
type PaymentStatus =
  | 'En attente'
  | 'Payé'
  | 'Payé en ligne'
  | 'Partiel'
  | 'Échec';
type OrderOrigin =
  | 'À emporter'
  | 'Sur place'
  | 'Click & Collect'
  | 'Borne'
  | 'Livraison';

type Order = {
  id: string;
  reference: string;
  time: string;
  date: string;
  origin: OrderOrigin;
  customer: string;
  customerDetail: string;
  items: number;
  total: string;
  payment: PaymentStatus;
  status: OrderStatus;
  server?: 'Sophie' | 'Lucas';
};

const orders: Order[] = [
  {
    id: 'CMD-248',
    reference: '#100248',
    time: '19:32',
    date: '14 juil. 2025',
    origin: 'À emporter',
    customer: 'Julie Bernard',
    customerDetail: '06 12 34 56 78',
    items: 3,
    total: '22,50 €',
    payment: 'En attente',
    status: 'En préparation',
    server: 'Sophie',
  },
  {
    id: 'CMD-247',
    reference: '#100247',
    time: '19:28',
    date: '14 juil. 2025',
    origin: 'Sur place',
    customer: 'Table 12',
    customerDetail: '4 couverts',
    items: 6,
    total: '58,00 €',
    payment: 'Payé',
    status: 'Servie',
    server: 'Lucas',
  },
  {
    id: 'CMD-246',
    reference: '#100246',
    time: '19:20',
    date: '14 juil. 2025',
    origin: 'Click & Collect',
    customer: 'Camille Dupont',
    customerDetail: '07 23 45 67 89',
    items: 2,
    total: '16,90 €',
    payment: 'Payé en ligne',
    status: 'Terminée',
  },
  {
    id: 'CMD-245',
    reference: '#100245',
    time: '19:15',
    date: '14 juil. 2025',
    origin: 'Borne',
    customer: 'Table 7',
    customerDetail: '2 couverts',
    items: 4,
    total: '31,40 €',
    payment: 'Partiel',
    status: 'En préparation',
    server: 'Sophie',
  },
  {
    id: 'CMD-244',
    reference: '#100244',
    time: '19:05',
    date: '14 juil. 2025',
    origin: 'Sur place',
    customer: 'Table 3',
    customerDetail: '3 couverts',
    items: 5,
    total: '45,80 €',
    payment: 'Payé',
    status: 'Servie',
    server: 'Lucas',
  },
  {
    id: 'CMD-243',
    reference: '#100243',
    time: '18:58',
    date: '14 juil. 2025',
    origin: 'Livraison',
    customer: 'Thomas Martin',
    customerDetail: '05 67 89 01 23',
    items: 4,
    total: '29,90 €',
    payment: 'Payé en ligne',
    status: 'Terminée',
  },
  {
    id: 'CMD-242',
    reference: '#100242',
    time: '18:45',
    date: '14 juil. 2025',
    origin: 'À emporter',
    customer: '—',
    customerDetail: '',
    items: 2,
    total: '12,00 €',
    payment: 'Échec',
    status: 'Annulée',
    server: 'Sophie',
  },
  {
    id: 'CMD-241',
    reference: '#100241',
    time: '18:30',
    date: '14 juil. 2025',
    origin: 'Sur place',
    customer: 'Table 9',
    customerDetail: '6 couverts',
    items: 7,
    total: '66,70 €',
    payment: 'Payé',
    status: 'Terminée',
    server: 'Lucas',
  },
];

const tabs = [
  { label: 'Toutes', value: 'all', count: 128 },
  { label: 'En cours', value: 'En préparation', count: 12 },
  { label: 'Terminées', value: 'Terminée', count: 111 },
  { label: 'Annulées', value: 'Annulée', count: 5 },
] as const;

const originConfig: Record<
  OrderOrigin,
  {
    icon: ComponentType<{ className?: string }>;
    tone: 'brand' | 'success' | 'info' | 'warning';
  }
> = {
  'À emporter': { icon: ShoppingBag, tone: 'brand' },
  'Sur place': { icon: ShoppingCart, tone: 'success' },
  'Click & Collect': { icon: ClipboardList, tone: 'info' },
  Borne: { icon: Store, tone: 'brand' },
  Livraison: { icon: Bike, tone: 'warning' },
};

const paymentTones: Record<PaymentStatus, 'warning' | 'success' | 'danger'> = {
  'En attente': 'warning',
  Payé: 'success',
  'Payé en ligne': 'success',
  Partiel: 'warning',
  Échec: 'danger',
};

const statusTones: Record<
  OrderStatus,
  'info' | 'success' | 'neutral' | 'danger'
> = {
  'En préparation': 'info',
  Servie: 'success',
  Terminée: 'neutral',
  Annulée: 'danger',
};

export function OrdersPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]['value']>('all');
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState('all');
  const [status, setStatus] = useState('all');
  const [service, setService] = useState('all');
  const [page, setPage] = useState(1);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return orders.filter((order) => {
      const matchesTab = activeTab === 'all' || order.status === activeTab;
      const matchesOrigin = origin === 'all' || order.origin === origin;
      const matchesStatus = status === 'all' || order.status === status;
      const matchesService = service === 'all' || order.server === service;
      const searchable =
        `${order.id} ${order.reference} ${order.customer} ${order.customerDetail}`.toLocaleLowerCase(
          'fr',
        );
      return (
        matchesTab &&
        matchesOrigin &&
        matchesStatus &&
        matchesService &&
        searchable.includes(normalizedQuery)
      );
    });
  }, [activeTab, origin, query, service, status]);

  const hasActiveFilters =
    origin !== 'all' ||
    status !== 'all' ||
    service !== 'all' ||
    query.length > 0;

  function resetFilters() {
    setQuery('');
    setOrigin('all');
    setStatus('all');
    setService('all');
    setPage(1);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            Commandes
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Consultez et gérez les commandes du restaurant
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="lg">
                <Download className="h-4 w-4" />
                Exporter
                <ChevronDown className="h-4 w-4 text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exporter au format CSV</DropdownMenuItem>
              <DropdownMenuItem>Exporter au format PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="lg">
            <Plus className="h-5 w-5" />
            Nouvelle commande
          </Button>
        </div>
      </header>

      <Card padding="none" className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={cn(
                'relative flex min-h-16 items-center justify-center gap-3 border-r border-border-default px-4 text-sm font-semibold text-secondary transition-colors last:border-r-0 hover:bg-surface-muted',
                activeTab === tab.value && 'bg-surface-selected text-brand-800',
              )}
            >
              {tab.label}
              <Badge
                tone={
                  tab.value === 'Annulée'
                    ? 'danger'
                    : tab.value === 'En préparation'
                      ? 'warning'
                      : tab.value === 'Terminée'
                        ? 'success'
                        : 'brand'
                }
                size="sm"
              >
                {tab.count}
              </Badge>
              {activeTab === tab.value && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-action-primary" />
              )}
            </button>
          ))}
        </div>
      </Card>

      <section className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Select defaultValue="today">
            <SelectTrigger className="h-12 rounded-lg">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-secondary" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={service}
            onValueChange={(value) => {
              setService(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-12 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              <SelectItem value="Sophie">Sophie</SelectItem>
              <SelectItem value="Lucas">Lucas</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={origin}
            onValueChange={(value) => {
              setOrigin(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-12 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les canaux</SelectItem>
              {Object.keys(originConfig).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-12 rounded-lg">
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
        </div>
        <div className="flex gap-3 xl:w-[480px]">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Rechercher une commande, une table..."
              size="lg"
              className="pl-11"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="relative shrink-0"
            onClick={resetFilters}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {hasActiveFilters && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-action-primary" />
            )}
          </Button>
        </div>
      </section>

      <Card padding="none" className="overflow-hidden">
        <SimpleTable className="min-w-[1120px]">
          <SimpleTableHeader className="bg-surface">
            <SimpleTableRow className="hover:bg-surface">
              <SimpleTableHead className="pl-6">Commande</SimpleTableHead>
              <SimpleTableHead>
                <span className="inline-flex items-center gap-1">
                  Heure <ArrowDownUp className="h-3 w-3" />
                </span>
              </SimpleTableHead>
              <SimpleTableHead>Origine</SimpleTableHead>
              <SimpleTableHead>Client / table</SimpleTableHead>
              <SimpleTableHead className="text-center">
                Articles
              </SimpleTableHead>
              <SimpleTableHead>Total</SimpleTableHead>
              <SimpleTableHead>Paiement</SimpleTableHead>
              <SimpleTableHead>Statut</SimpleTableHead>
              <SimpleTableHead>Serveur</SimpleTableHead>
              <SimpleTableHead className="w-12">
                <span className="sr-only">Actions</span>
              </SimpleTableHead>
            </SimpleTableRow>
          </SimpleTableHeader>
          <SimpleTableBody>
            {filteredOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </SimpleTableBody>
        </SimpleTable>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center border-t border-border-default px-6 py-16 text-center">
            <Utensils className="h-8 w-8 text-muted" />
            <p className="mt-3 font-semibold text-primary">
              Aucune commande trouvée
            </p>
            <p className="mt-1 text-sm text-muted">
              Modifiez vos filtres ou votre recherche.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={resetFilters}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        <footer className="flex flex-col gap-4 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            <strong className="text-primary">
              1–{filteredOrders.length || 0}
            </strong>{' '}
            sur 128 commandes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <IconButton
              variant="secondary"
              size="sm"
              aria-label="Première page"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </IconButton>
            <IconButton
              variant="secondary"
              size="sm"
              aria-label="Page précédente"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            {[1, 2, 3, 4, 5].map((number) => (
              <Button
                key={number}
                type="button"
                variant={page === number ? 'primary' : 'secondary'}
                size="sm"
                className="w-9 px-0"
                onClick={() => setPage(number)}
              >
                {number}
              </Button>
            ))}
            <IconButton
              variant="secondary"
              size="sm"
              aria-label="Page suivante"
              onClick={() => setPage((current) => Math.min(6, current + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
            <IconButton
              variant="secondary"
              size="sm"
              aria-label="Dernière page"
              onClick={() => setPage(6)}
            >
              <ChevronsRight className="h-4 w-4" />
            </IconButton>
          </div>
          <Select defaultValue="25">
            <SelectTrigger className="h-10 w-32 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </footer>
      </Card>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const origin = originConfig[order.origin];
  const OriginIcon = origin.icon;
  return (
    <SimpleTableRow>
      <SimpleTableCell className="pl-6">
        <p className="font-bold text-primary">{order.id}</p>
        <p className="mt-0.5 text-xs text-muted">{order.reference}</p>
      </SimpleTableCell>
      <SimpleTableCell>
        <p className="font-semibold tabular-nums">{order.time}</p>
        <p className="mt-0.5 whitespace-nowrap text-xs text-muted">
          {order.date}
        </p>
      </SimpleTableCell>
      <SimpleTableCell>
        <Badge tone={origin.tone} className="whitespace-nowrap rounded-md">
          <OriginIcon className="h-3.5 w-3.5" />
          {order.origin}
        </Badge>
      </SimpleTableCell>
      <SimpleTableCell>
        <p className="whitespace-nowrap font-medium">{order.customer}</p>
        {order.customerDetail && (
          <p className="mt-0.5 whitespace-nowrap text-xs text-muted">
            {order.customerDetail}
          </p>
        )}
      </SimpleTableCell>
      <SimpleTableCell className="text-center tabular-nums">
        {order.items}
      </SimpleTableCell>
      <SimpleTableCell className="whitespace-nowrap font-medium tabular-nums">
        {order.total}
      </SimpleTableCell>
      <SimpleTableCell>
        <Badge
          tone={paymentTones[order.payment]}
          className="whitespace-nowrap rounded-md"
        >
          {order.payment}
        </Badge>
      </SimpleTableCell>
      <SimpleTableCell>
        <Badge
          tone={statusTones[order.status]}
          className="whitespace-nowrap rounded-md"
        >
          {order.status}
        </Badge>
      </SimpleTableCell>
      <SimpleTableCell>
        {order.server ? (
          <div className="flex items-center gap-2">
            <Avatar
              fallback={order.server.slice(0, 2)}
              size="sm"
              className={
                order.server === 'Sophie'
                  ? 'bg-surface-selected text-brand-800'
                  : 'bg-status-info-soft text-status-info'
              }
            />
            <span className="font-medium">{order.server}</span>
          </div>
        ) : (
          <span className="text-muted">—</span>
        )}
      </SimpleTableCell>
      <SimpleTableCell className="pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton size="sm" aria-label={`Actions pour ${order.id}`}>
              <MoreVertical className="h-4 w-4" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Voir la commande</DropdownMenuItem>
            <DropdownMenuItem>Imprimer le ticket</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>Annuler la commande</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SimpleTableCell>
    </SimpleTableRow>
  );
}
