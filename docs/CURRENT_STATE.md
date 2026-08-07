# YUTA Current State

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-06

## Product scope

YUTA intentionally maintains deliberately separated cloud and local runtime
families in one monorepo.

- Cloud: public website, restaurant back-office, independent public booking and
  feedback applications, identity, tenancy, reputation, and cloud-owned
  configuration.
- Restaurant local: POS client, site-agent API/device boundary, and POS database.
- Standalone local: digital signage display and its app-owned database.

POS operational data must never be stored in or synchronized to the cloud
database. Display data remains separate from both cloud and POS data.

The restaurant back-office does not expose customer ordering, checkout,
payment, invoicing, transaction-linked loyalty, promotion, or generic email
workflows. Those local operational concerns remain outside the cloud service.
Establishment identity and the room/table structure are grouped as core
establishment data. The table map is limited to physical seating and
reservation availability.

## Implemented

- pnpm monorepo, shared contracts/core/UI packages, and import-boundary checks.
- Separate `db-cloud` and `db-pos` packages; the legacy shared `@yuta/db` has
  been removed from tracked source.
- Organization/establishment tenancy, memberships, entitlements, server-side
  sessions, tenant switching, and user/membership administration.
- Public website and an independent tenant-scoped direct-feedback application.
- Public booking Phase 0/1 foundations: independent booking app, booking domain,
  cloud persistence, availability/capacity rules, public creation and management,
  and back-office reservation workflows.
- Establishment-scoped Backoffice Today dashboard using current reservations,
  booking service periods and dated exceptions, and entitled reputation
  feedback, with independent truthful section states.
- Establishment-owned general profile data and Backoffice editor for identity,
  structured address, contacts, website, media URLs, languages, service modes,
  and public visibility. OWNER and MANAGER may edit; STAFF is read-only.
- Backoffice navigation includes cloud-owned integrated, prototype, and planned
  surfaces. Their maturity is recorded below. None of these routes reads from
  or synchronizes with POS data.
- Local POS ordering, kitchen, payment, printing, administration, and reporting
  workflows described in the POS product documentation.
- Standalone digital-signage administration and resilient display playback.

## Back-office surface maturity

Navigation visibility is not evidence that a capability is implemented. The
current restaurant back-office surfaces fall into three groups:

### Integrated and data-backed

- Today dashboard;
- reservation list and reservation settings;
- establishment general information and booking hours/services;
- direct satisfaction and reputation review management;
- tenant user and membership administration.

`/parametres/integrations` is also data-backed and owns the tenant-scoped Google
Business Profile connector, although it is not currently a primary navigation
item.

### UI prototypes with fixture data only

- room and table map;
- stock inventory, stock movements, and suppliers;
- compliance monitoring;
- creative studio.

These prototypes have local presentation state but no cloud repository or
persisted mutation. Their export, create, edit, archive, verification,
generation, and similar controls must not be described as implemented product
capabilities. Each prototype displays a shared demonstration-data notice, and
controls that would imply a persisted mutation, generated artifact, or export
are disabled. Local filtering and selection remain available for interface
evaluation. Integrating one requires an approved product scope, data owner,
authorization model, contracts, persistence, and tests.

### Planned empty surfaces

- menu content and internal resources;
- technical sheets;
- employees, planning, time tracking, daily tasks, and personnel formalities;
- marketing content creation;
- modules and subscription.

These routes deliberately use the shared planned-page state. Their presence in
navigation does not approve a schema, contract, provider, mutation, or delivery
roadmap.

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
