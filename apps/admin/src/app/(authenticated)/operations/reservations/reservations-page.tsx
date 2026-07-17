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
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  Clock3,
  Download,
  Filter,
  Footprints,
  Globe2,
  Grid2X2,
  Info,
  Instagram,
  List,
  Mail,
  MessageCircle,
  MoreVertical,
  NotebookText,
  Pencil,
  Phone,
  Plus,
  Search,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';

type ReservationStatus =
  | 'Confirmée'
  | 'Installée'
  | 'À confirmer'
  | 'Terminée'
  | "Liste d'attente";

type ReservationSource =
  | 'Téléphone'
  | 'Google'
  | 'Site web'
  | 'Walk-in'
  | 'Instagram';

type Reservation = {
  id: string;
  time: string;
  period: 'Midi' | 'Soir';
  name: string;
  initials: string;
  guests: number;
  table: string;
  zone: string;
  source: ReservationSource;
  status: ReservationStatus;
  phone: string;
  email: string;
  service: 'Déjeuner' | 'Dîner';
  notes?: string[];
};

const reservations: Reservation[] = [
  {
    id: 'RES-1411',
    time: '11:45',
    period: 'Midi',
    name: 'Claire Martin',
    initials: 'CM',
    guests: 2,
    table: 'Table 03',
    zone: 'Salle principale',
    source: 'Téléphone',
    status: 'Confirmée',
    phone: '06 11 22 33 44',
    email: 'claire.martin@email.com',
    service: 'Déjeuner',
  },
  {
    id: 'RES-1412',
    time: '12:00',
    period: 'Midi',
    name: 'Antoine Dubois',
    initials: 'AD',
    guests: 4,
    table: 'Table 07',
    zone: 'Salle principale',
    source: 'Google',
    status: 'Installée',
    phone: '06 22 33 44 55',
    email: 'antoine.dubois@email.com',
    service: 'Déjeuner',
  },
  {
    id: 'RES-1413',
    time: '12:30',
    period: 'Midi',
    name: 'Lucas Petit',
    initials: 'LP',
    guests: 3,
    table: 'Terrasse',
    zone: 'Terrasse',
    source: 'Site web',
    status: 'À confirmer',
    phone: '06 33 44 55 66',
    email: 'lucas.petit@email.com',
    service: 'Déjeuner',
  },
  {
    id: 'RES-1414',
    time: '19:00',
    period: 'Soir',
    name: 'Camille Dupont',
    initials: 'CD',
    guests: 2,
    table: 'Table 02',
    zone: 'Salle principale',
    source: 'Walk-in',
    status: 'Terminée',
    phone: '06 44 55 66 77',
    email: 'camille.dupont@email.com',
    service: 'Dîner',
  },
  {
    id: 'RES-1415',
    time: '19:30',
    period: 'Soir',
    name: 'Thomas Leroy',
    initials: 'TL',
    guests: 6,
    table: 'Table 10',
    zone: 'Salle principale',
    source: 'Instagram',
    status: "Liste d'attente",
    phone: '06 55 66 77 88',
    email: 'thomas.leroy@email.com',
    service: 'Dîner',
  },
  {
    id: 'RES-1416',
    time: '20:00',
    period: 'Soir',
    name: 'Julie Bernard',
    initials: 'JB',
    guests: 4,
    table: 'Table 06',
    zone: 'Salle principale',
    source: 'Google',
    status: 'Confirmée',
    phone: '06 12 34 56 78',
    email: 'julie.bernard@email.com',
    service: 'Dîner',
    notes: ['Anniversaire 🎉', 'Chaise bébé demandée'],
  },
];

const statusTones: Record<
  ReservationStatus,
  'success' | 'info' | 'warning' | 'neutral'
> = {
  Confirmée: 'success',
  Installée: 'info',
  'À confirmer': 'warning',
  Terminée: 'neutral',
  "Liste d'attente": 'warning',
};

const sourceIcons: Record<
  ReservationSource,
  ComponentType<{ className?: string }>
> = {
  Téléphone: Phone,
  Google: Globe2,
  'Site web': Globe2,
  'Walk-in': Footprints,
  Instagram,
};

const avatarTones = [
  'bg-surface-selected text-brand-800',
  'bg-status-success-soft text-status-success',
  'bg-status-warning-soft text-status-warning',
  'bg-status-danger-soft text-status-danger',
  'bg-status-info-soft text-status-info',
];

