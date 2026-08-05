import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7, version as uuidVersion } from 'uuid';
import {
  createCloudDatabaseClient,
  type CloudDatabaseClient,
} from '../src/client';
import {
  establishments,
  organizations,
  tenantMemberships,
  users,
} from '../src/schema';

config({ path: '.env.test' });
config({ path: '.env.local' });

const integrationTest =
  process.env.CLOUD_DATABASE_URL &&
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

integrationTest('cloud schema integration', () => {
  let db: CloudDatabaseClient;
  const organizationId = uuidv7();
  const establishmentId = uuidv7();
  const userId = uuidv7();
  const membershipId = uuidv7();

  beforeAll(async () => {
    db = createCloudDatabaseClient(process.env);
    await db.insert(organizations).values({
      id: organizationId,
      name: 'Cloud schema integration organization',
      slug: `cloud-schema-${organizationId}`,
    });
    await db.insert(establishments).values({
      id: establishmentId,
      organizationId,
      name: 'Cloud schema integration establishment',
      slug: 'schema-integration',
    });
    await db.insert(users).values({
      id: userId,
      authProviderId: `test:${userId}`,
      displayName: 'Cloud Schema Tester',
      email: `cloud-schema-${userId}@example.test`,
    });
  });

  afterAll(async () => {
    if (!db) {
      return;
    }
    await db
      .delete(tenantMemberships)
      .where(eq(tenantMemberships.id, membershipId));
    await db.delete(users).where(eq(users.id, userId));
    await db
      .delete(establishments)
      .where(eq(establishments.id, establishmentId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.$client.end({ timeout: 5 });
  });

  it('stores application-generated UUIDv7 IDs across the tenant boundary', async () => {
    const [membership] = await db
      .insert(tenantMemberships)
      .values({
        id: membershipId,
        userId,
        organizationId,
        establishmentId,
        role: 'OWNER',
      })
      .returning();

    expect(uuidVersion(membership.id)).toBe(7);
    expect(membership.organizationId).toBe(organizationId);
    expect(membership.establishmentId).toBe(establishmentId);
  });
});
