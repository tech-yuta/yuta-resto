# Public Booking Status

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

## Implemented foundation

- Independent `apps/booking-web` application and pure `packages/booking` domain.
- Cloud persistence and server-side establishment resolution.
- Availability/capacity rules and public creation/management foundations.
- Back-office reservation workflows, shared contracts, and UI foundations.

## Release reconciliation required

- Confirm tenant/establishment scope in every booking query and mutation.
- Run concurrency and capacity acceptance tests.
- Validate production build environment and notification dependencies.
- Confirm public/back-office loading, empty, error, forbidden, conflict,
  success, and recovery states.
- Reconcile implemented behavior with `README.md` and `PRODUCT_SPEC.md`.
- Document remaining external provider and operator dependencies.

## Validation

```bash
pnpm architecture:check
pnpm --filter @yuta/booking typecheck
pnpm --filter @yuta/booking test
pnpm --filter @yuta/booking-web typecheck
pnpm --filter @yuta/booking-web build
pnpm --filter @yuta/backoffice typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```
