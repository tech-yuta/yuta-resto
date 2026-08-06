import { hashPassword } from '@yuta/auth';
import { and, eq, sql } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import type { CloudDatabaseClient } from './client';
import {
  establishments,
  authSelectionTickets,
  authSessions,
  bookingServicePeriods,
  bookingSettings,
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

const seedEnvSchema = z.object({
  YUTA_CLOUD_SEED_PASSWORD: z.string().min(12).max(128),
});

const seedIdentities = {
  owner: {
    authProviderId: 'password:owner@luna-restaurant.fr',
    email: 'owner@luna-restaurant.fr',
    displayName: 'Propriétaire LUNA',
    systemRole: null,
  },
  manager: {
    authProviderId: 'password:manager@luna-restaurant.fr',
    email: 'manager@luna-restaurant.fr',
    displayName: 'Manager LUNA',
    systemRole: null,
  },
  platformAdmin: {
    authProviderId: 'password:admin@yutapro.fr',
    email: 'admin@yutapro.fr',
    displayName: 'Administrateur YuTa',
    systemRole: 'YUTA_ADMIN' as const,
  },
} as const;

export type CloudSeedContext = {
  organization: Organization;
  establishment: Establishment;
  poitiersEstablishment: Establishment;
  ownerUser: CloudUser;
  managerUser: CloudUser;
  platformAdminUser: CloudUser;
};

export async function seedCloudData(
  seedDb?: CloudDatabaseClient,
): Promise<CloudSeedContext> {
  const seedEnv = seedEnvSchema.parse(process.env);
  const activeDb =
    seedDb ?? (await import('./client')).createCloudDatabaseClient(process.env);
  const organization = await upsertOrganization(activeDb);
  const establishment = await upsertEstablishment(activeDb, organization.id, {
    name: 'LUNA',
    slug: 'luna',
  });
  const poitiersEstablishment = await upsertEstablishment(
    activeDb,
    organization.id,
    { name: 'LuNa Poitiers', slug: 'luna-poitiers' },
  );

  await upsertTenantDomain(activeDb, {
    organizationId: organization.id,
    establishmentId: establishment.id,
    hostname: 'luna.localhost',
  });
  await upsertTenantDomain(activeDb, {
    organizationId: organization.id,
    establishmentId: poitiersEstablishment.id,
    hostname: 'luna-poitiers.localhost',
  });
  await upsertEntitlements(activeDb, {
    organizationId: organization.id,
    establishmentId: establishment.id,
  });
  await upsertEntitlements(activeDb, {
    organizationId: organization.id,
    establishmentId: poitiersEstablishment.id,
  });

  const passwordHash = await createSeedPasswordHash(seedEnv);
  const ownerUser = await upsertSeedUser(
    activeDb,
    seedIdentities.owner,
    passwordHash,
  );
  const managerUser = await upsertSeedUser(
    activeDb,
    seedIdentities.manager,
    passwordHash,
  );
  const platformAdminUser = await upsertSeedUser(
    activeDb,
    seedIdentities.platformAdmin,
    passwordHash,
  );
  await upsertMembership(activeDb, {
    userId: ownerUser.id,
    organizationId: organization.id,
    establishmentId: establishment.id,
    role: 'OWNER',
  });
  await upsertMembership(activeDb, {
    userId: ownerUser.id,
    organizationId: organization.id,
    establishmentId: poitiersEstablishment.id,
    role: 'OWNER',
  });
  await upsertMembership(activeDb, {
    userId: managerUser.id,
    organizationId: organization.id,
    establishmentId: establishment.id,
    role: 'MANAGER',
  });
  await removeRestaurantAccess(activeDb, platformAdminUser.id);
  await disableLegacyCloudAdmin(activeDb);
  await upsertReputationSettings(activeDb, {
    organizationId: organization.id,
    establishmentId: establishment.id,
    publicFeedbackSlug: 'luna',
  });
  await upsertReputationSettings(activeDb, {
    organizationId: organization.id,
    establishmentId: poitiersEstablishment.id,
    publicFeedbackSlug: 'luna-poitiers',
  });
  await upsertBookingConfiguration(activeDb, {
    organizationId: organization.id,
    establishmentId: establishment.id,
  });
  await upsertBookingConfiguration(activeDb, {
    organizationId: organization.id,
    establishmentId: poitiersEstablishment.id,
  });

  return {
    organization,
    establishment,
    poitiersEstablishment,
    ownerUser,
    managerUser,
    platformAdminUser,
  };
}

async function upsertOrganization(
  seedDb: CloudDatabaseClient,
): Promise<Organization> {
  const existing = await seedDb.query.organizations.findFirst({
    where: eq(organizations.slug, 'luna'),
  });
  const values = {
    name: 'LUNA',
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
    console.log('Reused LUNA organization.');
    return updated;
  }

  const [created] = await seedDb
    .insert(organizations)
    .values({ id: uuidv7(), slug: 'luna', ...values })
    .returning();
  console.log('Created LUNA organization.');
  return created;
}

async function upsertEstablishment(
  seedDb: CloudDatabaseClient,
  organizationId: string,
  identity: { name: string; slug: string },
): Promise<Establishment> {
  const existing = await seedDb.query.establishments.findFirst({
    where: and(
      eq(establishments.organizationId, organizationId),
      eq(establishments.slug, identity.slug),
    ),
  });
  const values = {
    organizationId,
    name: identity.name,
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
    console.log(`Reused ${identity.name} establishment.`);
    return updated;
  }

  const [created] = await seedDb
    .insert(establishments)
    .values({
      id: uuidv7(),
      slug: identity.slug,
      ...values,
    })
    .returning();
  console.log(`Created ${identity.name} establishment.`);
  return created;
}

async function upsertTenantDomain(
  seedDb: CloudDatabaseClient,
  scope: {
    organizationId: string;
    establishmentId: string;
    hostname: string;
  },
): Promise<void> {
  const existing = await seedDb.query.tenantDomains.findFirst({
    where: eq(tenantDomains.hostname, scope.hostname),
  });
  const { hostname, ...tenantScope } = scope;
  const values = {
    ...tenantScope,
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
    .values({ id: uuidv7(), hostname, ...values });
}

async function upsertEntitlements(
  seedDb: CloudDatabaseClient,
  scope: { organizationId: string; establishmentId: string },
): Promise<void> {
  for (const key of [
    'menu.public',
    'reservations.public',
    'reputation.enabled',
    'booking.enabled',
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

async function upsertBookingConfiguration(
  seedDb: CloudDatabaseClient,
  scope: { organizationId: string; establishmentId: string },
): Promise<void> {
  await seedDb
    .insert(bookingSettings)
    .values({
      id: uuidv7(),
      ...scope,
      enabled: true,
      confirmationMode: 'MANUAL',
      publicEmail: 'contact@luna-restaurant.fr',
      publicPhone: '+33549000000',
      address: 'Poitiers, France',
      welcomeMessage: 'Réservez votre table chez LuNa.',
      bookingPolicy: "Votre demande sera confirmée par l'équipe du restaurant.",
    })
    .onConflictDoUpdate({
      target: [bookingSettings.organizationId, bookingSettings.establishmentId],
      set: { enabled: true, confirmationMode: 'MANUAL' },
    });

  const existing = await seedDb
    .select({ id: bookingServicePeriods.id })
    .from(bookingServicePeriods)
    .where(
      and(
        eq(bookingServicePeriods.organizationId, scope.organizationId),
        eq(bookingServicePeriods.establishmentId, scope.establishmentId),
      ),
    )
    .limit(1);
  if (existing.length > 0) return;

  for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek += 1) {
    await seedDb.insert(bookingServicePeriods).values([
      {
        id: uuidv7(),
        ...scope,
        dayOfWeek,
        name: 'Déjeuner',
        startTime: '12:00',
        endTime: '14:00',
        capacity: 40,
        sortOrder: 10,
      },
      {
        id: uuidv7(),
        ...scope,
        dayOfWeek,
        name: 'Dîner',
        startTime: '19:00',
        endTime: '22:00',
        capacity: 50,
        sortOrder: 20,
      },
    ]);
  }
}

async function createSeedPasswordHash(
  seedEnv: z.infer<typeof seedEnvSchema>,
): Promise<string> {
  return hashPassword(seedEnv.YUTA_CLOUD_SEED_PASSWORD);
}

async function upsertSeedUser(
  seedDb: CloudDatabaseClient,
  identity: {
    authProviderId: string;
    email: string;
    displayName: string;
    systemRole: 'YUTA_ADMIN' | null;
  },
  passwordHash: string,
): Promise<CloudUser> {
  const existing = await seedDb.query.users.findFirst({
    where: sql`lower(${users.email}) = ${identity.email}`,
  });
  const values = {
    ...identity,
    status: 'ACTIVE' as const,
    passwordHash,
    emailVerifiedAt: existing?.emailVerifiedAt ?? new Date(),
  };

  if (existing) {
    const [updated] = await seedDb
      .update(users)
      .set(values)
      .where(eq(users.id, existing.id))
      .returning();
    console.log(`Reused seed identity ${identity.email}.`);
    return updated;
  }

  const [created] = await seedDb
    .insert(users)
    .values({
      id: uuidv7(),
      ...values,
    })
    .returning();
  console.log(`Created seed identity ${identity.email}.`);
  return created;
}

async function upsertMembership(
  seedDb: CloudDatabaseClient,
  scope: {
    userId: string;
    organizationId: string;
    establishmentId: string;
    role: 'OWNER' | 'MANAGER';
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
    status: 'active' as const,
  };

  if (existing) {
    await seedDb
      .update(tenantMemberships)
      .set(values)
      .where(eq(tenantMemberships.id, existing.id));
    console.log(`Reused LUNA ${scope.role} membership.`);
    return;
  }

  await seedDb.insert(tenantMemberships).values({ id: uuidv7(), ...values });
  console.log(`Created LUNA ${scope.role} membership.`);
}

async function removeRestaurantAccess(
  seedDb: CloudDatabaseClient,
  userId: string,
): Promise<void> {
  await seedDb.delete(authSessions).where(eq(authSessions.userId, userId));
  await seedDb
    .delete(authSelectionTickets)
    .where(eq(authSelectionTickets.userId, userId));
  await seedDb
    .delete(tenantMemberships)
    .where(eq(tenantMemberships.userId, userId));
}

async function disableLegacyCloudAdmin(
  seedDb: CloudDatabaseClient,
): Promise<void> {
  const legacyUser = await seedDb.query.users.findFirst({
    where: sql`lower(${users.email}) = 'admin@yuta.local'`,
  });
  if (!legacyUser) return;

  await removeRestaurantAccess(seedDb, legacyUser.id);
  await seedDb
    .update(users)
    .set({
      status: 'DISABLED',
      systemRole: null,
      authVersion: sql`${users.authVersion} + 1`,
    })
    .where(eq(users.id, legacyUser.id));
  console.log('Disabled legacy cloud identity admin@yuta.local.');
}

async function upsertReputationSettings(
  seedDb: CloudDatabaseClient,
  scope: {
    organizationId: string;
    establishmentId: string;
    publicFeedbackSlug: string;
  },
): Promise<void> {
  const values = {
    ...scope,
    brandVoice:
      'Warm, professional, concise, and natural French. Acknowledge the customer experience and offer a practical next step when appropriate.',
    replySignature: "L'équipe LUNA",
    defaultReplyLanguage: 'fr',
    publicFeedbackEnabled: true,
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
