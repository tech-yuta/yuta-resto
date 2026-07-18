# YUTA Package Specification — `@yuta/contracts`

**Status:** Implementation-ready specification  
**Repository:** `YUTA-RESTO` pnpm workspace  
**Target package path:** `packages/contracts`  
**Consumers:** `apps/admin`, `apps/web`, `apps/yuta-pos`, `apps/yuta-display`, and future `apps/api`, `apps/worker`, `apps/local-agent`

---

## 1. Purpose

`@yuta/contracts` is the single source of truth for data exchanged between YUTA applications and processes.

It defines:

- API request schemas.
- API response schemas.
- Realtime and background-job event schemas.
- Shared public enums and identifiers.
- Pagination and error response formats.
- Runtime validation through Zod.
- TypeScript types inferred from the same Zod schemas.

The package answers one question:

> What exact data shape is allowed to cross an application boundary?

Examples of application boundaries:

- `apps/web` → reservation API.
- `apps/yuta-pos` → order API.
- API → `apps/yuta-display` realtime event.
- API → background worker job.
- Cloud → local agent synchronization.

---

## 2. Scope

### In scope

- Transport-layer DTOs.
- Zod validation schemas.
- Stable event envelopes.
- API error contracts.
- Cursor or page-based pagination contracts.
- Serialization-safe values only.
- Versioned cross-process messages where needed.

### Out of scope

The package must **not** contain:

- Drizzle schemas or database rows.
- SQL queries or repository code.
- Business rules such as price calculation or capacity calculation.
- React components.
- Next.js route handlers or server actions.
- Environment variables or secrets.
- Authentication provider implementation.
- LUNA-specific constants or content.

Important invariant:

```text
Database model != API contract != UI form state
```

---

## 3. Dependency rules

`@yuta/contracts` must remain a low-level, portable package.

Allowed dependencies:

- `zod`.
- Small, environment-neutral utilities if strictly necessary.

Forbidden dependencies:

- `next`.
- `react`.
- `@yuta/db`.
- `@yuta/ui`.
- `@yuta/core`.
- Node-only APIs such as `fs`, `path`, or database drivers.

Preferred dependency graph:

```text
apps/* ───────────────→ @yuta/contracts
@Yuta/core ───────────→ @yuta/contracts (types only when useful)
@Yuta/db ─────────────→ no dependency required
@Yuta/contracts ──────→ zod only
```

The package must work in browser, Node.js, Edge runtime, tests, and workers.

---

## 4. Recommended file structure

Start small but domain-oriented:

```text
packages/contracts/
├── package.json
├── tsconfig.json
├── src/
│   ├── common/
│   │   ├── ids.ts
│   │   ├── money.ts
│   │   ├── pagination.ts
│   │   ├── api-error.ts
│   │   └── event-envelope.ts
│   │
│   ├── reservations/
│   │   ├── create-reservation.ts
│   │   ├── update-reservation-status.ts
│   │   ├── reservation-response.ts
│   │   └── reservation-events.ts
│   │
│   ├── orders/
│   │   ├── create-order.ts
│   │   ├── update-order-status.ts
│   │   ├── order-response.ts
│   │   └── order-events.ts
│   │
│   ├── display/
│   │   └── kitchen-display-events.ts
│   │
│   ├── sync/
│   │   ├── sync-envelope.ts
│   │   └── sync-result.ts
│   │
│   └── index.ts
│
└── test/
    ├── reservations.test.ts
    ├── orders.test.ts
    └── common.test.ts
```

Do not create empty domain folders merely for appearance. Implement only domains currently shared by at least two applications, then extend incrementally.

---

## 5. Package exports

Recommended `package.json`:

```json
{
  "name": "@yuta/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./common": "./src/common/index.ts",
    "./reservations": "./src/reservations/index.ts",
    "./orders": "./src/orders/index.ts",
    "./display": "./src/display/index.ts",
    "./sync": "./src/sync/index.ts"
  },
  "dependencies": {
    "zod": "workspace:*"
  }
}
```

If Zod is not managed as a workspace package, use the repository's current Zod version instead of `workspace:*`.

Public exports must be intentional. Internal helpers should not be exported from the root package.

---

## 6. Naming conventions

### Zod schemas

Use the suffix `Schema`:

```ts
createReservationInputSchema
reservationResponseSchema
kitchenOrderCreatedEventSchema
```

### TypeScript types

Infer types from schemas and use PascalCase:

```ts
export type CreateReservationInput = z.infer<
  typeof createReservationInputSchema
>;
```

Never manually duplicate a TypeScript interface that already has a Zod schema.

### Input, response, and event names

Use explicit suffixes:

- `Input`: data accepted by a command or endpoint.
- `Query`: filters accepted by a read endpoint.
- `Response`: data returned outside the server boundary.
- `Event`: immutable message describing something that happened.
- `Payload`: nested event or job data.

Avoid vague names such as `ReservationData`, `OrderObject`, or `CommonType`.

