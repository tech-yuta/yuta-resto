export const tableRooms = ['Salle principale', 'Terrasse', 'Bar'] as const;

export type TableRoom = (typeof tableRooms)[number];
export type TableAvailability = 'Disponible' | 'Réservée' | 'Indisponible';

export type RestaurantTable = {
  id: string;
  room: TableRoom;
  seats: number;
  availability: TableAvailability;
  reservation?: string;
  shape: 'round' | 'square' | 'rectangle';
};

export function getRoomTables(
  tables: readonly RestaurantTable[],
  room: TableRoom,
): RestaurantTable[] {
  return tables.filter((table) => table.room === room);
}

export function getSelectedRoomTable(
  tables: readonly RestaurantTable[],
  selectedTableId: string | null,
): RestaurantTable | null {
  return tables.find((table) => table.id === selectedTableId) ?? null;
}
