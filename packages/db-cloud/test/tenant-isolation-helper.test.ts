import { describe, it } from 'vitest';
import { assertTenantIsolation } from './tenant-isolation-helper';

describe('tenant isolation regression helper', () => {
  it('exercises list, find, update, and delete boundaries', async () => {
    const records = new Map<string, { id: string; tenantId: string }>();
    let sequence = 0;
    await assertTenantIsolation({
      tenantAId: 'tenant-a',
      tenantBId: 'tenant-b',
      createFixture: async (tenantId) => {
        const record = { id: `record-${++sequence}`, tenantId };
        records.set(record.id, record);
        return record;
      },
      listForTenant: async (tenantId) =>
        [...records.values()].filter((record) => record.tenantId === tenantId),
      findForTenant: async (tenantId, id) => {
        const record = records.get(id);
        return record?.tenantId === tenantId ? record : null;
      },
      updateForTenant: async (tenantId, id) =>
        records.get(id)?.tenantId === tenantId,
      deleteForTenant: async (tenantId, id) => {
        if (records.get(id)?.tenantId !== tenantId) return false;
        return records.delete(id);
      },
    });
  });
});
