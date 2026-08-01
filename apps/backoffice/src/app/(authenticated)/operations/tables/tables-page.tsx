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
  Progress,
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
  Armchair,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Grid2X2,
  List,
  Minus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  SquareStack,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type TableStatus =
  | 'Libre'
  | 'Occupée'
  | 'Réservée'
  | 'À encaisser'
  | 'À nettoyer'
  | 'Indisponible';

type RestaurantTable = {
  id: string;
  seats: number;
  status: TableStatus;
  guests?: number;
  duration?: string;
  reservation?: string;
  server?: 'Sophie' | 'Lucas';
  amount?: string;
  shape: 'round' | 'square' | 'rectangle';
};

const restaurantTables: RestaurantTable[] = [
  { id: '01', seats: 4, status: 'Libre', shape: 'square' },
  {
    id: '02',
    seats: 4,
    status: 'Occupée',
    guests: 2,
    duration: '18 min',
    shape: 'square',
  },
  {
    id: '03',
    seats: 4,
    status: 'Réservée',
    reservation: '20:00 · 4 pers.',
    shape: 'square',
  },
  { id: '04', seats: 4, status: 'Indisponible', shape: 'square' },
  {
    id: '05',
    seats: 4,
    status: 'À encaisser',
    amount: '68,40 €',
    shape: 'round',
  },
  {
    id: '06',
    seats: 4,
    status: 'Occupée',
    guests: 4,
    duration: '32 min',
    server: 'Sophie',
    amount: '58,00 €',
    shape: 'round',
  },
  {
    id: '07',
    seats: 6,
    status: 'Occupée',
    guests: 6,
    duration: '12 min',
    shape: 'rectangle',
  },
  {
    id: '08',
    seats: 4,
    status: 'À nettoyer',
    duration: '6 min',
    shape: 'square',
  },
  { id: '09', seats: 2, status: 'Libre', shape: 'round' },
  {
    id: '10',
    seats: 6,
    status: 'Occupée',
    guests: 5,
    duration: '45 min',
    server: 'Lucas',
    shape: 'square',
  },
  {
    id: '11',
    seats: 6,
    status: 'Réservée',
    reservation: '19:30 · 6 pers.',
    shape: 'rectangle',
  },
  { id: '12', seats: 4, status: 'Libre', shape: 'round' },
];

const statusConfig: Record<
  TableStatus,
  {
    tone: 'success' | 'danger' | 'info' | 'warning' | 'neutral';
    border: string;
    background: string;
    dot: string;
  }
> = {
  Libre: {
    tone: 'success',
    border: 'border-status-success',
    background: 'bg-status-success-soft',
    dot: 'bg-status-success',
  },
  Occupée: {
    tone: 'danger',
    border: 'border-status-danger',
    background: 'bg-status-danger-soft',
    dot: 'bg-status-danger',
  },
  Réservée: {
    tone: 'info',
    border: 'border-status-info',
    background: 'bg-status-info-soft',
    dot: 'bg-status-info',
  },
  'À encaisser': {
    tone: 'warning',
    border: 'border-status-warning',
    background: 'bg-status-warning-soft',
    dot: 'bg-status-warning',
  },
  'À nettoyer': {
    tone: 'neutral',
    border: 'border-border-strong',
    background: 'bg-surface-muted',
    dot: 'bg-neutral-400',
  },
  Indisponible: {
    tone: 'neutral',
    border: 'border-border-strong',
    background: 'bg-canvas',
    dot: 'bg-neutral-300',
  },
};

const metrics: Array<{
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    label: 'Occupées',
    value: '11',
    icon: Armchair,
    tone: 'bg-status-danger-soft text-status-danger',
  },
  {
    label: 'Libres',
    value: '4',
    icon: SquareStack,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'Réservées',
    value: '3',
    icon: CalendarDays,
    tone: 'bg-status-info-soft text-status-info',
  },
  {
    label: 'À encaisser',
    value: '2',
    icon: CircleDollarSign,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: 'À nettoyer',
    value: '2',
    icon: Sparkles,
    tone: 'bg-surface-muted text-secondary',
  },
];

const rooms = ['Salle principale', 'Terrasse', 'Bar'] as const;

