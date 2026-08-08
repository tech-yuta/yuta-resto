import { Button } from '@yuta/ui';
import { tableRooms, type TableRoom } from './tables-model';

export function TableRoomSelector({
  room,
  onChange,
}: {
  room: TableRoom;
  onChange: (room: TableRoom) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Zones du restaurant">
      {tableRooms.map((item) => (
        <Button
          key={item}
          type="button"
          variant={room === item ? 'primary' : 'outline'}
          size="sm"
          aria-pressed={room === item}
          onClick={() => onChange(item)}
        >
          {item}
        </Button>
      ))}
    </div>
  );
}
