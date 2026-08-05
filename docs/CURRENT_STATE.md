# YUTA Current State

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

## Product scope

YUTA intentionally maintains deliberately separated cloud and local runtime
families in one monorepo.

- Cloud: public website, restaurant back-office, public booking, identity,
  tenancy, reputation, and cloud-owned configuration.
- Restaurant local: POS client, site-agent API/device boundary, and POS database.
- Standalone local: digital signage display and its app-owned database.

POS operational data must never be stored in or synchronized to the cloud
database. Display data remains separate from both cloud and POS data.

## Implemented

- pnpm monorepo, shared contracts/core/UI packages, and import-boundary checks.
- Separate `db-cloud` and `db-pos` packages; the legacy shared `@yuta/db` has
  been removed from tracked source.
- Organization/establishment tenancy, memberships, entitlements, server-side
  sessions, tenant switching, and user/membership administration.
- Public website and tenant-scoped reputation feedback foundations.
- Public booking Phase 0/1 foundations: independent booking app, booking domain,
  cloud persistence, availability/capacity rules, public creation and management,
  and back-office reservation workflows.
- Local POS ordering, kitchen, payment, printing, administration, and reporting
  workflows described in the POS product documentation.
- Standalone digital-signage administration and resilient display playback.

## Active and partial work

- Public booking Phase 0/1 is implemented but still requires release-level
  reconciliation and validation. Its feature `STATUS.md` is authoritative for
  remaining work.
- Reputation still requires completion of review synchronization, controlled
  reply publication/reconciliation, AI-assisted analysis/drafting, and broader
  connector coverage.
- Production publisher/legal configuration and external provider approvals
  remain operational dependencies.

## Planned

- Internal platform administration under the reserved `apps/platform-admin`
  name after an approved specification exists.
- Additional restaurant modules only after product scope and data ownership are
  explicitly defined.

## Documentation status

The database reset plan has been replaced by current architecture documents.
Historical implementation plans and pre-reset audits are preserved by Git
history, not the active documentation tree.

The UI export catalog is maintained only in `packages/ui/src/index.ts`.
