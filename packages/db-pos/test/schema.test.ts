import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { v7 as uuidv7, version as uuidVersion } from 'uuid';
import {
  checkDiscountItems,
  checkDiscounts,
  checkItems,
  checks,
  comboRuleGroupItems,
  comboRuleGroups,
  comboRules,
  localAuthLoginAttempts,
  localAuthSessions,
  localUserRoleEnum,
  localUsers,
  menuCategories,
  menuItems,
  orderDiscountItems,
  orderDiscounts,
  orderItems,
  orders,
  payments,
  printJobs,
} from '../src/schema';

const tablesWithBusinessIds: PgTable[] = [
  localUsers,
  localAuthSessions,
  localAuthLoginAttempts,
  menuCategories,
  menuItems,
  orders,
  orderItems,
  comboRules,
  comboRuleGroups,
  comboRuleGroupItems,
  orderDiscounts,
  orderDiscountItems,
  checks,
  checkItems,
  checkDiscounts,
  checkDiscountItems,
  payments,
  printJobs,
];

describe('POS schema boundaries', () => {
  it('requires application-generated IDs for every business record', () => {
    for (const table of tablesWithBusinessIds) {
      const config = getTableConfig(table);
      const idColumn = config.columns.find((column) => column.name === 'id');

      expect(idColumn, `${config.name}.id must exist`).toBeDefined();
      expect(
        idColumn?.hasDefault,
        `${config.name}.id must have no default`,
      ).toBe(false);
    }
  });

  it('keeps local operational roles in the POS database', () => {
    expect(localUserRoleEnum.enumValues).toEqual([
      'admin',
      'manager',
      'staff',
      'kitchen',
    ]);
  });

  it('uses an RFC UUIDv7 generator for seed-created records', () => {
    expect(uuidVersion(uuidv7())).toBe(7);
  });
});