export function TablesPage() {
  const [room, setRoom] = useState<(typeof rooms)[number]>('Salle principale');
  const [view, setView] = useState<'plan' | 'list'>('plan');
  const [status, setStatus] = useState('all');
  const [server, setServer] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('06');

  const filteredTables = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return restaurantTables.filter((table) => {
      const matchesStatus = status === 'all' || table.status === status;
      const matchesServer = server === 'all' || table.server === server;
      const matchesSearch = `table ${table.id}`.includes(normalizedQuery);
      return matchesStatus && matchesServer && matchesSearch;
    });
  }, [query, server, status]);

  const selectedTable = restaurantTables.find(
    (table) => table.id === selectedId,
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            Tables &amp; salle
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Visualisez et gérez l&apos;occupation de votre établissement
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg">
            <Pencil className="h-4 w-4" />
            Modifier le plan
          </Button>
          <Button size="lg">
            <Plus className="h-5 w-5" />
            Installer des clients
          </Button>
        </div>
      </header>

      <Card
        padding="none"
        className="grid grid-cols-2 gap-0 overflow-hidden md:grid-cols-3 lg:grid-cols-[1.15fr_repeat(5,1fr)]"
      >
        <div className="col-span-2 flex items-center gap-4 border-b border-border-default p-4 md:col-span-3 lg:col-span-1 lg:border-b-0 lg:border-r">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-selected text-sm font-black text-brand-800">
            62%
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">Occupation</p>
            <p className="mt-0.5 text-xl font-black">62 %</p>
            <Progress value={62} className="mt-1.5 h-1.5" />
            <p className="mt-1 text-xs text-muted">42 / 68 places</p>
          </div>
        </div>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex items-center gap-3 border-b border-border-default p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <div
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                  metric.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black text-primary">
                  {metric.value}
                </p>
                <p className="text-xs font-semibold text-secondary">
                  {metric.label}
                </p>
              </div>
            </div>
          );
        })}
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 p-2 2xl:flex-row 2xl:items-center">
          <nav
            className="flex min-w-0 flex-1 overflow-x-auto"
            aria-label="Zones du restaurant"
          >
            {rooms.map((roomName) => (
              <button
                key={roomName}
                type="button"
                onClick={() => setRoom(roomName)}
                className={cn(
                  'relative min-w-max px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:text-primary',
                  room === roomName && 'text-brand-800',
                )}
              >
                {roomName}
                {room === roomName && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
                )}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex rounded-lg bg-surface-muted p-1">
              <Button
                variant={view === 'plan' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('plan')}
              >
                <Grid2X2 className="h-4 w-4" />
                Plan
              </Button>
              <Button
                variant={view === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
                Liste
              </Button>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.keys(statusConfig).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={server} onValueChange={setServer}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les serveurs</SelectItem>
                <SelectItem value="Sophie">Sophie</SelectItem>
                <SelectItem value="Lucas">Lucas</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une table..."
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {view === 'plan' ? (
          <FloorPlan
            tables={filteredTables}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <TableList
            tables={filteredTables}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
        {selectedTable ? (
          <TableDetails
            table={selectedTable}
            onClose={() => setSelectedId('')}
          />
        ) : (
          <NoSelection />
        )}
      </div>
    </div>
  );
}

function FloorPlan({
  tables,
  selectedId,
  onSelect,
}: {
  tables: RestaurantTable[];
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <Card padding="none" className="relative overflow-hidden bg-surface-muted">
      <div className="flex items-center justify-center border-b border-border-default bg-surface px-4 py-3 text-sm font-semibold text-secondary">
        Entrée <ChevronDown className="ml-2 h-4 w-4" />
      </div>
      <div className="grid min-h-[620px] grid-cols-2 content-around gap-x-5 gap-y-10 p-6 sm:grid-cols-3 lg:grid-cols-4 lg:p-9">
        {tables.map((table) => (
          <FloorTable
            key={table.id}
            table={table}
            selected={table.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
      {tables.length === 0 && (
        <div className="absolute inset-12 grid place-items-center text-center">
          <div>
            <Search className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 font-semibold">Aucune table trouvée</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-default bg-surface px-5 py-3">
        {Object.entries(statusConfig).map(([label, config]) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary"
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full ring-2 ring-surface',
                config.dot,
              )}
            />
            {label}
          </span>
        ))}
        <div className="ml-auto flex gap-1">
          <IconButton variant="secondary" size="sm" aria-label="Agrandir">
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton variant="secondary" size="sm" aria-label="Réduire">
            <Minus className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </Card>
  );
}

function FloorTable({
  table,
  selected,
  onSelect,
}: {
  table: RestaurantTable;
  selected: boolean;
  onSelect(id: string): void;
}) {
  const config = statusConfig[table.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(table.id)}
      aria-label={`Table ${table.id}, ${table.status}`}
      className={cn(
        'relative mx-auto flex h-28 w-28 flex-col items-center justify-center border-2 p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md',
        config.border,
        config.background,
        table.shape === 'round'
          ? 'rounded-full'
          : table.shape === 'rectangle'
            ? 'w-36 rounded-xl'
            : 'rounded-xl',
        selected && 'ring-4 ring-focus-ring ring-offset-2',
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-lg font-black shadow-xs">
        {table.id}
      </span>
      <span className="mt-1 text-xs font-medium text-primary">
        {table.status === 'Libre'
          ? `${table.seats} places`
          : table.guests
            ? `${table.guests} pers.`
            : table.status}
      </span>
      <span className="text-[11px] text-secondary">
        {table.duration ?? table.reservation ?? table.amount}
      </span>
      <span
        className={cn('absolute left-2 top-2 h-2 w-2 rounded-full', config.dot)}
      />
      {table.server && (
        <span className="absolute -bottom-7 inline-flex items-center gap-1 rounded-full border border-border-default bg-surface px-2 py-1 text-[11px] font-semibold shadow-sm">
          <Avatar
            fallback={table.server.slice(0, 2)}
            size="sm"
            className="h-5 w-5 text-[8px]"
          />
          {table.server}
        </span>
      )}
    </button>
  );
}

function TableList({
  tables,
  selectedId,
  onSelect,
}: {
  tables: RestaurantTable[];
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <SimpleTable>
        <SimpleTableHeader>
          <SimpleTableRow>
            <SimpleTableHead>Table</SimpleTableHead>
            <SimpleTableHead>Statut</SimpleTableHead>
            <SimpleTableHead>Places</SimpleTableHead>
            <SimpleTableHead>Serveur</SimpleTableHead>
            <SimpleTableHead />
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {tables.map((table) => (
            <SimpleTableRow
              key={table.id}
              className={cn(table.id === selectedId && 'bg-surface-selected')}
            >
              <SimpleTableCell className="font-bold">
                Table {table.id}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge tone={statusConfig[table.status].tone}>
                  {table.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                {table.guests ?? 0} / {table.seats}
              </SimpleTableCell>
              <SimpleTableCell>{table.server ?? '—'}</SimpleTableCell>
              <SimpleTableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(table.id)}
                >
                  Voir
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        </SimpleTableBody>
      </SimpleTable>
      {tables.length === 0 && (
        <p className="p-12 text-center text-sm text-muted">
          Aucune table trouvée.
        </p>
      )}
    </Card>
  );
}

function TableDetails({
  table,
  onClose,
}: {
  table: RestaurantTable;
  onClose(): void;
}) {
  return (
    <Card padding="none" className="overflow-hidden xl:sticky xl:top-0">
      <div className="flex items-start justify-between p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black">Table {table.id}</h2>
            <Badge tone={statusConfig[table.status].tone}>{table.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            Depuis 18:42&nbsp; • &nbsp;{table.duration ?? 'Disponible'}
          </p>
        </div>
        <IconButton size="sm" aria-label="Fermer les détails" onClick={onClose}>
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-5">
        <DetailMetric
          icon={UsersRound}
          value={`${table.guests ?? 0}`}
          label="clients"
        />
        <DetailMetric
          icon={UserRound}
          value={table.server ?? '—'}
          label="Serveur"
        />
        <DetailMetric
          icon={Clock3}
          value={table.duration ?? '—'}
          label="Durée"
        />
      </div>
      <div className="border-t border-border-default p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Commande actuelle</h3>
          <Badge>CMD-248</Badge>
        </div>
        <div className="overflow-hidden rounded-lg border border-border-default">
          <button
            type="button"
            className="flex w-full items-center justify-between p-4 text-sm font-semibold hover:bg-surface-muted"
          >
            <span>6 articles</span>
            <span className="inline-flex items-center gap-2">
              {table.amount ?? '58,00 €'}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
          <div className="flex items-center justify-between border-t border-border-default p-4 text-sm">
            <span>Statut</span>
            <Badge tone="info">En préparation</Badge>
          </div>
        </div>
      </div>
      <div className="border-t border-border-default p-4">
        <h3 className="mb-3 font-bold">Réservation associée</h3>
        <div className="flex items-center gap-3 rounded-lg border border-border-default p-3">
          <CalendarDays className="h-5 w-5 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">14 juillet 2025 • 19:00</p>
            <p className="truncate text-xs text-muted">
              Julie Bernard&nbsp; • &nbsp;4 personnes
            </p>
          </div>
          <IconButton
            variant="secondary"
            size="sm"
            aria-label="Contacter le client"
          >
            <UserRound className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      <div className="border-t border-border-default p-4">
        <h3 className="mb-3 font-bold">Informations</h3>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">Zone</dt>
          <dd className="text-right font-medium">Salle principale</dd>
          <dt className="text-muted">Places</dt>
          <dd className="text-right font-medium">{table.seats}</dd>
          <dt className="text-muted">Heure d&apos;installation</dt>
          <dd className="text-right font-medium">18:42</dd>
          <dt className="text-muted">Note</dt>
          <dd className="text-right font-medium">Anniversaire 🎉</dd>
        </dl>
      </div>
      <div className="grid gap-2 border-t border-border-default p-4">
        <Button size="lg" fullWidth>
          Ouvrir la commande
          <ChevronRight className="ml-auto h-5 w-5" />
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary">
            <CreditCard className="h-4 w-4" />
            Encaisser
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" fullWidth>
                Plus d&apos;actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Déplacer la table</DropdownMenuItem>
              <DropdownMenuItem>Fusionner des tables</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>Libérer la table</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

function DetailMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-muted p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted" />
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function NoSelection() {
  return (
    <Card className="grid min-h-48 place-items-center text-center">
      <div>
        <Armchair className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 font-semibold">Sélectionnez une table</p>
        <p className="mt-1 text-sm text-muted">
          Les informations apparaîtront ici.
        </p>
      </div>
    </Card>
  );
}
