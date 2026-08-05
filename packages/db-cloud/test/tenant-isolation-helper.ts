import { expect } from 'vitest';

export async function assertTenantIsolation<
  TRecord extends { id: string },
>(input: {
  tenantAId: string;
  tenantBId: string;
  createFixture(tenantId: string): Promise<TRecord>;
  listForTenant(tenantId: string): Promise<TRecord[]>;
  findForTenant(tenantId: string, id: string): Promise<TRecord | null>;
  updateForTenant(tenantId: string, id: string): Promise<boolean>;
  deleteForTenant(tenantId: string, id: string): Promise<boolean>;
}): Promise<void> {
  const recordA = await input.createFixture(input.tenantAId);
  const recordB = await input.createFixture(input.tenantBId);

  await expect(input.listForTenant(input.tenantAId)).resolves.toEqual([
    recordA,
  ]);
  await expect(
    input.findForTenant(input.tenantAId, recordB.id),
  ).resolves.toBeNull();
  await expect(
    input.updateForTenant(input.tenantAId, recordB.id),
  ).resolves.toBe(false);
  await expect(
    input.deleteForTenant(input.tenantAId, recordB.id),
  ).resolves.toBe(false);
  await expect(
    input.findForTenant(input.tenantBId, recordB.id),
  ).resolves.toEqual(recordB);
}
