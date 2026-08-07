import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const organizationStatusEnum = pgEnum('organization_status', [
  'active',
  'disabled',
]);
export const domainStatusEnum = pgEnum('domain_status', [
  'pending',
  'active',
  'disabled',
]);
export const membershipStatusEnum = pgEnum('membership_status', [
  'active',
  'suspended',
]);
export const cloudRoleEnum = pgEnum('cloud_role', [
  'OWNER',
  'MANAGER',
  'STAFF',
]);
export const establishmentServiceModeEnum = pgEnum(
  'establishment_service_mode',
  [
    'DINE_IN',
    'TAKEAWAY',
    'RESERVATION',
    'DELIVERY',
    'CLICK_AND_COLLECT',
    'PRIVATE_EVENTS',
    'CATERING',
  ],
);

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date());

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    status: organizationStatusEnum('status').default('active').notNull(),
    locale: varchar('locale', { length: 35 }).default('fr-FR').notNull(),
    timezone: varchar('timezone', { length: 100 })
      .default('Europe/Paris')
      .notNull(),
    currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('organizations_slug_unique_idx').on(sql`lower(${table.slug})`),
    index('organizations_status_idx').on(table.status),
  ],
);

export const establishments = pgTable(
  'establishments',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    status: organizationStatusEnum('status').default('active').notNull(),
    locale: varchar('locale', { length: 35 }).default('fr-FR').notNull(),
    timezone: varchar('timezone', { length: 100 })
      .default('Europe/Paris')
      .notNull(),
    description: text('description'),
    addressLine1: varchar('address_line_1', { length: 255 }),
    addressLine2: varchar('address_line_2', { length: 255 }),
    postalCode: varchar('postal_code', { length: 32 }),
    city: varchar('city', { length: 120 }),
    countryCode: varchar('country_code', { length: 2 }),
    phone: varchar('phone', { length: 30 }),
    email: varchar('email', { length: 254 }),
    website: text('website'),
    publicPhone: varchar('public_phone', { length: 30 }),
    publicEmail: varchar('public_email', { length: 254 }),
    logoUrl: text('logo_url'),
    coverImageUrl: text('cover_image_url'),
    languages: varchar('languages', { length: 35 })
      .array()
      .default(sql`ARRAY[]::varchar[]`)
      .notNull(),
    serviceModes: establishmentServiceModeEnum('service_modes')
      .array()
      .default(sql`ARRAY[]::establishment_service_mode[]`)
      .notNull(),
    publicDescription: boolean('public_description').default(true).notNull(),
    publicAddress: boolean('public_address').default(true).notNull(),
    publicPhoneVisible: boolean('public_phone_visible').default(true).notNull(),
    publicEmailVisible: boolean('public_email_visible').default(true).notNull(),
    publicWebsite: boolean('public_website').default(true).notNull(),
    publicLanguages: boolean('public_languages').default(true).notNull(),
    publicServiceModes: boolean('public_service_modes').default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('establishments_slug_unique_idx').on(sql`lower(${table.slug})`),
    index('establishments_organization_id_idx').on(table.organizationId),
    index('establishments_status_idx').on(table.status),
  ],
);

export const tenantDomains = pgTable(
  'tenant_domains',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    hostname: varchar('hostname', { length: 253 }).notNull(),
    status: domainStatusEnum('status').default('pending').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('tenant_domains_hostname_unique_idx').on(table.hostname),
    index('tenant_domains_scope_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
  ],
);

export const tenantMemberships = pgTable(
  'tenant_memberships',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id').references(
      () => establishments.id,
    ),
    role: cloudRoleEnum('role').notNull(),
    status: membershipStatusEnum('status').default('active').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('tenant_memberships_scope_unique_idx').on(
      table.userId,
      table.organizationId,
      table.establishmentId,
    ),
    index('tenant_memberships_user_id_idx').on(table.userId),
    index('tenant_memberships_scope_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
  ],
);

export const tenantEntitlements = pgTable(
  'tenant_entitlements',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishments.id),
    key: varchar('key', { length: 150 }).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.establishmentId, table.key],
    }),
    index('tenant_entitlements_scope_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
  ],
);

export type Organization = typeof organizations.$inferSelect;
export type Establishment = typeof establishments.$inferSelect;
