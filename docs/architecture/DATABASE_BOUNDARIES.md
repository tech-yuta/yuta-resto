# YUTA Database and Runtime Boundaries

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

## Cloud

`packages/db-cloud` owns SaaS data used by server-side code in `apps/web`,
`apps/backoffice`, `apps/booking-web`, and `apps/feedback-web`. It uses
`CLOUD_DATABASE_URL` and owns identity, organizations, establishments,
memberships, domains, entitlements, reputation integrations, public booking,
and other approved cloud domains.

Tenant-owned cloud queries include `organizationId`; establishment-owned data
also includes `establishmentId`. Repository APIs enforce those predicates.

## POS local

`apps/site-agent` is the only runtime owner of `packages/db-pos` and uses
`POS_DATABASE_URL`. `apps/yuta-pos` calls site-agent and does not open a database
connection from its browser/server bundle. Orders, checks, payments, kitchen
state, print jobs, local staff, menu snapshots, and local operational reports
remain at the restaurant and are never synchronized to cloud persistence.

## Display local

`apps/yuta-display` is a standalone product. Its server code owns the schema and
repositories under `apps/yuta-display/src/db` and uses `DISPLAY_DATABASE_URL`.
Do not create `packages/db-display` unless a second legitimate server-side
consumer needs that database boundary.

## Global rules

- Never restore the legacy `@yuta/db` compatibility package.
- Never use ambiguous `DATABASE_URL` for these runtime families.
- Never expose database URLs through `NEXT_PUBLIC_*` variables.
- Cloud, POS, and display use separate names, credentials, migrations, backups,
  and failure domains even when development uses one PostgreSQL server.
- Use application-generated UUIDv7 for normal new business records unless an
  opaque security token needs cryptographically random bytes.
- Do not edit an already deployed migration; create and review a new migration.
- Integration tests use disposable databases and the repository's explicit
  safety guards.

Operational commands and topology live in `docs/operations/`.
