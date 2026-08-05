# ADR-001: Keep cloud and local runtime families in one monorepo

Status: Accepted

Date: 2026-08-05

Decision owners: YUTA

## Context

YUTA maintains cloud services, a local POS/Site Agent runtime, and a standalone
Display runtime. They share contracts, pure domain logic, UI components,
tooling, and engineering conventions. Local products are not advertised as
public YUTA service capabilities.

## Decision

Keep cloud applications/persistence, local POS/Site Agent/POS persistence,
standalone Display persistence, and shared foundation packages in one
monorepo. Keep runtime/data ownership, failure domains, environment variables,
migrations, and product-communication visibility separate.

Engineering and local operator documentation may describe local products.
Public marketing, pricing, partner/bank, commercial, and customer-facing
documents must not present local checkout, payment, billing, invoicing,
cash-register, or money-management workflows as public YUTA services.

## Alternatives considered

### Separate repositories

Rejected for the current phase because shared contracts, logic, UI, tooling,
and coordinated changes would require additional release management.

### Treat local products as public-service modules

Rejected because it conflicts with approved product positioning.

## Consequences

Shared changes remain atomic and engineering uses one workflow/CI system, but
instructions and documentation must distinguish repository scope from public
product visibility. A public repository still exposes engineering content;
visibility metadata is not a confidentiality control.

## Enforcement

- Root and nested `AGENTS.md` files.
- `pnpm architecture:check`.
- Separate database variables and migrations.
- Documentation visibility metadata and public-copy review.
