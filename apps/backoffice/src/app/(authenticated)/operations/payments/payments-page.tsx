'use client';

import {
  Badge,
  Button,
  Card,
  Checkbox,
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
  BadgeEuro,
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  CircleEllipsis,
  Clock3,
  CreditCard,
  Gift,
  Link2,
  LockKeyhole,
  Printer,
  ReceiptText,
  Search,
  Ticket,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type PaymentOrder = {
  id: string;
  table: string;
  customer: string;
  customerDetail: string;
  total: number;
  createdAt: string;
  due: number;
  paid?: number;
  status: 'À encaisser' | 'Partiel';
  service: 'Dîner' | 'À emporter';
  channel: 'Sur place' | 'Click & Collect' | 'À emporter';
  server: 'Sophie' | 'Lucas';
};

const paymentOrders: PaymentOrder[] = [
  {
    id: 'CMD-248',
    table: 'Table 04',
    customer: '3 couverts',
    customerDetail: '',
    total: 68.4,
    createdAt: '19:32',
    due: 68.4,
    status: 'À encaisser',
    service: 'Dîner',
    channel: 'Sur place',
    server: 'Sophie',
  },
  {
    id: 'CMD-246',
    table: 'Table 07',
    customer: '2 couverts',
    customerDetail: '',
    total: 32,
    createdAt: '19:20',
    due: 32,
    status: 'À encaisser',
    service: 'Dîner',
    channel: 'Sur place',
    server: 'Lucas',
  },
  {
    id: 'CMD-244',
    table: 'À emporter',
    customer: 'Julie Bernard',
    customerDetail: '06 12 34 56 78',
    total: 19.9,
    createdAt: '18:55',
    due: 19.9,
    status: 'À encaisser',
    service: 'À emporter',
    channel: 'À emporter',
    server: 'Sophie',
  },
  {
    id: 'CMD-241',
    table: 'Table 02',
    customer: '4 couverts',
    customerDetail: '',
    total: 85.5,
    createdAt: '18:30',
    due: 25.5,
    paid: 60,
    status: 'Partiel',
    service: 'Dîner',
    channel: 'Sur place',
    server: 'Lucas',
  },
  {
    id: 'CMD-237',
    table: 'Click & Collect',
    customer: 'Camille Dupont',
    customerDetail: '07 23 45 67 89',
    total: 24.6,
    createdAt: '17:45',
    due: 24.6,
    status: 'À encaisser',
    service: 'À emporter',
    channel: 'Click & Collect',
    server: 'Sophie',
  },
];

const summaryMetrics: Array<{
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    label: "Chiffre d'affaires",
    value: '3 245,80 €',
    helper: "Aujourd'hui",
    icon: ChartNoAxesCombined,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Transactions',
    value: '68',
    helper: "Aujourd'hui",
    icon: WalletCards,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Ticket moyen',
    value: '47,73 €',
    helper: "Aujourd'hui",
    icon: CreditCard,
    tone: 'bg-status-info-soft text-status-info',
  },
  {
    label: 'À encaisser',
    value: '5',
    helper: 'Commandes',
    icon: Clock3,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: 'Montant à encaisser',
    value: '286,40 €',
    helper: '',
    icon: BadgeEuro,
    tone: 'bg-status-danger-soft text-status-danger',
  },
];

const tabs = [
  { value: 'due', label: 'À encaisser (5)' },
  { value: 'today', label: 'Paiements du jour' },
  { value: 'all', label: 'Toutes les transactions' },
  { value: 'refunds', label: 'Remboursements' },
  { value: 'credits', label: 'Avoirs' },
] as const;

const paymentMethods = [
  {
    value: 'card',
    label: 'Carte bancaire',
    icon: CreditCard,
    tone: 'text-brand-800',
  },
  {
    value: 'cash',
    label: 'Espèces',
    icon: Banknote,
    tone: 'text-status-success',
  },
  {
    value: 'restaurant',
    label: 'Ticket Restaurant',
    icon: Ticket,
    tone: 'text-secondary',
  },
  {
    value: 'holiday',
    label: 'Chèque-vacances',
    icon: WalletCards,
    tone: 'text-secondary',
  },
  { value: 'gift', label: 'Bon cadeau', icon: Gift, tone: 'text-secondary' },
  {
    value: 'credit',
    label: 'Avoir',
    icon: ReceiptText,
    tone: 'text-secondary',
  },
  {
    value: 'online',
    label: 'Paiement en ligne',
    icon: Link2,
    tone: 'text-secondary',
  },
  {
    value: 'other',
    label: 'Autre',
    icon: CircleEllipsis,
    tone: 'text-secondary',
  },
] as const;

