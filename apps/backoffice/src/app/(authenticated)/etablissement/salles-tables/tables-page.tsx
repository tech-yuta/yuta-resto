'use client';

import { Badge, Button, Card, cn } from '@yuta/ui';
import { Armchair, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BackofficePage } from '../../../../components/backoffice-page';
import { PrototypeBackofficeNotice } from '../../../../components/prototype-backoffice-notice';

type TableAvailability = 'Disponible' | 'Réservée' | 'Indisponible';

type RestaurantTable = {
  id: string;
  room: 'Salle principale' | 'Terrasse' | 'Bar';
  seats: number;
  availability: TableAvailability;
  reservation?: string;
  shape: 'round' | 'square' | 'rectangle';
};

const restaurantTables: readonly RestaurantTable[] = [
  {
    id: '01',
    room: 'Salle principale',
    seats: 4,
    availability: 'Disponible',
    shape: 'square',
  },
  {
    id: '02',
    room: 'Salle principale',
    seats: 4,
    availability: 'Disponible',
    shape: 'square',
  },
  {
    id: '03',
    room: 'Salle principale',
    seats: 4,
    availability: 'Réservée',
    reservation: '20:00 · 4 pers.',
    shape: 'square',
  },
  {
    id: '04',
    room: 'Salle principale',
    seats: 6,
    availability: 'Indisponible',
    shape: 'rectangle',
  },
  {
    id: '05',
    room: 'Salle principale',
    seats: 2,
    availability: 'Réservée',
    reservation: '19:30 · 2 pers.',
    shape: 'round',
  },
  {
    id: '06',
    room: 'Salle principale',
    seats: 6,
    availability: 'Disponible',
    shape: 'rectangle',
  },
  {
    id: 'T1',
    room: 'Terrasse',
    seats: 2,
    availability: 'Disponible',
    shape: 'round',
  },
  {
    id: 'T2',
    room: 'Terrasse',
    seats: 4,
    availability: 'Réservée',
    reservation: '12:30 · 4 pers.',
    shape: 'round',
  },
  {
    id: 'T3',
    room: 'Terrasse',
    seats: 4,
    availability: 'Disponible',
    shape: 'square',
  },
  {
    id: 'B1',
    room: 'Bar',
    seats: 2,
    availability: 'Disponible',
    shape: 'rectangle',
  },
  {
    id: 'B2',
    room: 'Bar',
    seats: 2,
    availability: 'Indisponible',
    shape: 'rectangle',
  },
];

const rooms = ['Salle principale', 'Terrasse', 'Bar'] as const;

const availabilityStyle: Record<TableAvailability, string> = {
  Disponible:
    'border-status-success bg-status-success-soft text-status-success',
  Réservée: 'border-status-info bg-status-info-soft text-status-info',
  Indisponible: 'border-border-strong bg-surface-muted text-muted',
};

const availabilityTone: Record<
  TableAvailability,
  'success' | 'info' | 'neutral'
> = {
  Disponible: 'success',
  Réservée: 'info',
  Indisponible: 'neutral',
};

export function TablesPage() {
  const [room, setRoom] = useState<(typeof rooms)[number]>('Salle principale');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const tables = useMemo(
    () => restaurantTables.filter((table) => table.room === room),
    [room],
  );
  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? null;

  return (
    <BackofficePage
      title="Salle & tables"
      description="Visualisez les zones, la capacité et les tables disponibles pour les réservations."
    >
      <PrototypeBackofficeNotice />
      <div className="flex flex-wrap gap-2" aria-label="Zones du restaurant">
        {rooms.map((item) => (
          <Button
            key={item}
            type="button"
            variant={room === item ? 'primary' : 'outline'}
            size="sm"
            aria-pressed={room === item}
            onClick={() => {
              setRoom(item);
              setSelectedTableId(null);
            }}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card padding="lg">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{room}</h2>
              <p className="text-sm text-muted">{tables.length} tables</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['Disponible', 'Réservée', 'Indisponible'] as const).map(
                (status) => (
                  <Badge
                    key={status}
                    tone={availabilityTone[status]}
                    variant="soft"
                  >
                    {status}
                  </Badge>
                ),
              )}
            </div>
          </div>

          <div className="grid min-h-96 grid-cols-2 gap-5 rounded-xl border border-dashed border-border-default bg-surface-muted/40 p-6 sm:grid-cols-3">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                aria-label={`Table ${table.id}, ${table.seats} places, ${table.availability}`}
                aria-pressed={selectedTableId === table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={cn(
                  'm-auto flex min-h-24 min-w-24 flex-col items-center justify-center border-2 p-3 text-center font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  table.shape === 'round'
                    ? 'rounded-full'
                    : table.shape === 'rectangle'
                      ? 'w-full rounded-xl'
                      : 'rounded-xl',
                  availabilityStyle[table.availability],
                  selectedTableId === table.id &&
                    'ring-2 ring-ring ring-offset-2',
                )}
              >
                <span>Table {table.id}</span>
                <span className="mt-1 flex items-center gap-1 text-xs font-medium opacity-75">
                  <Users className="h-3.5 w-3.5" aria-hidden /> {table.seats}{' '}
                  places
                </span>
                {table.reservation && (
                  <span className="mt-1 text-xs">{table.reservation}</span>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          {selectedTable ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-muted">
                  <Armchair className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="font-semibold">Table {selectedTable.id}</h2>
                  <p className="text-sm text-muted">{selectedTable.room}</p>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Capacité</dt>
                  <dd className="font-semibold">
                    {selectedTable.seats} places
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Disponibilité</dt>
                  <dd>
                    <Badge tone={availabilityTone[selectedTable.availability]}>
                      {selectedTable.availability}
                    </Badge>
                  </dd>
                </div>
                {selectedTable.reservation && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Réservation</dt>
                    <dd className="font-semibold">
                      {selectedTable.reservation}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Armchair className="h-8 w-8 text-muted" aria-hidden />
              <p className="mt-3 font-semibold">Sélectionnez une table</p>
              <p className="mt-1 text-sm text-muted">
                Ses capacités et disponibilités apparaîtront ici.
              </p>
            </div>
          )}
        </Card>
      </div>
    </BackofficePage>
  );
}
