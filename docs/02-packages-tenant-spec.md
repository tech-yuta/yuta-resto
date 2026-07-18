# YUTA Package Specification — `@yuta/tenant`

**Status:** Implementation-ready specification  
**Repository:** `YUTA-RESTO` pnpm workspace  
**Target package path:** `packages/tenant`  
**Consumers:** all server-side YUTA applications; selected browser-safe types/helpers may be shared with clients

---

## 1. Purpose

`@yuta/tenant` provides a consistent multi-tenant context and isolation boundary for YUTA.

It answers:

> Which organization and establishment does this request belong to, and is the caller allowed to act in that context?

YUTA hierarchy:

```text
Organization
└── one or more Establishments
```

Example:

```text
FAST VIET
└── LUNA Chasseneuil-du-Poitou

ABC RESTAURATION
├── ABC Poitiers
└── ABC Tours
```

The package must make it difficult to accidentally query or mutate data belonging to another restaurant.

---

## 2. Core responsibilities

`@yuta/tenant` is responsible for:

- Defining `TenantContext`.
- Normalizing and validating hostnames.
- Resolving a public tenant from a hostname through an injected lookup adapter.
- Resolving an authenticated tenant from session/membership data through injected adapters.
- Enforcing organization and establishment scope.
- Providing assertion and guard helpers.
- Producing stable tenant-related errors.
- Supporting organization-wide and establishment-specific access.
- Carrying locale, timezone, and enabled entitlements when supplied by trusted server data.

---

## 3. Non-responsibilities

The package must **not** contain:

- Direct Drizzle or PostgreSQL access.
- Next.js middleware implementation.
- OAuth/session provider implementation.
- Full role and permission policy for every YUTA module.
- Business logic for orders, reservations, payments, stock, or staff.
- React context as the primary security mechanism.
- LUNA-specific IDs, domains, or names.
- Secrets, environment variables, or deployment configuration.

Important distinction:

```text
Tenant context identifies and scopes the restaurant.
Authentication identifies the user.
Authorization decides allowed actions.
Business logic decides domain validity.
```

The package may expose small access guards based on trusted memberships, but it must not become the entire authorization system.

---

## 4. Architecture principle: pure core plus adapters

`@yuta/tenant` must not import `@yuta/db` or `next`.

Instead, it defines ports/interfaces and receives implementations from applications.

```text
apps/web or apps/admin
        │
        ├── hostname/session input
        ├── DB-backed lookup adapter from @yuta/db
        │
        ▼
@Yuta/tenant pure resolver
        │
        ▼
TenantContext
```

This allows:

- Unit testing without a database.
- Use in Next.js, workers, API servers, and local agent.
- Future database replacement without rewriting tenant rules.
- Clear separation between trusted server data and browser input.

---

## 5. Dependency rules

Allowed dependencies:

- `zod` for validation.
- Browser-safe utility packages if truly necessary.

Forbidden dependencies:

- `@yuta/db`.
- `next`.
- `react`.
- `@yuta/ui`.
- Node-specific database/session libraries.

Recommended graph:

```text
apps/* ───────────────→ @yuta/tenant
apps/* ───────────────→ @yuta/db
@Yuta/tenant ─────────→ zod only
@Yuta/db ─────────────→ no dependency on @yuta/tenant required
```

Application adapters may combine both packages:

```ts
const context = await resolvePublicTenant({
  hostname,
  domainLookup: dbDomainLookup,
});
```

---

## 6. Recommended file structure

```text
packages/tenant/
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts
│   ├── schemas.ts
│   ├── errors.ts
│   ├── hostname.ts
│   ├── public-resolver.ts
│   ├── authenticated-resolver.ts
│   ├── guards.ts
│   ├── ports.ts
│   ├── entitlements.ts
│   └── index.ts
│
└── test/
    ├── hostname.test.ts
    ├── public-resolver.test.ts
    ├── authenticated-resolver.test.ts
    └── guards.test.ts
```

Keep framework-specific adapters outside this package, for example:

```text
apps/web/src/server/tenant/resolve-public-tenant.ts
apps/admin/src/server/tenant/resolve-authenticated-tenant.ts
packages/db/src/adapters/tenant-domain-lookup.ts
packages/db/src/adapters/tenant-membership-lookup.ts
```

---

## 7. Tenant model

### 7.1 Base types

```ts
export type TenantRole =
  | "owner"
  | "admin"
  | "manager"
  | "cashier"
  | "kitchen"
  | "waiter"
  | "accountant"
  | "employee";

export type TenantContext = {
  organizationId: string;
  establishmentId: string | null;
  actor: TenantActor;
  locale: string;
  timezone: string;
  entitlements: ReadonlySet<string>;
};

export type TenantActor =
  | {
      type: "public";
    }
  | {
      type: "user";
      userId: string;
      role: TenantRole;
      membershipId: string;
    }
  | {
      type: "service";
      serviceName: string;
    };
```

