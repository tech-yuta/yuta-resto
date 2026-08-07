import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7, version as uuidVersion } from 'uuid';
import {
  createCloudDatabaseClient,
  type CloudDatabaseClient,
} from '../src/client';
import {
  getEstablishmentProfile,
  updateEstablishmentProfile,
} from '../src/establishment-profile-repository';
import { findPublicBookingConfiguration } from '../src/booking-repository';
import {
  bookingSettings,
  establishments,
  organizations,
  tenantEntitlements,
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
      .delete(bookingSettings)
      .where(eq(bookingSettings.establishmentId, establishmentId));
    await db
      .delete(tenantEntitlements)
      .where(eq(tenantEntitlements.establishmentId, establishmentId));
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

  it('updates an establishment profile only inside trusted scope', async () => {
    const context = {
      organizationId,
      establishmentId,
      actor: {
        type: 'user' as const,
        userId,
        membershipId,
        role: 'OWNER' as const,
      },
      locale: 'fr-FR',
      timezone: 'Europe/Paris',
      entitlements: new Set<string>(),
    };
    const current = await getEstablishmentProfile(db, context);
    expect(current?.name).toBe('Cloud schema integration establishment');
    const updated = await updateEstablishmentProfile(db, context, {
      name: 'Updated establishment',
      description: 'Current establishment profile.',
      addressLine1: '12 rue du Test',
      addressLine2: null,
      postalCode: '86000',
      city: 'Poitiers',
      countryCode: 'FR',
      phone: null,
      email: null,
      website: null,
      publicPhone: null,
      publicEmail: null,
      logoUrl: null,
      coverImageUrl: null,
      languages: ['fr'],
      serviceModes: ['DINE_IN'],
      publicDescription: true,
      publicAddress: true,
      publicPhoneVisible: true,
      publicEmailVisible: true,
      publicWebsite: true,
      publicLanguages: true,
      publicServiceModes: true,
    });
    expect(updated?.name).toBe('Updated establishment');
    await expect(
      getEstablishmentProfile(db, {
        ...context,
        organizationId: uuidv7(),
      }),
    ).resolves.toBeNull();
  });

  it('provides public booking branding from the establishment profile', async () => {
    const context = {
      organizationId,
      establishmentId,
      actor: {
        type: 'user' as const,
        userId,
        membershipId,
        role: 'OWNER' as const,
      },
      locale: 'fr-FR',
      timezone: 'Europe/Paris',
      entitlements: new Set<string>(),
    };
    const current = await getEstablishmentProfile(db, context);
    if (!current) throw new Error('Expected establishment profile fixture.');
    await updateEstablishmentProfile(db, context, {
      name: current.name,
      description: current.description,
      addressLine1: '12 rue du Booking',
      addressLine2: null,
      postalCode: '86000',
      city: 'Poitiers',
      countryCode: 'FR',
      phone: current.phone,
      email: current.email,
      website: current.website,
      publicPhone: '+33549000000',
      publicEmail: 'booking@example.test',
      logoUrl: 'https://example.test/logo.png',
      coverImageUrl: null,
      languages: current.languages,
      serviceModes: current.serviceModes,
      publicDescription: true,
      publicAddress: true,
      publicPhoneVisible: true,
      publicEmailVisible: true,
      publicWebsite: true,
      publicLanguages: true,
      publicServiceModes: true,
    });
    await db.insert(bookingSettings).values({
      id: uuidv7(),
      organizationId,
      establishmentId,
      enabled: true,
    });
    await db.insert(tenantEntitlements).values({
      organizationId,
      establishmentId,
      key: 'booking.enabled',
      enabled: true,
    });
    const configuration = await findPublicBookingConfiguration(
      db,
      'schema-integration',
    );
    expect(configuration).toMatchObject({
      publicPhone: '+33549000000',
      publicEmail: 'booking@example.test',
      address: '12 rue du Booking, 86000 Poitiers, FR',
      logoUrl: 'https://example.test/logo.png',
    });
  });
});
