# YuTa POS Offline Strategy

Status: Current

Visibility: Engineering

Owner: YUTA engineering and operations

Last updated: 2026-08-05

## Decision status

- Status: accepted target architecture.
- Original decision date: 2026-07-19.
- Database-boundary reset: 2026-07-27.
- Authoritative database boundaries:
  `docs/architecture/DATABASE_BOUNDARIES.md`.

This document defines the offline availability target for `apps/yuta-pos`.
The implementation uses the isolated local POS database architecture.

## Availability target

> The restaurant must continue normal POS, kitchen, payment-recording, and
> local printing operations when Internet and all YuTa cloud services are
> unavailable, as long as the restaurant LAN and local server remain healthy.

Browser-only operation after the local server or LAN fails is not an MVP
requirement.

## Data-residency rule

POS operational data is local-only. It must never be stored in, replicated to,
or synchronized with the cloud database.

This includes:

- orders and order items;
- payments, checks, cash movements, and shifts;
- kitchen tickets and status events;
- printer jobs and device state;
- local POS users, roles, PIN sessions, and audit events;
- local menu/catalog data used during service.

There is no phase for POS-to-cloud synchronization in the current
architecture. Any future analytics or export product requires a separate
specification, explicit customer consent, dedicated contracts, and a separate
data model.

## Target topology

```text
POS terminals/tablets
        |
        | local HTTP/WebSocket
        v
apps/site-agent
        |
        +--> packages/db-pos --> local PostgreSQL
        +--> local printer queue --> printers
        +--> local backup and health jobs
```

`apps/yuta-pos` is a client and receives no database connection string.
`apps/site-agent` is the only runtime owner of `POS_DATABASE_URL` and
`packages/db-pos`.

Stopping the Internet connection, cloud database, `apps/backoffice`, or `apps/web`
must not prevent local POS operation.

## Current implementation state

The current POS is an installable level-one PWA, not a browser-offline POS.

- The service worker caches the manifest, icons, and immutable Next.js assets.
- Page navigation and operational actions require the local Next.js server.
- POS UI code accesses operational data only through `site-agent`.
- Print-job persistence and state transitions are owned by `site-agent`;
  physical printer transport remains pending.
- Backup, guarded restore, and health checks exist.
- `apps/site-agent` and `packages/db-pos` own the local database boundary.

## Local transaction requirements

The following operations must remain atomic in the POS database:

```text
Send to kitchen
  update the exact pending item batch
  + create the kitchen ticket
  + create the local printer job

Capture payment
  append the payment
  + update check/order state
  + create the final local receipt job when applicable
```

Requirements:

- Commands that may be retried use unique idempotency keys.
- Replaying identical input returns the existing result.
- Reusing an idempotency key with different input fails.
- Concurrent payment/order transitions use row locking, constraints, or an
  equivalent compare-and-set mechanism.
- Payment corrections use explicit refund/reversal records or state
  transitions, never destructive history rewrites.
- No cloud availability check participates in a local transaction.

## Local identity and IDs

The POS database represents one restaurant/site and is not cloud multi-tenant.
Operational tables do not depend on `@yuta/tenant`, `organization_id`, or
`establishment_id`.

A single installation record may contain an installation ID, site ID, display
name, and local license state.

Use application-generated UUIDv7 identifiers for new business records.
Authentication credentials, PIN verifiers, reset tokens, and other secrets use
dedicated cryptographically secure mechanisms instead of UUIDs.

## Backup and recovery

- Store automatic backups outside the primary database disk.
- Encrypt backups that leave the restaurant device.
- Verify checksums before restore.
- Test restoration into a clean local PostgreSQL instance.
- Document recovery-time and recovery-point expectations.
- Keep restore commands guarded against targeting the active production
  database accidentally.
- A backup must contain no cloud database credentials.

## Health and operator visibility

The local health surface must distinguish:

- POS client/server unavailable;
- `site-agent` unavailable;
- POS database unavailable;
- printer/worker unavailable;
- Internet unavailable while local service remains operational.

Internet availability must not determine the POS service health result.

## Security

- Bind `site-agent` only to configured trusted local interfaces.
- Do not expose PostgreSQL publicly.
- Do not expose `POS_DATABASE_URL` to browser code.
- Authenticate manager-only local endpoints.
- Store printer/device secrets locally.
- Do not give `site-agent` `CLOUD_DATABASE_URL`.
- Do not upload POS operational logs or data to cloud services.

## Acceptance tests

- Create, update, send, cancel, and pay an order with Internet disabled.
- Persist kitchen tickets and printer jobs locally.
- Restart POS services without losing committed operations.
- Run the local stack with only `POS_DATABASE_URL`.
- Confirm that cloud services can be stopped without affecting POS operation.
- Confirm that the POS schema has no cloud account, OAuth, organization,
  establishment-membership, or subscription tables.
- Confirm that no local runtime can import `@yuta/db-cloud`.

## Explicit non-goals

- POS operational-data synchronization to cloud;
- cloud POS dashboards or cross-site aggregation;
- cloud queries into the local POS database;
- browser-to-browser database replication;
- PostgreSQL multi-master replication;
- a service-worker cache used as an operational database;
- browser emergency order entry after the local server fails;
- speculative outbox or sync-event tables.

## Documentation maintenance

When offline behavior changes, update this document together with:

- `docs/products/pos/README.md`;
- `docs/products/pos/USER_GUIDE.md`;
- `docs/operations/LOCAL_DEVELOPMENT.md`;
- `docs/operations/DEPLOYMENT.md`;
- `docs/products/pos/QA_CHECKLIST.md`.