`establishmentId` may be `null` only for valid organization-wide operations.

Examples:

- Chain owner viewing consolidated analytics: `establishmentId = null`.
- Cashier opening POS: establishment is mandatory.
- Public reservation page: establishment is mandatory.

### 7.2 Public tenant context

For public routes, expose only the required context:

```ts
export type PublicTenantContext = {
  organizationId: string;
  establishmentId: string;
  hostname: string;
  locale: string;
  timezone: string;
  entitlements: ReadonlySet<string>;
};
```

Do not include private organization settings, tokens, billing data, or internal notes.

---

## 8. Lookup ports

The package defines trusted lookup contracts without implementing storage.

### 8.1 Domain lookup

```ts
export type DomainTenantRecord = {
  organizationId: string;
  establishmentId: string;
  hostname: string;
  status: "active" | "pending" | "disabled";
  locale: string;
  timezone: string;
  entitlements: readonly string[];
};

export interface DomainLookupPort {
  findActiveByHostname(
    hostname: string,
  ): Promise<DomainTenantRecord | null>;
}
```

### 8.2 Membership lookup

```ts
export type MembershipRecord = {
  membershipId: string;
  userId: string;
  organizationId: string;
  establishmentId: string | null;
  role: TenantRole;
  status: "active" | "invited" | "suspended";
};

export interface MembershipLookupPort {
  findActiveMembership(input: {
    userId: string;
    organizationId: string;
    establishmentId: string | null;
  }): Promise<MembershipRecord | null>;
}
```

### 8.3 Establishment lookup

Useful when a user changes establishment after authentication:

```ts
export interface EstablishmentLookupPort {
  belongsToOrganization(input: {
    organizationId: string;
    establishmentId: string;
  }): Promise<boolean>;
}
```

Applications implement these ports with `@yuta/db` repositories.

---

## 9. Hostname normalization

Public tenant resolution begins with a hostname controlled by infrastructure headers. The package must normalize it consistently.

Required behavior:

- Convert to lowercase.
- Remove a trailing dot.
- Remove a port.
- Reject an empty hostname.
- Reject schemes and paths.
- Support development hostnames deliberately.
- Never trust arbitrary forwarding headers unless the deployment proxy is configured as trusted.

Example API:

```ts
export function normalizeHostname(rawHostname: string): string;
```

Examples:

```text
LUNA.YUTA.FR              → luna.yuta.fr
luna.yuta.fr:3000         → luna.yuta.fr
luna.yuta.fr.             → luna.yuta.fr
https://luna.yuta.fr/x    → reject
""                        → reject
```

Development mapping must be explicit. Recommended options:

```text
luna.localhost
luna.yuta.local
```

Avoid hidden fallback such as “unknown hostname means LUNA”. Unknown hostnames must fail closed.

---

## 10. Public tenant resolution

Recommended API:

```ts
export async function resolvePublicTenant(input: {
  hostname: string;
  domainLookup: DomainLookupPort;
}): Promise<PublicTenantContext>;
```

Algorithm:

```text
1. Normalize hostname.
2. Query active domain mapping through DomainLookupPort.
3. If no active mapping exists, throw TenantNotFoundError.
4. Require establishmentId.
5. Convert entitlements to an immutable set.
6. Return PublicTenantContext.
```

Security requirements:

- No fallback to a default tenant in production.
- Disabled or pending domains must not resolve.
- A tenant ID passed in URL/body does not override hostname resolution.
- If route parameters include an establishment slug or ID, it must match the resolved hostname tenant.

Example:

```ts
const tenant = await resolvePublicTenant({
  hostname: request.headers.get("host") ?? "",
  domainLookup,
});
```

Framework-specific extraction of trusted host headers remains in the application.

---

## 11. Authenticated tenant resolution

Recommended API:

```ts
export async function resolveAuthenticatedTenant(input: {
  userId: string;
  organizationId: string;
  establishmentId: string | null;
  membershipLookup: MembershipLookupPort;
  tenantMetadata: {
    locale: string;
    timezone: string;
    entitlements: readonly string[];
  };
}): Promise<TenantContext>;
```

Algorithm:

```text
1. Require an authenticated user ID from the trusted session.
2. Query an active matching membership.
3. Reject invited, suspended, missing, or cross-organization membership.
4. Return TenantContext using membership data, not untrusted client role data.
```