---

## 7. Common primitives

### 7.1 Identifiers

For the first implementation, identifiers may remain UUID strings:

```ts
import { z } from "zod";

export const organizationIdSchema = z.string().uuid();
export const establishmentIdSchema = z.string().uuid();
export const userIdSchema = z.string().uuid();
export const reservationIdSchema = z.string().uuid();
export const orderIdSchema = z.string().uuid();
```

Do not expose internal sequential database IDs in public contracts.

### 7.2 Date and time

Use ISO 8601 strings at boundaries:

```ts
export const isoDateTimeSchema = z.string().datetime({ offset: true });
```

Rules:

- Store and exchange instants with timezone offset or UTC.
- Never pass JavaScript `Date` objects in API or event contracts.
- A local calendar date may use `YYYY-MM-DD` when it is semantically a date rather than an instant.
- Establishment timezone belongs in tenant/public configuration, not inferred from the client device.

### 7.3 Money

Use integer minor units, never floating-point euros:

```ts
export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string().length(3),
});
```

Example:

```json
{
  "amountMinor": 1490,
  "currency": "EUR"
}
```

### 7.4 API errors

Use a stable machine-readable code:

```ts
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    fieldErrors: z.record(z.array(z.string())).optional(),
    requestId: z.string().optional()
  })
});

export type ApiError = z.infer<typeof apiErrorSchema>;
```

The `message` is user-readable or log-readable; application logic must branch on `code`, not on message text.

Recommended initial codes:

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
TENANT_NOT_FOUND
ESTABLISHMENT_NOT_FOUND
RESOURCE_NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
```

### 7.5 Pagination

Prefer cursor pagination for feeds and large datasets:

```ts
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const pageInfoSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});
```

---

## 8. Reservation contracts

### 8.1 Create reservation input

The public client may specify an establishment reference, but the server must validate it against the tenant resolved from hostname or authenticated membership.

```ts
import { z } from "zod";
import {
  establishmentIdSchema,
  isoDateTimeSchema,
} from "../common";

export const createReservationInputSchema = z.object({
  establishmentId: establishmentIdSchema,
  startAt: isoDateTimeSchema,
  partySize: z.number().int().min(1).max(30),
  customer: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(6).max(30),
  }),
  note: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().uuid(),
});

export type CreateReservationInput = z.infer<
  typeof createReservationInputSchema
>;
```

The contract validates shape only. It does not decide whether the requested slot is available; that belongs in `@yuta/core`.

### 8.2 Reservation status

```ts
export const reservationStatusSchema = z.enum([
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show",
]);

export type ReservationStatus = z.infer<
  typeof reservationStatusSchema
>;
```

Do not duplicate these literal values in applications.

### 8.3 Reservation response

Public and admin responses may differ. Avoid exposing internal notes in a public response.

```ts
export const publicReservationResponseSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().min(1),
  establishmentId: establishmentIdSchema,
  startAt: isoDateTimeSchema,
  partySize: z.number().int().positive(),
  status: reservationStatusSchema,
});
```

If admin needs more fields, define a separate `adminReservationResponseSchema` rather than widening the public schema.

---

## 9. Order contracts

Initial order contracts should focus on fields shared by POS, API, and display.

```ts
export const orderStatusSchema = z.enum([
  "draft",
  "submitted",
  "in_preparation",
  "ready",
  "served",
  "paid",
  "cancelled",
]);

export const orderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  note: z.string().trim().max(300).optional(),
  modifierIds: z.array(z.string().uuid()).default([]),
});

export const createOrderInputSchema = z.object({
  establishmentId: establishmentIdSchema,
  serviceType: z.enum(["dine_in", "takeaway", "delivery"]),
  tableId: z.string().uuid().optional(),
  items: z.array(orderItemInputSchema).min(1),
  idempotencyKey: z.string().uuid(),
});
```

Rules such as table requirement for `dine_in`, current menu price, tax, discount eligibility, and total calculation belong in `@yuta/core` and server-side application code.

---

## 10. Event contracts

Events must be immutable, versioned where compatibility matters, and safe to serialize as JSON.

### 10.1 Standard event envelope

```ts
export const eventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventVersion: z.number().int().positive(),
  occurredAt: isoDateTimeSchema,
  organizationId: organizationIdSchema,
  establishmentId: establishmentIdSchema.nullable(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
});
```

### 10.2 Kitchen display event

```ts
export const kitchenOrderCreatedEventSchema = eventEnvelopeSchema.extend({
  type: z.literal("kitchen.order.created"),
  payload: z.object({
    orderId: z.string().uuid(),
    orderNumber: z.string().min(1),
    createdAt: isoDateTimeSchema,
    items: z.array(
      z.object({
        orderItemId: z.string().uuid(),
        displayName: z.string().min(1),
        quantity: z.number().int().positive(),
        notes: z.array(z.string()).default([]),
      }),
    ),
  }),
});
```

Event names must use a stable dot-separated convention:

```text
<consumer-or-domain>.<entity>.<past-tense-action>
```

Examples:

```text
kitchen.order.created
kitchen.order.updated
reservation.created
reservation.cancelled
sync.batch.received
```

Do not reuse one schema for commands and events. A command requests an action; an event reports a completed fact.

---

## 11. Validation policy

### Client-side

Applications may use the contract schemas for immediate form feedback.

### Server-side

Every external input must be validated again on the server. Client validation is never trusted.

Recommended pattern:

```ts
const parsed = createReservationInputSchema.safeParse(body);

