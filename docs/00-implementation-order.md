# YUTA Multi-Tenant Foundation — Codex Implementation Order

This document coordinates the implementation of:

- `packages/contracts` as `@yuta/contracts`.
- `packages/tenant` as `@yuta/tenant`.

Read the two package specifications before modifying code.

---

## 1. Repository context

Current applications:

```text
apps/
├── admin
├── web
├── yuta-display
└── yuta-pos
```

Current shared packages:

```text
packages/
├── core
├── db
└── ui
```

Target additions:

```text
packages/
├── contracts
└── tenant
```

Do not restructure or rename existing applications as part of this task.

---

## 2. Required dependency direction

```text
apps/*
├── @yuta/contracts
├── @yuta/tenant
├── @yuta/core
├── @yuta/db (server only)
└── @yuta/ui

@yuta/contracts → zod only
@yuta/tenant    → zod only
@yuta/core      → may consume contract types
@yuta/db        → implements tenant lookup/repository adapters
```

Forbidden:

```text
@yuta/contracts → @yuta/db/core/ui/next/react
@yuta/tenant    → @yuta/db/ui/next/react
client code     → @yuta/db
```

---

## 3. Recommended implementation sequence

### Step 1 — inspect before editing

Codex must search the repository for:

- Existing order and reservation DTOs.
- Zod schemas.
- Order/reservation status enums.
- Organization/restaurant/establishment models.
- Hard-coded LUNA IDs, names, hostnames, locale, timezone, and currency.
- Membership/role definitions.
- Shared event types used by POS and display.

Create a short inventory before migrating definitions.

### Step 2 — create `@yuta/contracts`

Implement:

- Common ID/date/money/error schemas.
- Existing shared order status and event schemas.
- Existing reservation request/response schemas where applicable.
- Unit tests.

Migrate only definitions that are already shared or duplicated.

### Step 3 — create `@yuta/tenant`

Implement:

- Context types.
- Hostname normalization.
- Lookup ports.
- Public/authenticated resolvers.
- Scope and entitlement guards.
- Unit tests.

Keep database adapters outside the package.

### Step 4 — integrate the smallest end-to-end flows

Recommended first flows:

1. POS creates or emits an order using `@yuta/contracts`.
2. Display validates/consumes the same event contract.
3. Public web resolves LUNA from hostname through `@yuta/tenant`.
4. One server-side repository query receives tenant context explicitly.

### Step 5 — validate repository health

Run the repository-standard commands for:

- Formatting.
- Linting.
- Type checking.
- Unit tests.
- Builds for all apps.

Do not leave applications in partially migrated states.

---

## 4. Deliverables expected from Codex

- New `packages/contracts` package.
- New `packages/tenant` package.
- Unit tests for both packages.
- Updated workspace imports in initial consumers.
- No duplicated migrated enums/schemas.
- No production fallback to LUNA for unknown hostnames.
- A concise migration report containing:
  - Files added.
  - Definitions migrated.
  - Existing incompatible definitions found.
  - Remaining hard-coded LUNA assumptions.
  - Remaining repositories without tenant scoping.
  - Commands run and their results.

---

## 5. Stop conditions

Codex must stop and ask for clarification when:

- `restaurant`, `organization`, `establishment`, `site`, or `store` are used with conflicting meanings.
- Two apps use the same status name with different semantics.
- Current IDs are not UUIDs and changing them would require a migration.
- Existing authentication does not expose a trustworthy user ID.
- A proposed change would alter production data or destructive migrations.
- Tests reveal current cross-tenant behavior that product requirements do not clearly resolve.
