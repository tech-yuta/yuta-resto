import { hashPassword } from '@yuta/auth';
import { and, eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v7 as uuidv7 } from 'uuid';
import type { CloudDatabaseClient } from './client';
import {
  establishments,
  organizations,
  reputationSettings,
  tenantDomains,
  tenantEntitlements,
  tenantMemberships,
  users,
  type CloudUser,
  type Establishment,
  type Organization,
} from './schema';

config({ path: '.env.local' });
config({ path: '.env' });

export type CloudSeedContext = {
  organization: Organization;
  establishment: Establishment;
  adminUser: CloudUser;
};

export async function seedCloudData(
  seedDb?: CloudDatabaseClient,
): Promise<CloudSeedContext> {
  const activeDb =
    seedDb ?? (await import('./client')).createCloudDatabaseClient(process.env);
  const organization = await upsertOrganization(activeDb);
  const establishment = await upsertEstablishment(activeDb, organization.id);

  await upsertTenantDomain(activeDb, {
    organizationId: organization.id,
    establishmentId: establishment.id,
  });
  await upsertEntitlements(activeDb, {
    organizationId: organization.id,
    establishmentId: establishment.id,
  });

  const adminUser = await upsertCloudAdmin(activeDb);
  await upsertOwnerMembership(activeDb, {
    userId: adminUser.id,
    organizationId: organization.id,
    establishmentId: establishment.id,
  });
  await upsertReputationSettings(activeDb, {
    organizationId: organization.id,
    establishmentId: establishment.id,
  });

  return { organization, establishment, adminUser };
}

async function upsertOrganization(
  seedDb: CloudDatabaseClient,
): Promise<Organization> {
  const existing = await seedDb.query.organizations.findFirst({
    where: eq(organizations.slug, 'fast-viet'),
  });
  const values = {
    name: 'FAST VIET',
    status: 'active' as const,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    currency: 'EUR',
  };

  if (existing) {
    const [updated] = await seedDb
      .update(organizations)
      .set(values)
      .where(eq(organizations.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(organizations)
    .values({ id: uuidv7(), slug: 'fast-viet', ...values })
    .returning();
  return created;
}

async function upsertEstablishment(
  seedDb: CloudDatabaseClient,
  organizationId: string,
): Promise<Establishment> {
  const existing = await seedDb.query.establishments.findFirst({
    where: and(
      eq(establishments.organizationId, organizationId),
      eq(establishments.slug, 'luna-chasseneuil-du-poitou'),
    ),
  });
  const values = {
    organizationId,
    name: 'LUNA Chasseneuil-du-Poitou',
    status: 'active' as const,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
  };

  if (existing) {
    const [updated] = await seedDb
      .update(establishments)
      .set(values)
      .where(eq(establishments.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(establishments)
    .values({
      id: uuidv7(),
      slug: 'luna-chasseneuil-du-poitou',
      ...values,
    })
    .returning();
  return created;
}

async function upsertTenantDomain(
  seedDb: CloudDatabaseClient,
  scope: { organizationId: string; establishmentId: string },
): Promise<void> {
  const existing = await seedDb.query.tenantDomains.findFirst({
    where: eq(tenantDomains.hostname, 'luna.localhost'),
  });
  const values = {
    ...scope,
    status: 'active' as const,
    isPrimary: true,
    verifiedAt: new Date(),
  };

  if (existing) {
    await seedDb
      .update(tenantDomains)
      .set(values)
      .where(eq(tenantDomains.id, existing.id));
    return;
  }

  await seedDb
    .insert(tenantDomains)
    .values({ id: uuidv7(), hostname: 'luna.localhost', ...values });
}

async function upsertEntitlements(
  seedDb: CloudDatabaseClient,
  scope: { organizationId: string; establishmentId: string },
): Promise<void> {
  for (const key of [
    'menu.public',
    'reservations.public',
    'reputation.enabled',
  ]) {
    await seedDb
      .insert(tenantEntitlements)
      .values({ ...scope, key, enabled: true })
      .onConflictDoUpdate({
        target: [
          tenantEntitlements.organizationId,
          tenantEntitlements.establishmentId,
          tenantEntitlements.key,
        ],
        set: { enabled: true },
      });
  }
}

async function upsertCloudAdmin(
  seedDb: CloudDatabaseClient,
): Promise<CloudUser> {
  const configuredPassword = process.env.YUTA_CLOUD_SEED_ADMIN_PASSWORD;
  if (process.env.NODE_ENV === 'production' && !configuredPassword) {
    throw new Error(
      'YUTA_CLOUD_SEED_ADMIN_PASSWORD is required when seeding production.',
    );
  }
  const passwordHash = await hashPassword(
    configuredPassword ?? 'ChangeMe-YuTa-2026!',
  );
  const existing = await seedDb.query.users.findFirst({
    where: eq(users.email, 'admin@yuta.local'),
  });
  const values = {
    name: 'YuTa Admin',
    isActive: true,
    passwordHash,
    emailVerifiedAt: existing?.emailVerifiedAt ?? new Date(),
  };

  if (existing) {
    const [updated] = await seedDb
      .update(users)
      .set(values)
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await seedDb
    .insert(users)
    .values({
      id: uuidv7(),
      email: 'admin@yuta.local',
      ...values,
    })
    .returning();
  return created;
}

async function upsertOwnerMembership(
  seedDb: CloudDatabaseClient,
  scope: {
    userId: string;
    organizationId: string;
    establishmentId: string;
  },
): Promise<void> {
  const existing = await seedDb.query.tenantMemberships.findFirst({
    where: and(
      eq(tenantMemberships.userId, scope.userId),
      eq(tenantMemberships.organizationId, scope.organizationId),
      eq(tenantMemberships.establishmentId, scope.establishmentId),
    ),
  });
  const values = {
    ...scope,
    role: 'owner' as const,
    status: 'active' as const,
  };

  if (existing) {
    await seedDb
      .update(tenantMemberships)
      .set(values)
      .where(eq(tenantMemberships.id, existing.id));
    return;
  }

  await seedDb.insert(tenantMemberships).values({ id: uuidv7(), ...values });
}

async function upsertReputationSettings(
  seedDb: CloudDatabaseClient,
  scope: { organizationId: string; establishmentId: string },
): Promise<void> {
  const values = {
    ...scope,
    brandVoice:
      'Warm, professional, concise, and natural French. Acknowledge the customer experience and offer a practical next step when appropriate.',
    replySignature: "L'équipe LUNA",
    defaultReplyLanguage: 'fr',
    publicFeedbackEnabled: true,
    publicFeedbackSlug: 'luna',
    negativeRatingThreshold: 3,
  };
  const existing = await seedDb.query.reputationSettings.findFirst({
    where: and(
      eq(reputationSettings.organizationId, scope.organizationId),
      eq(reputationSettings.establishmentId, scope.establishmentId),
    ),
  });

  if (existing) {
    await seedDb
      .update(reputationSettings)
      .set(values)
      .where(eq(reputationSettings.id, existing.id));
    return;
  }

  await seedDb.insert(reputationSettings).values({ id: uuidv7(), ...values });
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  seedCloudData()
    .then(() => {
      console.log('YuTa cloud seed data completed.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
