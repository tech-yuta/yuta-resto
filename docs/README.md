# YUTA Documentation Index

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

## Authority order

1. `CURRENT_STATE.md`
2. `architecture/`
3. the relevant document under `features/` or `products/`
4. `operations/`
5. accepted records under `decisions/`
6. code and tests as implementation evidence

Completed plans, audits, migration checkpoints, and implementation reports are
not current architecture authority. Git history preserves that record.

## Documentation visibility

- `Visibility: Public product` describes capabilities approved for public,
  pricing, commercial, partner, and customer-facing communication.
- `Visibility: Engineering` may describe every maintained runtime, including
  POS, Site Agent, Display, devices, printing, offline behavior, and local data.
- `Visibility: Local operator` is intended for restaurant operation.

Visibility labels define communication scope, not confidentiality. Secrets and
sensitive details never belong in the repository.

## Current documents

### Project state

- [`CURRENT_STATE.md`](CURRENT_STATE.md)
- [`REPOSITORY_MAP.md`](REPOSITORY_MAP.md)

### Architecture

- [`architecture/OVERVIEW.md`](architecture/OVERVIEW.md)
- [`architecture/DATABASE_BOUNDARIES.md`](architecture/DATABASE_BOUNDARIES.md)
- [`architecture/TENANCY.md`](architecture/TENANCY.md)
- [`architecture/AUTHENTICATION.md`](architecture/AUTHENTICATION.md)
- [`architecture/IDENTITY_AND_MEMBERSHIP.md`](architecture/IDENTITY_AND_MEMBERSHIP.md)
- [`architecture/DATA_MODEL.md`](architecture/DATA_MODEL.md)

### Cloud features

- [`features/public-website/README.md`](features/public-website/README.md)
- [`features/public-booking/README.md`](features/public-booking/README.md)
- [`features/public-booking/PRODUCT_SPEC.md`](features/public-booking/PRODUCT_SPEC.md)
- [`features/public-booking/STATUS.md`](features/public-booking/STATUS.md)
- [`features/reputation/README.md`](features/reputation/README.md)
- [`features/reputation/STATUS.md`](features/reputation/STATUS.md)

### Local products

- [`products/pos/README.md`](products/pos/README.md)
- [`products/pos/USER_GUIDE.md`](products/pos/USER_GUIDE.md)
- [`products/pos/OFFLINE_STRATEGY.md`](products/pos/OFFLINE_STRATEGY.md)
- [`products/pos/QA_CHECKLIST.md`](products/pos/QA_CHECKLIST.md)
- [`products/pos/PRODUCT_SPEC.md`](products/pos/PRODUCT_SPEC.md)

The standalone display product is governed by `apps/yuta-display/AGENTS.md` and
the shared operations documents until a dedicated product document is needed.

### UI implementation

- [`ui/README.md`](ui/README.md)
- [`ui/YUTA_FRONTEND_RULES.md`](ui/YUTA_FRONTEND_RULES.md)
- [`ui/pages/HORAIRES_SERVICES_UI_SPEC.md`](ui/pages/HORAIRES_SERVICES_UI_SPEC.md)

### Operations and process

- [`operations/LOCAL_DEVELOPMENT.md`](operations/LOCAL_DEVELOPMENT.md)
- [`operations/DEPLOYMENT.md`](operations/DEPLOYMENT.md)
- [`DEVELOPMENT_WORKFLOW.md`](DEVELOPMENT_WORKFLOW.md)
- [`DOCUMENTATION_POLICY.md`](DOCUMENTATION_POLICY.md)
- [`tasks/TASK_TEMPLATE.md`](tasks/TASK_TEMPLATE.md)
- [`decisions/ADR-000-template.md`](decisions/ADR-000-template.md)
- [`decisions/ADR-001-runtime-families-and-product-visibility.md`](decisions/ADR-001-runtime-families-and-product-visibility.md)
- [`decisions/ADR-002-independent-public-booking-application.md`](decisions/ADR-002-independent-public-booking-application.md)
- [`decisions/ADR-003-database-ownership-boundaries.md`](decisions/ADR-003-database-ownership-boundaries.md)
- [`decisions/ADR-004-independent-public-feedback-application.md`](decisions/ADR-004-independent-public-feedback-application.md)

Completed task specifications are removed after durable behavior is reflected
in current feature documentation and remaining work is captured in `STATUS.md`.

## Maintenance

- Update an existing current document instead of adding an overlapping report.
- Remove superseded plans only after durable rules have been extracted.
- Keep `packages/ui/src/index.ts` authoritative for public UI exports; do not
  duplicate its catalog in instruction files.
- Check links after moving or deleting files.
- Public-product documents must not promote local operational workflows as
  YUTA public-service capabilities.
