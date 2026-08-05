# Tenant and User Foundation

Status: Current

Owner: YUTA engineering

Last updated: 2026-08-05

Authority: `docs/architecture/TENANCY.md` and
`docs/architecture/AUTHENTICATION.md`

## Implemented scope

YUTA cloud identity and restaurant authorization use three separate records:

- `users` stores the internal human identity and optional YUTA system role;
- `organizations` and `establishments` store the approved cloud ownership
  hierarchy;
- `tenant_memberships` grants a user access to a restaurant establishment.

This follows `docs/architecture/TENANCY.md`: "tenant" is a runtime
context and not a database table. POS operational data remains local and has no
dependency on this foundation.

The user schema includes a unique external `authProviderId`, normalized email,
nullable display name, `ACTIVE`/`DISABLED` status, nullable `YUTA_ADMIN` or
`YUTA_SUPPORT` system role, and audit timestamps. Password fields remain only
for the current first-party back-office credential adapter.

Memberships use `OWNER`, `MANAGER`, or `STAFF`, are unique per user and
organization/establishment scope, include `joinedAt`, and use restrictive
foreign keys. Manager actions are limited to staff. Each establishment must
retain one active owner.

## Authentication adapters

`@yuta/auth` exports `AuthAdapter`, `AuthenticatedIdentity`, and
`createAuthService`. Provider payloads stop at the adapter. Domain code receives
only the internal `SessionUser`. Missing identities are unauthenticated;
disabled internal users are denied; system roles are checked explicitly.

The current back-office password flow continues to use opaque, hashed,
database-backed sessions. A future external provider implements `AuthAdapter`
and uses `createInternalUserLookup` from `@yuta/db-cloud`.

## Tenant selection

The existing back-office session is an HttpOnly, SameSite=Lax active-tenant
cookie. Switching revalidates active membership and rotates the session token.
The reusable tenant service additionally supports trusted route slugs and the
single-membership fallback. Multiple memberships without a selected tenant
produce a selection-required result.

Credential authentication with several active establishments creates a
single-use `auth_selection_tickets` record valid for 10 minutes. Its opaque
token is held in a separate HttpOnly cookie. The selection action accepts only
`membershipId`, validates ownership and every active status, consumes the
ticket atomically, and then creates the regular scoped `auth_sessions` record.
The session's organization and establishment columns remain non-null.

The restaurant back-office uses these selection routes:

```text
/access/no-establishment
/select-establishment
/resolve-establishment
```

The recovery route revokes an invalid existing scope and reruns the zero/one/many
membership resolution.

## Development identities and seed environment

The idempotent cloud seed creates three separate identities:

| Identity                     | Scope                  | Role                                               |
| ---------------------------- | ---------------------- | -------------------------------------------------- |
| `owner@luna-restaurant.fr`   | LUNA and LuNa Poitiers | `OWNER` membership in both establishments          |
| `manager@luna-restaurant.fr` | LUNA                   | `MANAGER` in the original establishment only       |
| `admin@yutapro.fr`           | YuTa platform          | `YUTA_ADMIN` system role, no restaurant membership |

For the current password adapter, set:

```text
YUTA_CLOUD_SEED_PASSWORD
```

Production seeding requires the password. Development may omit it and receives
the documented temporary development password. The legacy
`YUTA_CLOUD_SEED_ADMIN_PASSWORD` name remains accepted temporarily for local
environment compatibility.

## Development commands

```bash
pnpm db:cloud:migrate
pnpm db:cloud:seed
```

To recreate all isolated development databases and seed them:

```bash
CONFIRM_DB_RESET=true SEED_DB_RESET=true pnpm db:reset:dev
```

The reset script refuses `NODE_ENV=production` and requires explicit
confirmation.

## Deferred work

Invitations, public signup, custom roles, billing, ownership transfer, audited
support access, impersonation, platform-admin UI, and tenant deletion remain
out of scope. A YUTA system role does not grant restaurant access.