const summaryMetrics: Array<{
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    label: "Aujourd'hui",
    value: '18',
    icon: CalendarDays,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    label: 'Confirmées',
    value: '12',
    icon: CheckCircle2,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    label: 'À confirmer',
    value: '3',
    icon: Clock3,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    label: "Liste d'attente",
    value: '4',
    icon: UsersRound,
    tone: 'bg-status-info-soft text-status-info',
  },
  {
    label: 'No-show',
    value: '1',
    icon: XCircle,
    tone: 'bg-status-danger-soft text-status-danger',
  },
];

const views = [
  { value: 'today', label: "Aujourd'hui", icon: CalendarCheck },
  { value: 'calendar', label: 'Calendrier', icon: CalendarDays },
  { value: 'list', label: 'Liste', icon: List },
  { value: 'floor', label: 'Plan de salle', icon: Grid2X2 },
] as const;

export function ReservationsPage() {
  const [view, setView] = useState<(typeof views)[number]['value']>('today');
  const [service, setService] = useState('all');
  const [zone, setZone] = useState('all');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('RES-1416');
  const [dayOffset, setDayOffset] = useState(0);

  const filteredReservations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    return reservations.filter((reservation) => {
      const searchable =
        `${reservation.name} ${reservation.phone} ${reservation.table}`.toLocaleLowerCase(
          'fr',
        );
      return (
        (service === 'all' || reservation.service === service) &&
        (zone === 'all' || reservation.zone === zone) &&
        (status === 'all' || reservation.status === status) &&
        (source === 'all' || reservation.source === source) &&
        searchable.includes(normalizedQuery)
      );
    });
  }, [query, service, source, status, zone]);

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === selectedId,
  );
  const hasFilters =
    service !== 'all' ||
    zone !== 'all' ||
    status !== 'all' ||
    source !== 'all' ||
    query.length > 0;
  const dateLabel =
    dayOffset === 0
      ? '14 juil. 2025'
      : dayOffset < 0
        ? '13 juil. 2025'
        : '15 juil. 2025';

  function resetFilters() {
    setService('all');
    setZone('all');
    setStatus('all');
    setSource('all');
    setQuery('');
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Réservations</h1>
          <p className="mt-1 text-sm text-secondary">
            Gérez vos réservations et l&apos;accueil des clients en temps réel
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="lg">
                <Download className="h-4 w-4" />
                Exporter
                <ChevronDown className="h-4 w-4 text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exporter en CSV</DropdownMenuItem>
              <DropdownMenuItem>Exporter en PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="lg">
            <Plus className="h-5 w-5" />
            Nouvelle réservation
          </Button>
        </div>
      </header>

      <Card
        padding="none"
        className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-6"
      >
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex items-center gap-3 border-b border-r border-border-default p-4 xl:border-b-0"
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
                <p className="text-xl font-black">{metric.value}</p>
                <p className="text-xs font-semibold text-secondary">
                  {metric.label}
                </p>
              </div>
            </div>
          );
        })}
        <div className="col-span-2 flex items-center gap-3 p-4 md:col-span-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-selected text-xs font-black text-brand-800">
            76%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-black">76%</p>
              <Info className="h-3.5 w-3.5 text-muted" />
            </div>
            <p className="text-xs font-semibold text-secondary">
              Taux d&apos;occupation
            </p>
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col border-b border-border-default 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <nav
            className="flex overflow-x-auto px-3"
            aria-label="Modes d'affichage"
          >
            {views.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setView(item.value)}
                  className={cn(
                    'relative inline-flex min-w-max items-center gap-2 px-4 py-4 text-sm font-semibold text-secondary transition-colors hover:text-primary',
                    view === item.value && 'text-brand-800',
                  )}
                >
                  {<Icon className="h-4 w-4" />}
                  {item.label}
                  {view === item.value && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-0 self-end p-3 2xl:self-auto">
            <IconButton
              variant="secondary"
              className="rounded-r-none"
              aria-label="Jour précédent"
              onClick={() => setDayOffset(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <div className="flex h-10 min-w-44 items-center justify-center gap-2 border-y border-border-default bg-surface px-4 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-muted" />
              {dateLabel}
            </div>
            <IconButton
              variant="secondary"
              className="rounded-l-none"
              aria-label="Jour suivant"
              onClick={() => setDayOffset(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[repeat(4,150px)_minmax(260px,1fr)_auto]">
          <Select value={service} onValueChange={setService}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Service</SelectItem>
              <SelectItem value="Déjeuner">Déjeuner</SelectItem>
              <SelectItem value="Dîner">Dîner</SelectItem>
            </SelectContent>
          </Select>
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Zone</SelectItem>
              <SelectItem value="Salle principale">Salle principale</SelectItem>
              <SelectItem value="Terrasse">Terrasse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Statut</SelectItem>
              {Object.keys(statusTones).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Source</SelectItem>
              {Object.keys(sourceIcons).map((value) => (
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
              placeholder="Rechercher un client, une réservation..."
              className="pl-10"
            />
          </div>
          <Button
            variant="secondary"
            className="relative"
            onClick={resetFilters}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasFilters && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-action-primary" />
            )}
          </Button>
        </div>
      </Card>

      {view === 'calendar' || view === 'floor' ? (
        <AlternateView view={view} onShowList={() => setView('today')} />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
          <ReservationList
            reservations={filteredReservations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {selectedReservation ? (
            <ReservationDetails
              reservation={selectedReservation}
              onClose={() => setSelectedId('')}
            />
          ) : (
            <NoSelection />
          )}
        </div>
      )}
    </div>
  );
}

function ReservationList({
  reservations: items,
  selectedId,
  onSelect,
}: {
  reservations: Reservation[];
  selectedId: string;
  onSelect(id: string): void;
}) {
  const midi = items.filter((item) => item.period === 'Midi');
  const soir = items.filter((item) => item.period === 'Soir');
  return (
    <Card padding="none" className="overflow-hidden">
      <SimpleTable className="min-w-[820px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead className="pl-5">Heure</SimpleTableHead>
            <SimpleTableHead>Client</SimpleTableHead>
            <SimpleTableHead>Couverts</SimpleTableHead>
            <SimpleTableHead>Table / Zone</SimpleTableHead>
            <SimpleTableHead>Source</SimpleTableHead>
            <SimpleTableHead>Statut</SimpleTableHead>
            <SimpleTableHead>Actions</SimpleTableHead>
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {midi.map((reservation, index) => (
            <ReservationRow
              key={reservation.id}
              reservation={reservation}
              index={index}
              selected={selectedId === reservation.id}
              onSelect={onSelect}
            />
          ))}
          {soir.length > 0 && (
            <SimpleTableRow className="hover:bg-surface">
              <SimpleTableCell
                colSpan={7}
                className="bg-surface-muted py-2 text-xs font-bold uppercase text-muted"
              >
                Soir
              </SimpleTableCell>
            </SimpleTableRow>
          )}
          {soir.map((reservation, index) => (
            <ReservationRow
              key={reservation.id}
              reservation={reservation}
              index={index + midi.length}
              selected={selectedId === reservation.id}
              onSelect={onSelect}
            />
          ))}
        </SimpleTableBody>
      </SimpleTable>
      {items.length === 0 && (
        <div className="p-14 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-semibold">Aucune réservation trouvée</p>
        </div>
      )}
      <div className="flex flex-col gap-3 border-t border-border-default px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">
          <strong className="text-primary">1–{items.length}</strong> sur 18
          réservations
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
      </div>
    </Card>
  );
}

function ReservationRow({
  reservation,
  index,
  selected,
  onSelect,
}: {
  reservation: Reservation;
  index: number;
  selected: boolean;
  onSelect(id: string): void;
}) {
  const SourceIcon = sourceIcons[reservation.source];
  return (
    <SimpleTableRow
      className={cn(
        'cursor-pointer',
        selected && 'bg-surface-selected hover:bg-surface-selected',
      )}
      onClick={() => onSelect(reservation.id)}
    >
      <SimpleTableCell
        className={cn(
          'pl-5 font-bold tabular-nums',
          selected && 'border-l-2 border-action-primary',
        )}
      >
        {reservation.time}
      </SimpleTableCell>
      <SimpleTableCell>
        <div className="flex items-center gap-3">
          <Avatar
            fallback={reservation.initials}
            size="sm"
            className={avatarTones[index % avatarTones.length]}
          />
          <span className="whitespace-nowrap font-semibold">
            {reservation.name}
          </span>
          <Phone className="h-3.5 w-3.5 text-muted" />
        </div>
      </SimpleTableCell>
      <SimpleTableCell className="whitespace-nowrap">
        {reservation.guests} pers.
      </SimpleTableCell>
      <SimpleTableCell className="whitespace-nowrap">
        {reservation.table}
      </SimpleTableCell>
      <SimpleTableCell>
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-secondary">
          <SourceIcon className="h-4 w-4 text-status-info" />
          {reservation.source}
        </span>
      </SimpleTableCell>
      <SimpleTableCell>
        <Badge
          tone={statusTones[reservation.status]}
          className="whitespace-nowrap rounded-md"
        >
          {reservation.status}
        </Badge>
      </SimpleTableCell>
      <SimpleTableCell>
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            aria-label={`Envoyer un message à ${reservation.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <MessageCircle className="h-4 w-4" />
          </IconButton>
          <IconButton
            size="sm"
            aria-label={`Appeler ${reservation.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <Phone className="h-4 w-4" />
          </IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                size="sm"
                aria-label={`Actions pour ${reservation.name}`}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Voir les détails</DropdownMenuItem>
              <DropdownMenuItem>Modifier</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>Annuler</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SimpleTableCell>
    </SimpleTableRow>
  );
}

function ReservationDetails({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose(): void;
}) {
  return (
    <Card padding="none" className="overflow-hidden xl:sticky xl:top-0">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{reservation.name}</h2>
              <Badge tone={statusTones[reservation.status]}>
                {reservation.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-secondary">
              {reservation.time}&nbsp; • &nbsp;{reservation.guests} personnes
            </p>
          </div>
          <IconButton
            size="sm"
            aria-label="Fermer les détails"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            {reservation.phone}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {reservation.email}
          </span>
        </div>
      </div>
      <div className="flex border-y border-border-default px-4">
        <button
          type="button"
          className="border-b-2 border-action-primary px-4 py-3 text-sm font-semibold text-brand-800"
        >
          Détails
        </button>
        <button
          type="button"
          className="px-4 py-3 text-sm font-semibold text-secondary"
        >
          Historique
        </button>
      </div>
      <div className="divide-y divide-border-default px-4">
        <DetailSection icon={CalendarDays} title="Réservation">
          <DetailRows
            rows={[
              ['Date', '14 juil. 2025'],
              ['Heure', reservation.time],
              ['Service', reservation.service],
              ['Zone', reservation.zone],
              ['Table assignée', reservation.table],
            ]}
          />
        </DetailSection>
        <DetailSection icon={UserRound} title="Client">
          <DetailRows
            rows={[
              ['Téléphone', reservation.phone],
              ['Email', reservation.email],
              ['Historique client', '5 visites'],
            ]}
          />
        </DetailSection>
        <DetailSection icon={NotebookText} title="Notes">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {(reservation.notes ?? ['Aucune note']).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </DetailSection>
        <div className="grid gap-2 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Globe2 className="h-4 w-4 text-muted" />
              Source
            </span>
            <span>{reservation.source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-semibold">
              <CircleAlert className="h-4 w-4 text-muted" />
              Rappel envoyé
            </span>
            <span className="text-status-success">Oui</span>
          </div>
        </div>
      </div>
      <div className="grid gap-2 border-t border-border-default p-4">
        <Button size="lg" fullWidth>
          <UsersRound className="h-5 w-5" />
          Installer les clients
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary">
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" fullWidth>
                Plus d&apos;actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Envoyer un rappel</DropdownMenuItem>
              <DropdownMenuItem>Changer la table</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>Marquer no-show</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-3">
      <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4 text-muted" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function DetailRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
      <>
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="truncate text-right font-medium text-primary">
              {value}
            </dd>
          </div>
        ))}
      </>
    </dl>
  );
}

function AlternateView({
  view,
  onShowList,
}: {
  view: 'calendar' | 'floor';
  onShowList(): void;
}) {
  const Icon = view === 'calendar' ? CalendarDays : Grid2X2;
  return (
    <Card className="grid min-h-[420px] place-items-center text-center">
      <div>
        <Icon className="mx-auto h-10 w-10 text-muted" />
        <h2 className="mt-4 text-xl font-bold">
          {view === 'calendar' ? 'Vue calendrier' : 'Plan de salle'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Sélectionnez la vue Liste pour gérer les réservations détaillées.
        </p>
        <Button variant="secondary" className="mt-4" onClick={onShowList}>
          <List className="h-4 w-4" />
          Afficher la liste
        </Button>
      </div>
    </Card>
  );
}

function NoSelection() {
  return (
    <Card className="grid min-h-48 place-items-center text-center">
      <div>
        <UserRound className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-3 font-semibold">Sélectionnez une réservation</p>
        <p className="mt-1 text-sm text-muted">
          Les détails du client apparaîtront ici.
        </p>
      </div>
    </Card>
  );
}
