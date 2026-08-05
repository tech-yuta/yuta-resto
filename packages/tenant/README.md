# `@yuta/tenant`

`@yuta/tenant` is the cloud-only authorization boundary for restaurant data.
In the approved YUTA database architecture, a runtime tenant is an
`organizationId` plus an `establishmentId`; there is deliberately no persisted
`tenants` table. The establishment is the restaurant selected by the user.

## Active tenant resolution

Use `createTenantService` with the `@yuta/db-cloud` tenant foundation
repository. Resolution order is:

1. a trusted route establishment ID or slug;
2. a validated active-tenant value from the server session/cookie;
3. the user's only active membership;
4. `TenantSelectionRequiredError` when selection is ambiguous.

Every requested target is resolved through the authenticated user's active
membership. A route value or HttpOnly cookie identifies a candidate; neither
is proof of authorization.

```ts
const context = await tenantService.requireTenantRole(['OWNER', 'MANAGER'], {
  userId: session.userId,
  tenantSlug: params.tenantSlug,
});
```

Applications translate typed errors into HTTP responses or controlled pages.
The package never redirects.

## Roles

Tenant roles are `OWNER`, `MANAGER`, and `STAFF`. System roles
`YUTA_ADMIN` and `YUTA_SUPPORT` belong to the internal user and are checked by
`@yuta/auth`; they never create tenant access. Managers may manage staff only.
A transaction prevents the last active owner of an establishment from being
downgraded or suspended.

## Tenant-owned tables and repositories

Cloud organization-owned rows contain `organizationId`. Restaurant-specific
rows also contain a non-null `establishmentId`. Their leading indexes must
match these scope columns.

Repository methods require the scope explicitly, and mutations constrain both
the resource ID and tenant scope:

```ts
await db
  .update(feedbackItems)
  .set(input)
  .where(
    and(
      eq(feedbackItems.id, feedbackId),
      eq(feedbackItems.organizationId, context.organizationId),
      eq(feedbackItems.establishmentId, context.establishmentId),
    ),
  );
```

Forbidden patterns include unscoped `findMany()` calls, update/delete by record
ID alone, and direct use of a browser-submitted organization or establishment
ID without membership resolution.

## Testing isolation

Use `test/tenant-isolation-helper.ts` in `@yuta/db-cloud` to exercise list,
find, update, and delete behavior against tenant A and tenant B. Add a real
integration fixture for every new tenant-owned repository. Unit tests in this
package cover resolution priority, explicit role matching, manager limits, and
last-owner protection.
