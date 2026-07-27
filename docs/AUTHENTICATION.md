# Admin Authentication

YuTa Admin uses server-side, database-backed sessions. Authentication is
implemented by `@yuta/auth`, the cloud database boundary, and the server
boundary in `apps/admin/src/server/auth`.

Authentication persistence and tenant lookup adapters are implemented in
`@yuta/db-cloud`. Admin server code creates the cloud client from
`CLOUD_DATABASE_URL`; the removed legacy `@yuta/db` package is not used.

Cloud authentication is not used by `apps/yuta-pos`, `apps/site-agent`, or
`apps/yuta-display`. POS staff authentication is local and uses local users,
roles, PIN sessions, and audit records through `site-agent`/`db-pos`.

## Sign-in flow

1. `/login` validates the submitted email and password on the server.
2. Passwords are verified with Node.js scrypt. Plaintext passwords are never
   stored.
3. A cryptographically random session token is returned in an HttpOnly cookie.
4. PostgreSQL stores only the SHA-256 hash of the session token.
5. The authenticated layout validates the session and active user.
6. The session organization and establishment are checked against an active
   `tenant_memberships` record.
7. `resolveAuthenticatedTenant` produces the trusted tenant context used by
   repositories and permission checks.

Browser input, query parameters, and cookies are never trusted as sources for a
user role, organization, establishment, entitlement, or permission.

## Organization and establishment switching

The authenticated admin shell lists every active establishment membership
available to the current user. Options are grouped by organization. A user can
switch across establishments in one organization or across organizations only
when an active establishment-level membership exists for each target.

Switching is a server-side operation:

1. The current session token is validated again.
2. The target establishment UUID is checked against an active membership, an
   active organization, and an active establishment.
3. The current database session is revoked.
4. A new database session and opaque cookie token are issued for the selected
   organization and establishment.
5. The current page is reloaded using the new trusted tenant context.

The client cannot provide or override an organization identifier. It submits
only the target establishment UUID, and the organization is derived from the
validated membership. If membership access was removed after the selector was
rendered, the switch is rejected and the existing session remains unchanged.

## Cookie policy

The admin session cookie is named `yuta_admin_session` and uses:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- root path
- a fixed 14-day expiration

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

The global `users` record is the login identity. `tenant_memberships.role` is
the authorization source of truth. The legacy `users.role` field remains for
the POS until its authorization layer is migrated.

Reputation permissions are enforced server-side:

- Owner/admin: all reputation permissions.
- Manager: read, draft/publish replies, incidents, and analytics.
- Employee: read, create drafts, and create incidents.
- Other roles: no reputation access by default.

Client-side button visibility is only a usability aid and must not replace the
server permission check.

## User and membership administration

`/settings/users` is the tenant-aware access management surface:

- The "Utilisateurs & accès" navigation item is shown only to owners and
  administrators.
- Owners can manage active establishments across their current organization.
- Administrators can manage only the currently selected establishment.
- Administrators cannot assign or modify owner and administrator roles.
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

Default development login:

```text
Email: admin@yuta.local
Password: ChangeMe-YuTa-2026!
```

Set `YUTA_SEED_ADMIN_PASSWORD` before seeding to choose a different password.
The seeded administrator receives the owner membership so organization-wide
membership management can be tested locally. Production seeding refuses to run
without this variable.

## Password recovery

The reset-token storage and password reset page are implemented. Automated
delivery is intentionally not active because the repository does not yet have a
trusted transactional email service. Until one is configured, an administrator
must create and deliver the short-lived token through an approved operational
channel.
