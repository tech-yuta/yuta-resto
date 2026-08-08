import { describe, expect, it } from 'vitest';
import { restaurantTableFixtures } from '../src/app/(authenticated)/etablissement/salles-tables/tables-fixtures';
import {
  getRoomTables,
  getSelectedRoomTable,
} from '../src/app/(authenticated)/etablissement/salles-tables/tables-model';

describe('tables model', () => {
  it('filters the fixture plan by room', () => {
    const terraceTables = getRoomTables(restaurantTableFixtures, 'Terrasse');

    expect(terraceTables.map((table) => table.id)).toEqual(['T1', 'T2', 'T3']);
    expect(terraceTables.every((table) => table.room === 'Terrasse')).toBe(
      true,
    );
  });

  it('returns only a selected table from the active room', () => {
    const barTables = getRoomTables(restaurantTableFixtures, 'Bar');

    expect(getSelectedRoomTable(barTables, 'B2')?.availability).toBe(
      'Indisponible',
    );
    expect(getSelectedRoomTable(barTables, 'T2')).toBeNull();
    expect(getSelectedRoomTable(barTables, null)).toBeNull();
  });
});
