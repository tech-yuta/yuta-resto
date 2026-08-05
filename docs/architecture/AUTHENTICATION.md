# Back-office Authentication

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

The YUTA restaurant back-office uses server-side, database-backed sessions. Authentication is
implemented by `@yuta/auth`, the cloud database boundary, and the server
boundary in `apps/backoffice/src/server/auth`.

Authentication persistence and tenant lookup adapters are implemented in
`@yuta/db-cloud`. Back-office server code creates the cloud client from
`CLOUD_DATABASE_URL`; the removed legacy `@yuta/db` package is not used.

Cloud authentication is not used by `apps/yuta-pos`, `apps/site-agent`, or
`apps/yuta-display`. POS staff authentication is local and uses local users,
roles, PIN sessions, and audit records through `site-agent`/`db-pos`.

## Sign-in flow

1. `/login` validates the submitted email and password on the server.
2. Passwords are verified with Node.js scrypt. Plaintext passwords are never
   stored.
3. Active establishment memberships are resolved using zero/one/many rules.
4. With one membership, a cryptographically random scoped session token is
   returned in an HttpOnly cookie.
5. With several memberships, a single-use 10-minute selection ticket is stored
   as a separate HttpOnly cookie until the user chooses a membership.
6. PostgreSQL stores only SHA-256 hashes of session and selection tokens.
7. The authenticated layout validates the session and active user.
8. The session organization and establishment are checked against an active
   `tenant_memberships` record.
9. `resolveAuthenticatedTenant` produces the trusted tenant context used by
   repositories and permission checks.

Users without an active restaurant membership are redirected to
`/access/no-establishment`. Users with several memberships select one at
`/select-establishment` before a scoped session is created. The selection
ticket has no tenant scope and cannot authorize protected back-office routes.

Browser input, query parameters, and cookies are never trusted as sources for a
user role, organization, establishment, entitlement, or permission.

## Organization and establishment switching

The authenticated back-office shell lists every active establishment membership
available to the current user. Options are grouped by organization. A user can
switch across establishments in one organization or across organizations only
when an active establishment-level membership exists for each target.

Switching is a server-side operation:

1. The current session token is validated again.
2. The target membership UUID is checked against the current user, an
   active organization, and an active establishment.
3. The current database session is revoked.
4. A new database session and opaque cookie token are issued for the selected
   organization and establishment.
5. The current page is reloaded using the new trusted tenant context.

The client cannot provide or override organization or establishment identifiers.
It submits only the target membership UUID, and both scope identifiers are
derived from the validated membership. If membership access was removed after the selector was
rendered, the switch is rejected and the existing session remains unchanged.

## Cookie policy

The back-office session cookie is named `yuta_backoffice_session` and uses:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- root path
- a fixed 14-day expiration
- no explicit `Domain`, so it remains host-only on `app.yutapro.fr`

Logout revokes the database session before deleting the browser cookie. Tenant
switching rotates the session token and revokes the previous token. Password
reset increments the user's authentication version and revokes all active
sessions.

## Rate limiting

Failed login attempts are stored against an HMAC-derived key containing the
normalized email and client address. Five failed attempts in 15 minutes block
additional attempts for that key. Raw client addresses are not stored.

`AUTH_SECRET` must contain at least 32 characters in production. It is used to
derive privacy-preserving hashes for rate limiting and client-address metadata.

Expired sessions, reset tokens, and login attempts can be removed through the
auth repository cleanup operation. Production scheduling should invoke this
operation periodically.

## Authorization

The global `users` record is the login identity. External identities map through
`users.auth_provider_id`; provider payloads do not enter domain code.
`tenant_memberships.role` is the restaurant authorization source of truth.
`users.system_role` is reserved for explicit YUTA platform access and never
bypasses restaurant membership checks. POS authentication remains local.

Reputation permissions are enforced server-side:

- OWNER: all reputation permissions.
- MANAGER: read, draft/publish replies, incidents, analytics, and staff access management.
- STAFF: read, create drafts, and create incidents.
- Other roles: no reputation access by default.

Client-side button visibility is only a usability aid and must not replace the
server permission check.

## User and membership administration

`/team/users-access` is the tenant-aware access management surface. The legacy
`/settings/users` route redirects there to preserve existing bookmarks:

- The "Utilisateurs & accès" navigation item appears under the team section
  only for owners and managers.
- Owners can manage active establishments across their current organization.
- Managers can manage staff only in the currently selected establishment.
- Managers cannot assign or modify owner or manager roles.
- The membership used by the current session cannot modify or suspend itself.
- The last active owner membership in an organization cannot be downgraded or
  suspended.
- Suspending a membership immediately revokes active sessions for that user,
  organization, and establishment.

Creating a user with a new email creates a global login identity and one or more
establishment memberships. Creating access for an email that already exists
attaches the existing identity and preserves its current password. Automated
invitation email is not active yet, so the initial password must be delivered
through an approved operational channel for newly created identities.

Membership creation, attachment, role changes, and suspension are recorded in
`auth_audit_events`. Audit metadata contains identifiers, roles, and statuses;
it never stores plaintext passwords or session tokens.

## Local development

Run the database migration and seed before signing in:

```bash
pnpm db:cloud:migrate
pnpm --filter @yuta/db-cloud db:seed
```

Development seed identities:

```text
Owner: owner@luna-restaurant.fr
Manager: manager@luna-restaurant.fr
```

Run `pnpm dev:env:sync` to create a random `YUTA_CLOUD_SEED_PASSWORD` in the
ignored `packages/db-cloud/.env.local`, or provide the variable explicitly.
Seed execution fails closed when it is missing. The owner and manager identities
receive active LUNA memberships. `admin@yutapro.fr` receives the `YUTA_ADMIN`
system role and no restaurant membership, so it cannot use the restaurant
back-office. Never deploy development seed identities or credentials.

## Password recovery

The reset-token storage and password reset page are implemented. Automated
delivery is intentionally not active because the repository does not yet have a
trusted transactional email service. Until one is configured, an owner or manager
must create and deliver the short-lived token through an approved operational
channel.
