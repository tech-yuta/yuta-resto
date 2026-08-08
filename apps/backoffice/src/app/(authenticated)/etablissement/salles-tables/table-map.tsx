import { Badge, Card, cn } from '@yuta/ui';
import { Users } from 'lucide-react';
import type {
  RestaurantTable,
  TableAvailability,
  TableRoom,
} from './tables-model';
import {
  tableAvailabilityStyles,
  tableAvailabilityTones,
} from './tables-presentation';

const availabilityLegend: readonly TableAvailability[] = [
  'Disponible',
  'Réservée',
  'Indisponible',
];

export function TableMap({
  room,
  tables,
  selectedTableId,
  onSelect,
}: {
  room: TableRoom;
  tables: readonly RestaurantTable[];
  selectedTableId: string | null;
  onSelect: (tableId: string) => void;
}) {
  return (
    <Card padding="lg">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{room}</h2>
          <p className="text-sm text-muted">{tables.length} tables</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {availabilityLegend.map((status) => (
            <Badge
              key={status}
              tone={tableAvailabilityTones[status]}
              variant="soft"
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid min-h-96 grid-cols-2 gap-5 rounded-xl border border-dashed border-border-default bg-surface-muted/40 p-6 sm:grid-cols-3">
        {tables.map((table) => (
          <button
            key={table.id}
            type="button"
            aria-label={`Table ${table.id}, ${table.seats} places, ${table.availability}`}
            aria-pressed={selectedTableId === table.id}
            onClick={() => onSelect(table.id)}
            className={cn(
              'm-auto flex min-h-24 min-w-24 flex-col items-center justify-center border-2 p-3 text-center font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              table.shape === 'round'
                ? 'rounded-full'
                : table.shape === 'rectangle'
                  ? 'w-full rounded-xl'
                  : 'rounded-xl',
              tableAvailabilityStyles[table.availability],
              selectedTableId === table.id && 'ring-2 ring-ring ring-offset-2',
            )}
          >
            <span>Table {table.id}</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-medium opacity-75">
              <Users className="h-3.5 w-3.5" aria-hidden /> {table.seats} places
            </span>
            {table.reservation && (
              <span className="mt-1 text-xs">{table.reservation}</span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
