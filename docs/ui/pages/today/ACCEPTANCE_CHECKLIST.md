# Today dashboard — Acceptance checklist

## Documentation and repository

- [ ] Root, Backoffice, current feature, and current UI documents were read.
- [ ] The package follows `docs/ui/PAGE_PACK_PROTOCOL.md`.
- [ ] `/aujourdhui` remains the only current route.
- [ ] Current documentation indexes and checks include this package.
- [ ] No parallel, versioned, migration, or completion document is added.

## Security and boundaries

- [ ] Organization and establishment scope comes from trusted server context.
- [ ] Booking entitlement and `booking.read` are enforced.
- [ ] Reputation entitlement and `reputation.read` are enforced when applicable.
- [ ] `@yuta/db-cloud` remains server-side.
- [ ] One tenant cannot access another tenant's dashboard data.
- [ ] Browser input does not define trusted scope, permission, locale, or timezone.

## Product scope

- [ ] Fixture dashboard values are removed from the production route.
- [ ] Financial, payment, cash, POS, and order-flow content is absent.
- [ ] Tasks, team, generic email, and content approval are not fabricated.
- [ ] Reservation cut-off and last-arrival fields are absent.
- [ ] No unsupported navigation, mutation, schema, contract, or permission is added.

## Current data

- [ ] The date uses establishment timezone and locale.
- [ ] Reservations use the establishment-local date and current statuses.
- [ ] Reservation counters reconcile with the scoped result.
- [ ] Booking services use enabled persisted periods for the local weekday.
- [ ] Reviews appear only when entitled, permitted, and supported.
- [ ] Independent section failures do not become misleading zeros.

## UI and interactions

- [ ] Existing shell and tenant selector remain unchanged.
- [ ] Supported summaries use real destinations.
- [ ] Reservations remain the dominant task surface.
- [ ] Add behavior exposes only real, permission-allowed actions.
- [ ] Unsupported filter chips and empty overflow menus are absent.
- [ ] Loading, empty, hidden/forbidden, unavailable, and recovery states are truthful.
- [ ] `@yuta/ui`, semantic tokens, and `lucide-react` are reused.

## Responsive and accessibility

- [ ] 1536, 1024, 768, and 390 px are checked.
- [ ] No horizontal page overflow occurs.
- [ ] Mobile content follows the specified priority order.
- [ ] Heading hierarchy is valid.
- [ ] Status includes text and does not rely on color.
- [ ] Focus is visible and keyboard operation works.
- [ ] Icon-only actions and links have accessible names.
- [ ] Skeletons and updates avoid disruptive announcements.

## Verification

- [ ] `pnpm docs:check`
- [ ] `pnpm format:check`
- [ ] `pnpm architecture:check`
- [ ] `pnpm -r --if-present typecheck`
- [ ] Backoffice tests
- [ ] Backoffice build
- [ ] Relevant booking and reputation tests
- [ ] Relevant tenant, authorization, contract, and cloud-database tests
- [ ] Browser console and hydration checked
- [ ] Screenshots captured at approved widths
- [ ] No lint result claimed because Backoffice has no lint script
