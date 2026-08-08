'use client';

import { useMemo, useState } from 'react';
import { BackofficePage } from '../../../../components/backoffice-page';
import { PrototypeBackofficeNotice } from '../../../../components/prototype-backoffice-notice';
import { TableDetails } from './table-details';
import { TableMap } from './table-map';
import { TableRoomSelector } from './table-room-selector';
import { restaurantTableFixtures } from './tables-fixtures';
import {
  getRoomTables,
  getSelectedRoomTable,
  type TableRoom,
} from './tables-model';

export function TablesPage() {
  const [room, setRoom] = useState<TableRoom>('Salle principale');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const tables = useMemo(
    () => getRoomTables(restaurantTableFixtures, room),
    [room],
  );
  const selectedTable = getSelectedRoomTable(tables, selectedTableId);

  function selectRoom(nextRoom: TableRoom) {
    setRoom(nextRoom);
    setSelectedTableId(null);
  }

  return (
    <BackofficePage
      title="Salle & tables"
      description="Visualisez les zones, la capacité et les tables disponibles pour les réservations."
    >
      <PrototypeBackofficeNotice />
      <TableRoomSelector room={room} onChange={selectRoom} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <TableMap
          room={room}
          tables={tables}
          selectedTableId={selectedTableId}
          onSelect={setSelectedTableId}
        />
        <TableDetails table={selectedTable} />
      </div>
    </BackofficePage>
  );
}
