import { relations } from 'drizzle-orm';
import { establishments, organizations, tenantMemberships } from './tenancy';
import { users } from './users';

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(tenantMemberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  establishments: many(establishments),
  memberships: many(tenantMemberships),
}));

export const establishmentsRelations = relations(
  establishments,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [establishments.organizationId],
      references: [organizations.id],
    }),
    memberships: many(tenantMemberships),
  }),
);

export const tenantMembershipsRelations = relations(
  tenantMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [tenantMemberships.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [tenantMemberships.organizationId],
      references: [organizations.id],
    }),
    establishment: one(establishments, {
      fields: [tenantMemberships.establishmentId],
      references: [establishments.id],
    }),
  }),
);
