# Admin Authentication

YuTa Admin uses server-side, database-backed sessions. Authentication is
implemented by `@yuta/auth`, `@yuta/db`, and the server boundary in
`apps/admin/src/server/auth`.

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

## Cookie policy

The admin session cookie is named `yuta_admin_session` and uses:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- root path
- a fixed 14-day expiration

Logout revokes the database session before deleting the browser cookie.
Password reset increments the user's authentication version and revokes all
active sessions.

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

## Local development

Run the database migration and seed before signing in:

```bash
corepack pnpm --filter @yuta/db db:migrate
corepack pnpm --filter @yuta/db db:seed
```

Default development login:

```text
Email: admin@yuta.local
Password: ChangeMe-YuTa-2026!
```

Set `YUTA_SEED_ADMIN_PASSWORD` before seeding to choose a different password.
Production seeding refuses to run without this variable.

## Password recovery

The reset-token storage and password reset page are implemented. Automated
delivery is intentionally not active because the repository does not yet have a
trusted transactional email service. Until one is configured, an administrator
must create and deliver the short-lived token through an approved operational
channel.
