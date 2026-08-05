# Contracts Package Instructions

`@yuta/contracts` is the source of truth for serialization-safe data crossing
application, process, API, event, or job boundaries.

- Define Zod schemas and infer TypeScript types; do not duplicate interfaces.
- Use `Schema`, `Input`, `Query`, `Response`, `Event`, and `Payload` names.
- Use ISO strings at transport boundaries and integer minor units for money.
- Keep public/authenticated responses separate when exposure differs.
- Do not import database schemas, Drizzle, React, Next.js, environment access,
  provider clients, filesystem code, or business calculations.
- Do not expose persistence rows as public contracts.

Validate with contracts typecheck/tests and architecture check.