The frontend may request a selected establishment, but the backend must verify membership.

Forbidden pattern:

```ts
const tenant = {
  organizationId: request.body.organizationId,
  establishmentId: request.body.establishmentId,
  role: request.body.role,
};
```

Correct pattern:

```ts
const tenant = await resolveAuthenticatedTenant({
  userId: session.user.id,
  organizationId: selectedOrganizationId,
  establishmentId: selectedEstablishmentId,
  membershipLookup,
  tenantMetadata,
});
```

---

## 12. Guard and assertion helpers

### 12.1 Require an establishment

```ts
export function requireEstablishment(
  context: TenantContext,
): asserts context is TenantContext & { establishmentId: string };
```

Use for POS, kitchen, reservation, stock, and other location-specific operations.

### 12.2 Assert organization scope

```ts
export function assertOrganizationScope(input: {
  context: TenantContext;
  resourceOrganizationId: string;
}): void;
```

### 12.3 Assert establishment scope

```ts
export function assertEstablishmentScope(input: {
  context: TenantContext;
  resourceOrganizationId: string;
  resourceEstablishmentId: string;
}): void;
```

Rules:

- Organization IDs must match.
- If context has a concrete establishment, resource establishment must match.
- Organization-wide context may access an establishment only if the calling use case authorizes organization-wide access separately.

Do not interpret `establishmentId = null` as automatic access to every establishment. It means “organization-level context”; the use case must still authorize the requested action.

### 12.4 Entitlement guard

```ts
export function requireEntitlement(
  context: Pick<TenantContext, "entitlements">,
  entitlement: string,
): void;
```

Suggested names:

```text
reservations.enabled
click_collect.enabled
inventory.enabled
ai_reviews.enabled
visual_creation.enabled
```

Entitlements control purchased/enabled features, not user permissions.

---

## 13. Error model

Define stable error classes/codes:

```text
INVALID_HOSTNAME
TENANT_NOT_FOUND
TENANT_DISABLED
ESTABLISHMENT_REQUIRED
MEMBERSHIP_NOT_FOUND
MEMBERSHIP_INACTIVE
CROSS_TENANT_ACCESS_DENIED
FEATURE_NOT_ENABLED
```

Recommended base shape:

```ts
export class TenantError extends Error {
  readonly code: TenantErrorCode;
  readonly statusCode: number;
}
```

Applications map these errors to `@yuta/contracts` API error responses.

Do not return raw database errors from the package.

---

## 14. Database integration expectations

The database should provide at least these concepts:

```text
organizations
establishments
domains
memberships
subscriptions or entitlements
```

Suggested domain fields:

```text
domains
-------
id
organization_id
establishment_id
hostname
status
is_primary
verified_at
```

Suggested membership fields:

```text
memberships
-----------
id
user_id
organization_id
establishment_id nullable
role
status
```

The package does not define these Drizzle schemas. `@yuta/db` owns persistence models and implements the lookup ports.

---

## 15. Query-scoping policy

`TenantContext` must be passed explicitly into server-side use cases and repositories.

Recommended:

```ts
await orderRepository.findById({
  tenant,
  orderId,
});
```

Repository query:

```text
WHERE organization_id = tenant.organizationId
AND establishment_id = tenant.establishmentId
AND id = orderId
```

Avoid:

```ts
await orderRepository.findById(orderId);
```

for tenant-owned data, because it makes accidental cross-tenant access easier.

A repository may expose organization-wide queries only through explicitly named methods:

```ts
listAcrossOrganization(...)
```

not through ambiguous generic methods.

---

## 16. Public app integration

`apps/web` should resolve tenant once near the request boundary.

Example flow:

```text
HTTP request
→ trusted hostname extraction
→ resolvePublicTenant()
→ load public settings/menu/reservation configuration using context
→ render response
```

Never use a hard-coded default LUNA tenant in production.

For local development, use seed data and explicit hostname mapping:

```text
luna.localhost → FAST VIET / LUNA
```

---

## 17. Admin/POS integration

Authenticated applications should resolve context from:

- Trusted authenticated user session.
- User-selected organization/establishment.
- Verified membership lookup.

Example flow:

```text
Authenticated request
→ read session userId
→ read selected organization/establishment
→ resolveAuthenticatedTenant()
→ pass TenantContext to use case
→ repository scopes every query
```

The selected context may be persisted in a cookie/session, but it must be revalidated server-side.

---

## 18. Worker and local-agent integration

Background jobs and sync messages must carry organization and establishment IDs, but the worker must validate them against the trusted job source and stored records.

Recommended service actor:

