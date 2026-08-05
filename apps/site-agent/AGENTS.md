# Site Agent Instructions

`apps/site-agent` is the restaurant-local POS API, persistence, printing,
realtime, and device-integration boundary.

- It is the only runtime owner of `@yuta/db-pos`.
- Use `POS_DATABASE_URL`; never access cloud or display databases.
- Validate every HTTP/device input with Zod and return serialization-safe
  contracts without leaking database rows or secrets.
- Keep order, payment, kitchen, print, and administrative mutations atomic and
  idempotent where retries are possible.
- Fail safely when PostgreSQL, printers, or devices are unavailable and expose
  actionable health information without sensitive data.
- Local authentication and authorization must fail closed.

Validate with architecture check, site-agent typecheck/tests, and affected
db-pos integration tests using the documented disposable-database guard.
