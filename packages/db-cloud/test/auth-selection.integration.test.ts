import { AuthError, hashPassword } from '@yuta/auth';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { createAuthRepository } from '../src/auth-repository';
import {
  createCloudDatabaseClient,
  type CloudDatabaseClient,
} from '../src/client';
import {
  authSelectionTickets,
  authSessions,
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

integrationTest('post-login establishment selection', () => {
  let db: CloudDatabaseClient;
  const organizationId = uuidv7();
  const userId = uuidv7();
  const establishmentIds = [uuidv7(), uuidv7()] as const;
  const membershipIds = [uuidv7(), uuidv7()] as const;
  const email = `auth-selection-${userId}@example.test`;
  const password = 'Correct horse battery staple';

  beforeAll(async () => {
    db = createCloudDatabaseClient(process.env);
    await db.insert(organizations).values({
      id: organizationId,
      name: 'Auth selection organization',
      slug: `auth-selection-${organizationId}`,
    });
    await db.insert(establishments).values(
      establishmentIds.map((id, index) => ({
        id,
        organizationId,
        name: `Auth selection establishment ${index + 1}`,
        slug: `auth-selection-${index + 1}-${id}`,
      })),
    );
    await db.insert(users).values({
      id: userId,
      authProviderId: `test:${userId}`,
      displayName: 'Auth Selection Tester',
      email,
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
    });
    await db.insert(tenantMemberships).values(
      membershipIds.map((id, index) => ({
        id,
        userId,
        organizationId,
        establishmentId: establishmentIds[index],
        role: 'OWNER' as const,
      })),
    );
  });

  afterAll(async () => {
    if (!db) return;
    await db.delete(authSessions).where(eq(authSessions.userId, userId));
    await db
      .delete(authSelectionTickets)
      .where(eq(authSelectionTickets.userId, userId));
    await db
      .delete(tenantMemberships)
      .where(eq(tenantMemberships.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    for (const establishmentId of establishmentIds) {
      await db
        .delete(establishments)
        .where(eq(establishments.id, establishmentId));
    }
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.$client.end({ timeout: 5 });
  });

  it('uses a one-time ticket before creating the scoped session', async () => {
    const repository = createAuthRepository(db);
    const signIn = await repository.signIn({
      email,
      password,
      rateLimitKeyHash: `auth-selection-${userId}`,
      ipHash: null,
      userAgent: 'integration-test',
    });
    expect(signIn.type).toBe('SELECTION_REQUIRED');
    if (signIn.type !== 'SELECTION_REQUIRED') return;

    const options = await repository.listSelectionOptions(
      signIn.selectionToken,
    );
    expect(options.map((option) => option.membershipId)).toEqual(membershipIds);

    const activated = await repository.activateSelection({
      selectionToken: signIn.selectionToken,
      membershipId: membershipIds[1],
    });
    expect(activated.session.organizationId).toBe(organizationId);
    expect(activated.session.establishmentId).toBe(establishmentIds[1]);
    await expect(
      repository.activateSelection({
        selectionToken: signIn.selectionToken,
        membershipId: membershipIds[0],
      }),
    ).rejects.toMatchObject<AuthError>({ code: 'SELECTION_TICKET_INVALID' });
  });

  it('creates a scoped session immediately for one active membership', async () => {
    await db
      .update(tenantMemberships)
      .set({ status: 'suspended' })
      .where(eq(tenantMemberships.id, membershipIds[1]));
    try {
      const result = await createAuthRepository(db).signIn({
        email,
        password,
        rateLimitKeyHash: `auth-auto-${userId}`,
        ipHash: null,
        userAgent: 'integration-test',
      });
      expect(result.type).toBe('SIGNED_IN');
      if (result.type === 'SIGNED_IN') {
        expect(result.session.establishmentId).toBe(establishmentIds[0]);
      }
    } finally {
      await db
        .update(tenantMemberships)
        .set({ status: 'active' })
        .where(eq(tenantMemberships.id, membershipIds[1]));
    }
  });

  it('rejects restaurant login when no active membership remains', async () => {
    await db
      .update(tenantMemberships)
      .set({ status: 'suspended' })
      .where(eq(tenantMemberships.userId, userId));
    try {
      await expect(
        createAuthRepository(db).signIn({
          email,
          password,
          rateLimitKeyHash: `auth-empty-${userId}`,
          ipHash: null,
          userAgent: 'integration-test',
        }),
      ).rejects.toMatchObject<AuthError>({ code: 'NO_ACTIVE_MEMBERSHIP' });
    } finally {
      await db
        .update(tenantMemberships)
        .set({ status: 'active' })
        .where(eq(tenantMemberships.userId, userId));
    }
  });
});
