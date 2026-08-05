# YUTA Repository Map

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

## Applications

- `apps/web`: public marketing, legal, integration, SEO, and approved public
  tenant flows; cloud persistence is server-only.
- `apps/backoffice`: authenticated restaurant administration for organizations
  and establishments; not platform-wide YUTA administration.
- `apps/booking-web`: independent public booking application; resolves an
  establishment on the server and uses cloud-owned booking data.
- `apps/yuta-pos`: browser/PWA client for local restaurant operations; accesses
  operational data through `apps/site-agent`.
- `apps/site-agent`: local POS API, persistence, printing, realtime, and device
  integration boundary; runtime owner of `packages/db-pos`.
- `apps/yuta-display`: standalone local signage product with its database under
  `apps/yuta-display/src/db`.
- `apps/platform-admin`: reserved name; not implemented.

## Shared packages

- `packages/auth`: environment-neutral authentication contracts and
  cryptographic primitives.
- `packages/contracts`: serialization-safe transport schemas and types.
- `packages/core`: pure shared domain logic and registries.
- `packages/booking`: pure booking-domain logic.
- `packages/tenant`: trusted cloud tenant context, resolution ports, and guards.
- `packages/db-cloud`: cloud schemas, migrations, repositories, and persistence
  adapters.
- `packages/db-pos`: local POS schemas, migrations, and repositories; owned at
  runtime by site-agent.
- `packages/ui`: shared accessible UI components and semantic design tokens.

## Dependency direction

```text
web / backoffice / booking-web -- server only --> db-cloud
backoffice / booking-web ----------------------> auth / tenant / booking
yuta-pos --------------------------------------> site-agent HTTP API
site-agent ------------------------------------> db-pos
yuta-display ----------------------------------> app-owned display database
all UI applications --------------------------> ui
boundary payloads ----------------------------> contracts
domain logic ---------------------------------> core / booking
```

No application may use `@yuta/db`. No browser bundle may contain a database
connection string, driver, secret, or trusted authorization scope.

## Product visibility

Keeping a local application in this monorepo does not make it a public YUTA
service capability. Public website, SEO, pricing, partner/bank, commercial, and
customer-facing documents must not promote local checkout, payment, billing,
invoicing, cash-register, or money-management workflows as public services.

Engineering and local operator documentation may describe maintained local
products in full.