if (!parsed.success) {
  return validationErrorFromZod(parsed.error);
}
```

Avoid `as CreateReservationInput` casts for untrusted data.

---

## 12. Versioning policy

### API DTOs

Within the monorepo, non-breaking additions are acceptable when all consumers are deployed together. For independently deployed consumers, preserve backwards compatibility.

Breaking changes include:

- Removing a field.
- Renaming a field.
- Changing a field type.
- Narrowing accepted enum values.
- Changing event meaning.

### Events and sync messages

Use `eventVersion` and explicit upgrade handling.

Example:

```ts
switch (event.eventVersion) {
  case 1:
    return handleV1(event);
  default:
    throw new UnsupportedEventVersionError(event.eventVersion);
}
```

Do not silently reinterpret old event payloads.

---

## 13. Security and privacy rules

- Do not expose database-only fields automatically.
- Do not expose password hashes, OAuth tokens, API keys, or provider secrets.
- Public contracts must contain only fields necessary for the public feature.
- Customer personal data must be minimized per endpoint.
- Events sent to display devices must not contain unnecessary customer contact information.
- Error responses must not reveal SQL, stack traces, filesystem paths, or secrets.
- Tenant IDs in payloads are context metadata, not authorization proof.

---

## 14. Testing requirements

Each schema needs tests covering:

1. Valid payload accepted.
2. Required fields rejected when missing.
3. Invalid UUID/date/email rejected.
4. Enum values rejected when unknown.
5. Upper bounds enforced.
6. Unknown fields policy explicitly tested.
7. Serialization round trip where applicable.

Recommended policy:

- Public API schemas should generally use `.strict()` unless forward-compatible passthrough is deliberately required.
- Event consumers should reject unsupported versions.

Example:

```ts
it("rejects a reservation with partySize 0", () => {
  const result = createReservationInputSchema.safeParse({
    // valid fields omitted for brevity
    partySize: 0,
  });

  expect(result.success).toBe(false);
});
```

---

## 15. Integration examples

### `apps/web`

```ts
import {
  createReservationInputSchema,
  type PublicReservationResponse,
} from "@yuta/contracts/reservations";
```

### `apps/yuta-pos`

```ts
import {
  createOrderInputSchema,
  type OrderStatus,
} from "@yuta/contracts/orders";
```

### `apps/yuta-display`

```ts
import {
  kitchenOrderCreatedEventSchema,
  type KitchenOrderCreatedEvent,
} from "@yuta/contracts/display";
```

### Server route

```ts
const input = createOrderInputSchema.parse(await request.json());
```

---

## 16. Migration strategy for the existing repository

Codex must not perform a large speculative rewrite.

Implement in this order:

1. Create `packages/contracts` with package metadata and TypeScript config.
2. Add common schemas: IDs, date-time, money, API errors.
3. Search existing apps for duplicated order status, reservation status, and DTO definitions.
4. Move one shared domain at a time into `@yuta/contracts`.
5. Update imports in all consumers.
6. Remove old duplicate definitions only after tests and builds pass.
7. Repeat for the next domain.

Initial migration priority:

```text
1. Orders shared by yuta-pos and yuta-display
2. Common API errors
3. Reservations shared by web and admin
4. Sync/event contracts
```

---

## 17. Acceptance criteria

The first implementation is complete when:

- `packages/contracts` builds independently.
- It imports no YUTA application or database package.
- Order statuses are no longer duplicated between POS and display.
- At least one order input and one kitchen event are runtime-validated.
- At least one reservation input is shared by web and admin/API boundary.
- All exported TypeScript types are inferred from Zod schemas.
- Tests cover valid and invalid payloads.
- All current applications still build.
- No LUNA-specific brand or establishment data exists in the package.

---

## 18. Codex implementation brief

Codex should:

1. Inspect current DTOs, enums, and Zod schemas before creating replacements.
2. Preserve current behavior and field names unless a documented conflict exists.
3. Add the package to `pnpm-workspace.yaml` only if `packages/*` is not already included.
4. Reuse the repository's existing TypeScript, lint, test, and formatting conventions.
5. Avoid `any`, unsafe casts, and duplicate interfaces.
6. Add unit tests.
7. Run package tests, type-check, lint, and workspace builds.
8. Report all migrated definitions and any remaining duplicates.

Codex must stop and request clarification when existing apps use incompatible semantics for the same field—for example, when two different meanings are both called `status`.
