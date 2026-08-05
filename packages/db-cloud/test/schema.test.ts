import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { v7 as uuidv7, version as uuidVersion } from 'uuid';
import {
  authAuditEvents,
  authLoginAttempts,
  authSelectionTickets,
  authSessions,
  cloudRoleEnum,
  directCustomerFeedback,
  establishments,
  feedbackInternalNotes,
  feedbackItems,
  feedbackReplies,
  organizations,
  passwordResetTokens,
  reputationAuditEvents,
  reputationConnectors,
  reputationSettings,
  tenantDomains,
  tenantMemberships,
  users,
} from '../src/schema';

const tablesWithBusinessIds: PgTable[] = [
  users,
  organizations,
  establishments,
  tenantDomains,
  tenantMemberships,
  authSessions,
  authSelectionTickets,
  passwordResetTokens,
  authLoginAttempts,
  authAuditEvents,
  feedbackItems,
  feedbackReplies,
  directCustomerFeedback,
  feedbackInternalNotes,
  reputationConnectors,
  reputationSettings,
  reputationAuditEvents,
];

describe('cloud schema boundaries', () => {
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

  it('keeps POS-only roles out of cloud memberships', () => {
    expect(cloudRoleEnum.enumValues).toEqual(['OWNER', 'MANAGER', 'STAFF']);
  });

  it('uses an RFC UUIDv7 generator for seed-created records', () => {
    expect(uuidVersion(uuidv7())).toBe(7);
  });
});