export function PaymentsPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]['value']>('due');
  const [service, setService] = useState('all');
  const [channel, setChannel] = useState('all');
  const [server, setServer] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('CMD-248');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof paymentMethods)[number]['value']>('card');
  const [mixedPayment, setMixedPayment] = useState(true);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'refunds' || activeTab === 'credits') return [];
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return paymentOrders.filter((order) => {
      const searchable =
        `${order.id} ${order.table} ${order.customer} ${order.customerDetail}`.toLocaleLowerCase(
          'fr',
        );
      return (
        (service === 'all' || order.service === service) &&
        (channel === 'all' || order.channel === channel) &&
        (server === 'all' || order.server === server) &&
        searchable.includes(normalizedQuery)
      );
    });
  }, [activeTab, channel, query, server, service]);

  const selectedOrder =
    paymentOrders.find((order) => order.id === selectedId) ?? paymentOrders[0];
  const allVisibleChecked =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => checkedIds.includes(order.id));

  function toggleOrder(id: string, checked: boolean) {
    setCheckedIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((currentId) => currentId !== id),
    );
  }

  function toggleAll(checked: boolean) {
    setCheckedIds(checked ? filteredOrders.map((order) => order.id) : []);
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Paiements</h1>
          <p className="mt-1 text-sm text-secondary">
            Encaissez, gérez les règlements et suivez votre caisse.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg">
            <Printer className="h-4 w-4" />
            Ouverture de caisse
          </Button>
          <Button size="lg">
            <LockKeyhole className="h-4 w-4" />
            Clôture de caisse
          </Button>
        </div>
      </header>

      <Card
        padding="none"
        className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-5"
      >
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex min-w-0 items-center gap-3 border-b border-r border-border-default p-4 xl:border-b-0"
            >
              <div
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                  metric.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-muted">
                  {metric.label}
                </p>
                <p className="whitespace-nowrap text-xl font-black">
                  {metric.value}
                </p>
                {metric.helper && (
                  <p className="text-xs text-secondary">{metric.helper}</p>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      <Card padding="none" className="overflow-hidden">
        <nav
          className="flex overflow-x-auto border-b border-border-default px-4"
          aria-label="Catégories de paiements"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'relative min-w-max px-5 py-4 text-sm font-semibold text-secondary transition-colors hover:text-primary',
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
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[150px_170px_170px_170px_minmax(260px,1fr)]">
          <Select defaultValue="today">
            <SelectTrigger>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              <SelectItem value="Dîner">Dîner</SelectItem>
              <SelectItem value="À emporter">À emporter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les canaux</SelectItem>
              <SelectItem value="Sur place">Sur place</SelectItem>
              <SelectItem value="Click & Collect">Click & Collect</SelectItem>
              <SelectItem value="À emporter">À emporter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={server} onValueChange={setServer}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les serveurs</SelectItem>
              <SelectItem value="Sophie">Sophie</SelectItem>
              <SelectItem value="Lucas">Lucas</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une commande, table, client..."
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <PaymentOrdersTable
          orders={filteredOrders}
          selectedId={selectedId}
          checkedIds={checkedIds}
          allVisibleChecked={allVisibleChecked}
          onSelect={setSelectedId}
          onToggle={toggleOrder}
          onToggleAll={toggleAll}
        />
        <PaymentPanel
          order={selectedOrder}
          method={paymentMethod}
          mixedPayment={mixedPayment}
          onMethodChange={setPaymentMethod}
          onMixedPaymentChange={setMixedPayment}
        />
      </div>
    </div>
  );
}

function PaymentOrdersTable({
  orders,
  selectedId,
  checkedIds,
  allVisibleChecked,
  onSelect,
  onToggle,
  onToggleAll,
}: {
  orders: PaymentOrder[];
  selectedId: string;
  checkedIds: string[];
  allVisibleChecked: boolean;
  onSelect(id: string): void;
  onToggle(id: string, checked: boolean): void;
  onToggleAll(checked: boolean): void;
}) {
  const totalDue = orders.reduce((sum, order) => sum + order.due, 0);
  return (
    <Card padding="none" className="overflow-hidden">
      <SimpleTable className="min-w-[720px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead className="w-12">
              <Checkbox
                checked={allVisibleChecked}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label="Sélectionner toutes les commandes"
              />
            </SimpleTableHead>
            <SimpleTableHead>Commande / Table</SimpleTableHead>
            <SimpleTableHead>Client</SimpleTableHead>
            <SimpleTableHead>Total</SimpleTableHead>
            <SimpleTableHead>Créée</SimpleTableHead>
            <SimpleTableHead>Montant</SimpleTableHead>
            <SimpleTableHead>Statut</SimpleTableHead>
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {orders.map((order) => (
            <SimpleTableRow
              key={order.id}
              className={cn(
                'cursor-pointer',
                selectedId === order.id &&
                  'bg-surface-selected hover:bg-surface-selected',
              )}
              onClick={() => onSelect(order.id)}
            >
              <SimpleTableCell>
                <Checkbox
                  checked={checkedIds.includes(order.id)}
                  onCheckedChange={(value) =>
                    onToggle(order.id, value === true)
                  }
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Sélectionner ${order.id}`}
                />
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="font-bold">{order.id}</p>
                <p className="mt-0.5 text-xs text-muted">{order.table}</p>
              </SimpleTableCell>
              <SimpleTableCell>
                {order.customer.includes('couverts') ? (
                  <span className="inline-flex items-center gap-2 whitespace-nowrap text-secondary">
                    <UsersRound className="h-4 w-4" />
                    {order.customer}
                  </span>
                ) : (
                  <div>
                    <p className="whitespace-nowrap font-medium">
                      {order.customer}
                    </p>
                    <p className="text-xs text-muted">{order.customerDetail}</p>
                  </div>
                )}
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap font-medium tabular-nums">
                {formatCurrency(order.total)}
              </SimpleTableCell>
              <SimpleTableCell className="font-medium tabular-nums">
                {order.createdAt}
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap font-semibold tabular-nums text-status-danger">
                  {formatCurrency(order.due)}
                </p>
                {order.paid && (
                  <p className="mt-1 whitespace-nowrap text-[11px] text-muted">
                    Déjà payé : {formatCurrency(order.paid)} (Carte)
                  </p>
                )}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge
                  tone={order.status === 'Partiel' ? 'info' : 'warning'}
                  className="whitespace-nowrap rounded-md"
                >
                  {order.status}
                </Badge>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        </SimpleTableBody>
      </SimpleTable>
      {orders.length === 0 && (
        <div className="p-16 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-semibold">Aucun paiement trouvé</p>
          <p className="mt-1 text-sm text-muted">
            Modifiez les filtres ou choisissez une autre catégorie.
          </p>
        </div>
      )}
      <footer className="flex flex-col gap-2 border-t border-border-default px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          <strong>1–{orders.length}</strong> sur 5 commandes
        </span>
        <span className="text-secondary">
          Montant total à encaisser :{' '}
          <strong className="text-primary">{formatCurrency(totalDue)}</strong>
        </span>
      </footer>
    </Card>
  );
}

function PaymentPanel({
  order,
  method,
  mixedPayment,
  onMethodChange,
  onMixedPaymentChange,
}: {
  order: PaymentOrder;
  method: (typeof paymentMethods)[number]['value'];
  mixedPayment: boolean;
  onMethodChange(value: (typeof paymentMethods)[number]['value']): void;
  onMixedPaymentChange(value: boolean): void;
}) {
  const restaurantTicketAmount = Math.min(18.4, order.due);
  const cardAmount = Math.max(0, order.due - restaurantTicketAmount);
  return (
    <Card padding="none" className="overflow-hidden 2xl:sticky 2xl:top-0">
      <div className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs text-muted">Commande</p>
          <p className="mt-1 font-bold">
            {order.table}&nbsp;&nbsp;{' '}
            <span className="text-brand-800">{order.id}</span>
          </p>
        </div>
        <div className="flex items-start gap-5">
          <div className="text-right">
            <p className="font-bold tabular-nums">
              {formatCurrency(order.due)}
            </p>
            <p className="text-xs text-status-warning">À encaisser</p>
          </div>
          <IconButton size="sm" aria-label="Fermer le paiement">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button
          variant="secondary"
          fullWidth
          className="justify-between font-medium"
        >
          Détails de la commande
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between border-y border-border-default px-4 py-4">
        <span className="text-sm font-semibold">Montant à encaisser</span>
        <strong className="text-2xl tabular-nums">
          {formatCurrency(order.due)}
        </strong>
      </div>
      <div className="p-4">
        <h3 className="mb-3 text-sm font-bold">Moyens de paiement</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {paymentMethods.map((paymentMethod) => {
            const Icon = paymentMethod.icon;
            const selected = method === paymentMethod.value;
            return (
              <button
                key={paymentMethod.value}
                type="button"
                onClick={() => onMethodChange(paymentMethod.value)}
                className={cn(
                  'flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border bg-surface p-2 text-center text-xs font-medium text-secondary transition-colors hover:bg-surface-muted',
                  selected
                    ? 'border-action-primary bg-surface-selected text-brand-800 ring-1 ring-focus-ring'
                    : 'border-border-default',
                )}
              >
                <Icon className={cn('h-5 w-5', paymentMethod.tone)} />
                {paymentMethod.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="mixed-payment" className="text-sm font-bold">
            Paiement mixte
          </label>
          <Switch
            id="mixed-payment"
            checked={mixedPayment}
            onCheckedChange={onMixedPaymentChange}
          />
        </div>
        {mixedPayment && (
          <div className="overflow-hidden rounded-lg border border-border-default">
            <PaymentSplitLine
              icon={CreditCard}
              label="Carte bancaire"
              amount={cardAmount}
            />
            <PaymentSplitLine
              icon={Ticket}
              label="Ticket Restaurant"
              amount={restaurantTicketAmount}
            />
          </div>
        )}
      </div>
      <div className="border-t border-border-default p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">Rendu monnaie</span>
          <span className="tabular-nums">0,00 €</span>
        </div>
        <Button size="lg" fullWidth>
          Encaisser {formatCurrency(order.due)}
        </Button>
      </div>
    </Card>
  );
}

function PaymentSplitLine({
  icon: Icon,
  label,
  amount,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  amount: number;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border-default p-3 last:border-b-0">
      <Icon className="h-4 w-4 text-muted" />
      <span className="flex-1 text-xs font-medium text-secondary">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {formatCurrency(amount)}
      </span>
      <IconButton size="sm" aria-label={`Retirer ${label}`}>
        <X className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}
