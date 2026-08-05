# Public Booking Agent Instructions

`apps/booking-web` is the independent, mobile-first public reservation app. Its
UI is French and it does not share a browser session with the back-office.

- Resolve the establishment on the server from the documented public slug or
  token. Never accept organization or establishment IDs as trusted client scope.
- Keep `@yuta/db-cloud`, environment variables, notification providers, and
  trusted capacity decisions server-only.
- Use `@yuta/booking` for pure availability/domain rules and shared contracts
  for boundary payloads.
- Reservation creation must preserve capacity, idempotency, status history,
  audit/event, timezone, consent, abuse-protection, and tenant invariants.
- Public management tokens are secret bearer credentials: store only hashes,
  avoid logs, and return non-sensitive errors.
- Public reservation URLs are `noindex, nofollow` unless product policy changes.
- Reuse `@yuta/ui`; implement loading, unavailable, validation, conflict,
  success, and recovery states.

Validate with the booking-web typecheck/build plus booking, contracts,
db-cloud, tenant, and architecture checks.
