import { Badge, Card } from '@yuta/ui';
import { Armchair } from 'lucide-react';
import type { RestaurantTable } from './tables-model';
import { tableAvailabilityTones } from './tables-presentation';

export function TableDetails({ table }: { table: RestaurantTable | null }) {
  return (
    <Card padding="lg">
      {table ? <SelectedTableDetails table={table} /> : <TableDetailsEmpty />}
    </Card>
  );
}

function SelectedTableDetails({ table }: { table: RestaurantTable }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-muted">
          <Armchair className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Table {table.id}</h2>
          <p className="text-sm text-muted">{table.room}</p>
        </div>
      </div>
      <dl className="mt-6 grid gap-4 text-sm">
        <TableDetail label="Capacité" value={`${table.seats} places`} />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Disponibilité</dt>
          <dd>
            <Badge tone={tableAvailabilityTones[table.availability]}>
              {table.availability}
            </Badge>
          </dd>
        </div>
        {table.reservation && (
          <TableDetail label="Réservation" value={table.reservation} />
        )}
      </dl>
    </div>
  );
}

function TableDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function TableDetailsEmpty() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center">
      <Armchair className="h-8 w-8 text-muted" aria-hidden />
      <p className="mt-3 font-semibold">Sélectionnez une table</p>
      <p className="mt-1 text-sm text-muted">
        Ses capacités et disponibilités apparaîtront ici.
      </p>
    </div>
  );
}
