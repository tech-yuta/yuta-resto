# ADR-003: Separate cloud, POS, and Display database ownership

Status: Accepted

Date: 2026-08-05

Decision owners: YUTA

## Context

Cloud SaaS, restaurant-local operations, and standalone Display have different
availability, connectivity, ownership, security, and failure-domain needs.

## Decision

- Cloud: `packages/db-cloud`, accessed by cloud server code using
  `CLOUD_DATABASE_URL`.
- POS: `packages/db-pos`, owned by `apps/site-agent` using `POS_DATABASE_URL`.
- Display: app-owned persistence under `apps/yuta-display` using
  `DISPLAY_DATABASE_URL`.

POS operational data is not stored in or synchronized to cloud persistence.
Do not recreate `@yuta/db` as a compatibility facade.

## Consequences

Runtime failures remain isolated and restaurant-local operations do not depend
on cloud availability. Migrations, credentials, backups, and recovery are
managed independently. Shared schemas are transport contracts, not shared
database rows.
