import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'disabled']);
export const domainStatusEnum = pgEnum('domain_status', [
  'pending',
  'active',
  'disabled',
]);
export const membershipStatusEnum = pgEnum('membership_status', [
  'active',
  'invited',
  'suspended',
]);
export const tenantRoleEnum = pgEnum('tenant_role', [
  'owner',
  'admin',
  'manager',
  'cashier',
  'kitchen',
  'waiter',
  'accountant',
  'employee',
]);

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
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    status: tenantStatusEnum('status').default('active').notNull(),
    locale: varchar('locale', { length: 35 }).default('fr-FR').notNull(),
    timezone: varchar('timezone', { length: 100 })
      .default('Europe/Paris')
      .notNull(),
    currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('organizations_slug_unique_idx').on(table.slug),
    index('organizations_status_idx').on(table.status),
  ],
);

export const establishments = pgTable(
  'establishments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    status: tenantStatusEnum('status').default('active').notNull(),
    locale: varchar('locale', { length: 35 }).default('fr-FR').notNull(),
    timezone: varchar('timezone', { length: 100 })
      .default('Europe/Paris')
      .notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('establishments_org_slug_unique_idx').on(
      table.organizationId,
      table.slug,
    ),
    index('establishments_organization_id_idx').on(table.organizationId),
    index('establishments_status_idx').on(table.status),
  ],
);

export const tenantDomains = pgTable(
  'tenant_domains',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
    index('tenant_domains_tenant_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    index('tenant_domains_status_idx').on(table.status),
  ],
);

export const tenantMemberships = pgTable(
  'tenant_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    establishmentId: uuid('establishment_id').references(
      () => establishments.id,
    ),
    role: tenantRoleEnum('role').notNull(),
    status: membershipStatusEnum('status').default('active').notNull(),
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
    index('tenant_memberships_tenant_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
    index('tenant_memberships_status_idx').on(table.status),
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
    index('tenant_entitlements_tenant_idx').on(
      table.organizationId,
      table.establishmentId,
    ),
  ],
);

export type Organization = typeof organizations.$inferSelect;
export type Establishment = typeof establishments.$inferSelect;
