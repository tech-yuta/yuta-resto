import { config } from 'dotenv';
import type { TenantContext } from '@yuta/tenant';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { DbClient } from '../src/client';
import {
  createFeedbackInternalNote,
  findFeedbackDetail,
  findGoogleReputationConnector,
  saveFeedbackReplyDraft,
  selectGoogleReputationLocation,
  updateFeedback,
  upsertGoogleReputationConnectorCredentials,
} from '../src/reputation-repository';
import {
  authSessions,
  establishments,
  feedbackItems,
  organizations,
  reputationAuditEvents,
  reputationConnectors,
  tenantMemberships,
  users,
} from '../src/schema';

config({ path: '.env.local' });

const integrationTest = process.env.DATABASE_URL ? describe : describe.skip;

integrationTest('reputation repository integration', () => {
  let db: DbClient;
  const organizationId = randomUUID();
  const establishmentId = randomUUID();
  const actorUserId = randomUUID();
  const assigneeUserId = randomUUID();
  const membershipId = randomUUID();
  const context: TenantContext = {
    organizationId,
    establishmentId,
    actor: {
      type: 'user',
      userId: actorUserId,
      role: 'owner',
      membershipId,
    },
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    entitlements: new Set(['reputation.enabled']),
  };

  beforeAll(async () => {
    ({ db } = await import('../src/client'));
    await db.insert(organizations).values({
      id: organizationId,
      name: 'Reputation integration organization',
      slug: `reputation-integration-${organizationId}`,
    });
    await db.insert(establishments).values({
      id: establishmentId,
      organizationId,
      name: 'Reputation integration establishment',
      slug: 'reputation-integration',
    });
    await db.insert(users).values([
      {
        id: actorUserId,
        name: 'Integration Owner',
        email: `owner-${organizationId}@example.test`,
        role: 'admin',
      },
      {
        id: assigneeUserId,
        name: 'Integration Assignee',
        email: `assignee-${organizationId}@example.test`,
        role: 'manager',
      },
    ]);
    await db.insert(tenantMemberships).values([
      {
        id: membershipId,
        userId: actorUserId,
        organizationId,
        establishmentId,
        role: 'owner',
        status: 'active',
      },
      {
        userId: assigneeUserId,
        organizationId,
        establishmentId,
        role: 'manager',
        status: 'active',
      },
    ]);
  });

  afterAll(async () => {
    await db
      .delete(reputationAuditEvents)
      .where(eq(reputationAuditEvents.organizationId, organizationId));
    await db
      .delete(reputationConnectors)
      .where(eq(reputationConnectors.organizationId, organizationId));
    await db
      .delete(feedbackItems)
      .where(eq(feedbackItems.organizationId, organizationId));
    await db
      .delete(authSessions)
      .where(eq(authSessions.organizationId, organizationId));
    await db
      .delete(tenantMemberships)
      .where(eq(tenantMemberships.organizationId, organizationId));
    await db.delete(users).where(eq(users.id, actorUserId));
    await db.delete(users).where(eq(users.id, assigneeUserId));
    await db
      .delete(establishments)
      .where(eq(establishments.id, establishmentId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
  });

  it('persists inbox mutations, audits them, and rejects another tenant', async () => {
    const [feedback] = await db
      .insert(feedbackItems)
      .values({
        organizationId,
        establishmentId,
        source: 'GOOGLE',
        type: 'PUBLIC_REVIEW',
        externalId: `integration-${randomUUID()}`,
        authorName: 'Integration Customer',
        rating: 4,
        content: 'Integration feedback',
      })
      .returning({ id: feedbackItems.id });

    await updateFeedback(db, context, {
      feedbackId: feedback.id,
      status: 'TO_PROCESS',
      assignedToUserId: assigneeUserId,
      actorUserId,
    });
    await saveFeedbackReplyDraft(db, context, {
      feedbackId: feedback.id,
      content: 'Merci pour votre retour.',
      actorUserId,
    });
    await createFeedbackInternalNote(db, context, {
      feedbackId: feedback.id,
      content: 'Contacter le client demain.',
      actorUserId,
    });
    await upsertGoogleReputationConnectorCredentials(db, context, {
      encryptedAccessToken: 'encrypted-access-token',
      encryptedRefreshToken: 'encrypted-refresh-token',
      tokenExpiresAt: new Date(Date.now() + 3_600_000),
      grantedScopes: ['https://www.googleapis.com/auth/business.manage'],
      actorUserId,
    });
    await selectGoogleReputationLocation(db, context, {
      externalAccountId: 'accounts/integration-account',
      externalLocationId: 'locations/integration-location',
      actorUserId,
    });

    const detail = await findFeedbackDetail(db, context, feedback.id);
    expect(detail).toMatchObject({
      status: 'DRAFTED',
      assignedToUserId: assigneeUserId,
    });
    expect(detail?.replies[0]?.content).toBe('Merci pour votre retour.');
    expect(detail?.notes[0]?.content).toBe('Contacter le client demain.');
    await expect(
      findGoogleReputationConnector(db, context),
    ).resolves.toMatchObject({
      status: 'CONNECTED',
      externalAccountId: 'accounts/integration-account',
      externalLocationId: 'locations/integration-location',
      hasAccessToken: true,
      hasRefreshToken: true,
    });

    const employeeContext: TenantContext = {
      ...context,
      actor: {
        type: 'user',
        userId: assigneeUserId,
        role: 'employee',
        membershipId: randomUUID(),
      },
    };
    await expect(
      findFeedbackDetail(db, employeeContext, feedback.id),
    ).resolves.toBeDefined();
    await expect(
      createFeedbackInternalNote(
        db,
        {
          ...employeeContext,
          actor: {
            ...employeeContext.actor,
            userId: randomUUID(),
          },
        },
        {
          feedbackId: feedback.id,
          content: 'This note must not be created.',
          actorUserId: assigneeUserId,
        },
      ),
    ).rejects.toMatchObject({
      code: 'FEEDBACK_NOT_FOUND',
    });

    const audits = await db.query.reputationAuditEvents.findMany({
      where: eq(reputationAuditEvents.organizationId, organizationId),
    });
    expect(audits).toHaveLength(5);

    await expect(
      updateFeedback(
        db,
        {
          ...context,
          establishmentId: randomUUID(),
        },
        {
          feedbackId: feedback.id,
          status: 'ARCHIVED',
          actorUserId,
        },
      ),
    ).rejects.toMatchObject({
      code: 'FEEDBACK_NOT_FOUND',
    });
    await expect(
      findGoogleReputationConnector(db, {
        ...context,
        establishmentId: randomUUID(),
      }),
    ).resolves.toBeNull();
  });
});