```ts
const tenant: TenantContext = {
  organizationId,
  establishmentId,
  actor: {
    type: "service",
    serviceName: "reservation-confirmation-worker",
  },
  locale,
  timezone,
  entitlements,
};
```

A job payload is not automatically trusted merely because it contains tenant IDs. Queue publishing and consumption must be authenticated and validated.

---

## 19. Security invariants

These rules are mandatory:

1. Unknown hostnames fail closed.
2. Client-supplied tenant IDs are never authorization proof.
3. Roles come from active server-side membership records.
4. Every tenant-owned database query includes organization scope.
5. Establishment-specific operations include establishment scope.
6. Public contexts cannot access private data.
7. Cross-tenant resource access returns not found or forbidden according to API policy, never resource data.
8. Tenant context is immutable after resolution.
9. Logs include tenant IDs but must not include secrets or unnecessary personal data.
10. Tests must attempt cross-tenant access explicitly.

PostgreSQL Row-Level Security may be added later as defense in depth, but it does not replace application scoping.

---

## 20. Testing requirements

### Hostname tests

- Lowercase normalization.
- Port removal.
- Trailing-dot removal.
- Empty hostname rejection.
- Scheme/path rejection.
- Unknown hostname rejection.
- Disabled domain rejection.

### Public resolver tests

- Resolves active domain.
- Returns correct organization and establishment.
- Does not fall back to LUNA.
- Converts entitlements correctly.

### Authenticated resolver tests

- Accepts active matching membership.
- Rejects missing membership.
- Rejects suspended membership.
- Rejects cross-organization selection.
- Rejects establishment not covered by membership.

### Guard tests

- Allows matching organization and establishment.
- Rejects different organization.
- Rejects different establishment.
- Requires establishment for local operations.
- Rejects unavailable entitlement.

Use fake in-memory lookup ports in unit tests. Database integration tests belong in `@yuta/db` or application test suites.

---

## 21. Observability requirements

Applications should attach these fields to request/job logs after tenant resolution:

```text
organizationId
establishmentId
actorType
userId or serviceName when applicable
requestId/correlationId
```

Do not log complete membership records, OAuth tokens, or customer details merely for tenant tracing.

Tenant-related failures should be measurable:

```text
tenant_resolution_failed
tenant_cross_access_denied
tenant_feature_not_enabled
```

---

## 22. Migration strategy for the current repository

Codex must implement incrementally.

### Phase 1 — package foundation

1. Create `packages/tenant`.
2. Add types, errors, hostname normalization, guards, and ports.
3. Add tests.
4. Do not change database schema yet unless required.

### Phase 2 — public web

1. Identify hard-coded LUNA context in `apps/web`.
2. Add DB adapter for domain lookup.
3. Resolve public tenant from hostname.
4. Keep a development-only explicit hostname mapping.
5. Remove production fallback to LUNA.

### Phase 3 — admin and POS

1. Identify current user/restaurant selection mechanism.
2. Add membership lookup adapter.
3. Resolve authenticated context on server boundaries.
4. Pass context into use cases and repositories.
5. Add cross-tenant tests.

### Phase 4 — broader enforcement

1. Require tenant scope in tenant-owned repositories.
2. Add feature entitlements.
3. Add audit and observability fields.
4. Consider PostgreSQL RLS as defense in depth.

---

## 23. Acceptance criteria

The first implementation is complete when:

- `packages/tenant` builds without importing Next.js, React, or database code.
- Hostname normalization and public resolution are unit-tested.
- Authenticated membership resolution is unit-tested.
- `apps/web` can resolve LUNA through a domain record rather than hard-coded constants.
- Unknown production hostnames fail closed.
- At least one admin/POS server-side flow obtains tenant context from an active membership.
- At least one repository query is scoped by organization and establishment context.
- Cross-tenant access tests fail safely.
- No LUNA-specific ID, domain, or brand data exists inside the package.

---

## 24. Codex implementation brief

Codex should:

1. Inspect existing organization, establishment, user, domain, and membership models before coding.
2. Reuse current ID types and naming where they are already consistent.
3. Implement the package as framework-neutral pure TypeScript.
4. Define lookup ports; implement DB adapters outside the package.
5. Add exhaustive tests for failure cases.
6. Preserve existing app behavior while replacing hard-coded tenant assumptions incrementally.
7. Do not introduce a default production tenant.
8. Do not trust tenant IDs, roles, or entitlements received from the browser.
9. Run tests, type-check, lint, and workspace builds.
10. Produce a migration report listing remaining unscoped repositories and hard-coded LUNA references.

Codex must request clarification before changing the meaning of the existing `restaurant`, `store`, `site`, `organization`, or `establishment` concepts if the repository currently uses them inconsistently.
