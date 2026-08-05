# YUTA Current Database Model — Canonical AI Context

**Purpose:** Give this entire document to ChatGPT or another coding agent before
asking it to design or modify YUTA database code.

**Status:** Canonical description of the implemented database model as of
2026-08-01. The Drizzle schemas remain the executable source of truth.

## 1. Critical correction: there is no `tenants` table

YUTA does **not** persist a table named `tenants` and does **not** use a generic
`tenant_id` column.

The persisted cloud hierarchy is:

```text
organization
└── establishment
```

In application code, the word **tenant** means a resolved authorization and
data-isolation context. It is not the name of a database entity.

```ts
type TenantContext = {
  organizationId: string;
  establishmentId: string | null;
  actor: TenantActor;
  locale: string;
  timezone: string;
  entitlements: ReadonlySet<string>;
};
```

For restaurant-specific back-office operations, `establishmentId` is required.
An organization can own one or more establishments. An establishment represents
a restaurant/site/branch.

### Never make these assumptions

- Do not create or query a `tenants` table.
- Do not add `tenantId`/`tenant_id` to cloud or POS tables.
- Do not add `tenantId` directly to `users`.
- Do not treat an organization and an establishment as interchangeable.
- Do not grant access from a browser-supplied organization or establishment ID.
- Do not let `YUTA_ADMIN` or `YUTA_SUPPORT` silently bypass restaurant
  membership checks.
- Do not add cloud tenant columns to the local POS database.
- Do not synchronize POS operational data into the cloud database.

## 2. Physical database boundaries

YUTA has three independent database ownership boundaries.

| Boundary   | Runtime owner                             | Connection variable    | Purpose                                                                                                     |
| ---------- | ----------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cloud SaaS | `packages/db-cloud`                       | `CLOUD_DATABASE_URL`   | Users, authentication, organizations, establishments, memberships, public domains, entitlements, reputation |
| Local POS  | `apps/site-agent` using `packages/db-pos` | `POS_DATABASE_URL`     | Local staff/PIN auth, catalog, orders, payments, checks, discounts, printing                                |
| Display    | `apps/yuta-display/src/db`                | `DISPLAY_DATABASE_URL` | Standalone signage media                                                                                    |

These databases use separate credentials, migrations, schemas, and failure
domains. Browser code receives no database connection string.

## 3. Cloud ownership and scoping rules

Cloud records use one of these scopes:

1. **Global identity:** no organization scope, for example `users`.
2. **Organization-owned:** contains non-null `organization_id`.
3. **Restaurant/branch-owned:** contains non-null `organization_id` and
   non-null `establishment_id`.

Every tenant-owned repository method must receive the required scope
explicitly. Reads, updates, and deletes must include scope predicates even when
the resource ID is globally unique.

```ts
where(
  and(
    eq(feedbackItems.id, feedbackId),
    eq(feedbackItems.organizationId, context.organizationId),
    eq(feedbackItems.establishmentId, context.establishmentId),
  ),
);
```

An unscoped query such as `where(eq(feedbackItems.id, feedbackId))` is invalid.

## 4. Cloud identity and authorization model

```text
users 1 ─── N tenant_memberships N ─── 1 organizations
                                  └──── 0..1 establishments
```

A user is one human identity and can have memberships in multiple restaurants,
including restaurants owned by different organizations.

### Tenant roles

Stored in `tenant_memberships.role`:

```text
OWNER
MANAGER
STAFF
```

- `OWNER`: manages tenant settings and memberships.
- `MANAGER`: may manage staff only.
- `STAFF`: operational access only.
- The last active owner of an establishment cannot be downgraded or suspended.

### System roles

Stored separately in nullable `users.system_role`:

```text
YUTA_ADMIN
YUTA_SUPPORT
```

System roles are for future YUTA platform administration. They do not create a
membership and do not automatically grant access to any restaurant.

### Active tenant resolution

Server-side resolution order:

1. trusted route establishment ID or globally unique establishment slug;
2. active establishment from the validated server session/HttpOnly cookie;
3. the user's only active membership;
4. require tenant selection when zero or multiple active memberships remain.

The selected organization is derived from the validated membership. It is not
accepted directly from the browser.

For first-party password login, zero/one/many active establishment memberships
are resolved before a scoped session is created. Multiple memberships produce a
single-use 10-minute `auth_selection_tickets` token. The browser submits only a
`membershipId`; the server derives organization and establishment IDs, consumes
the ticket, and creates `auth_sessions` with both scope columns non-null.

## 5. Implemented cloud schema

Executable schema location: `packages/db-cloud/src/schema`.

### `users`

Global human identity. It has no organization, establishment, or tenant ID.

```text
id uuid PK                         application-generated UUIDv7
auth_provider_id varchar(191)     NOT NULL, unique
display_name varchar(160)         nullable
email varchar(320)                NOT NULL, unique on lower(email)
status user_status                ACTIVE | DISABLED
system_role system_role           nullable; YUTA_ADMIN | YUTA_SUPPORT
password_hash text                nullable; current first-party password adapter
email_verified_at timestamptz     nullable
last_login_at timestamptz         nullable
auth_version integer              NOT NULL, default 0
created_at timestamptz            NOT NULL
updated_at timestamptz            NOT NULL
```

Disabled users do not receive a valid application session. Provider payloads
are mapped to this internal record through the auth adapter; they do not flow
through the domain layer.

### `organizations`

Top-level cloud account/group.

```text
id uuid PK
name varchar(255)
slug varchar(100)                 globally unique on lower(slug)
status organization_status       active | disabled
locale varchar(35)                default fr-FR
timezone varchar(100)             default Europe/Paris
currency varchar(3)               default EUR
created_at, updated_at timestamptz
```

### `establishments`

Restaurant/site/branch belonging to an organization.

```text
id uuid PK
organization_id uuid FK -> organizations.id, NOT NULL
name varchar(255)
slug varchar(100)                 globally unique on lower(slug)
status organization_status       active | disabled
locale varchar(35)                default fr-FR
timezone varchar(100)             default Europe/Paris
created_at, updated_at timestamptz
```

### `tenant_memberships`

Relationship granting a user access to an organization/establishment scope.
The word `tenant` in this table name is historical/domain terminology; it does
not imply a `tenants` table.

```text
id uuid PK
user_id uuid FK -> users.id ON DELETE RESTRICT
organization_id uuid FK -> organizations.id, NOT NULL
establishment_id uuid FK -> establishments.id, nullable
role cloud_role                  OWNER | MANAGER | STAFF
status membership_status        active | suspended
joined_at timestamptz
created_at, updated_at timestamptz
```

Unique key:

```text
(user_id, organization_id, establishment_id)
```

This unique index strictly prevents duplicate establishment-level memberships.
Because PostgreSQL treats `NULL` values as distinct by default, duplicate
organization-level rows with a null establishment would require an additional
constraint before that extension point is activated.

Current back-office authentication requires an active establishment-level
membership. The nullable establishment field preserves an organization-level
authorization extension point but is not a substitute for restaurant scope.

### `tenant_domains`

Maps a public hostname to an organization and establishment.

```text
id uuid PK
organization_id uuid FK -> organizations.id
establishment_id uuid FK -> establishments.id
hostname varchar(253)             globally unique
status domain_status              pending | active | disabled
is_primary boolean
verified_at timestamptz nullable
created_at, updated_at timestamptz
```

### `tenant_entitlements`

Feature flags for one establishment.

```text
organization_id uuid FK -> organizations.id
establishment_id uuid FK -> establishments.id
key varchar(150)
enabled boolean
created_at, updated_at timestamptz
PK (organization_id, establishment_id, key)
```

### Cloud authentication tables

- `auth_sessions`: hashed opaque session token, user, organization,
  establishment, auth version, expiry/revocation and privacy-safe request
  metadata.
- `auth_selection_tickets`: hashed, single-use, 10-minute pre-scope token tied
  to a user and authentication version; it contains no organization or
  establishment scope.
- `password_reset_tokens`: hashed, expiring, single-use reset tokens.
- `auth_login_attempts`: hashed rate-limit key and attempt timestamp.
- `auth_audit_events`: actor, subject, optional organization/establishment scope,
  event name and JSON metadata.

`auth_sessions` always stores the active `organization_id` and
`establishment_id`. The session scope is revalidated against an active user,
organization, establishment, and membership on protected server operations.

### Cloud reputation tables

| Table                      | Scope                          | Purpose                                                            |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `feedback_items`           | organization + establishment   | Canonical Google/direct feedback inbox item                        |
| `feedback_replies`         | organization + parent feedback | Drafted/published replies                                          |
| `direct_customer_feedback` | organization + establishment   | Private customer details and consent for direct feedback           |
| `feedback_internal_notes`  | organization + parent feedback | Internal staff notes                                               |
| `reputation_connectors`    | organization + establishment   | Google location connection and encrypted credentials               |
| `reputation_settings`      | organization + establishment   | Brand voice, public feedback slug, notification and reply settings |
| `reputation_audit_events`  | organization + entity          | Reputation mutation audit trail                                    |

Relevant implemented enum values:

```text
feedback_source: GOOGLE | DIRECT
feedback_type: PUBLIC_REVIEW | DIRECT_FEEDBACK
feedback_sentiment: POSITIVE | NEUTRAL | NEGATIVE
feedback_urgency: LOW | MEDIUM | HIGH | CRITICAL
feedback_status: NEW | TO_PROCESS | DRAFTED | REPLIED | FOLLOW_UP |
                 RESOLVED | ARCHIVED | SPAM
feedback_reply_status: DRAFT | READY | PUBLISHED | FAILED | DELETED
reputation_connector_status: DISCONNECTED | CONNECTING | CONNECTED |
                             ERROR | AUTH_EXPIRED
```

## 6. Local POS schema

Executable schema location: `packages/db-pos/src/schema`.

The POS installation represents one local restaurant/site. POS business tables
do not use `organization_id`, `establishment_id`, `tenant_id`, the cloud
`users` table, or `tenant_memberships`.

Implemented POS tables:

```text
local_users
local_auth_sessions
local_auth_login_attempts
menu_categories
menu_items
combo_rules
combo_rule_groups
combo_rule_group_items
orders
order_items
order_discounts
order_discount_items
checks
check_items
check_discounts
check_discount_items
payments
print_jobs
```

Important POS role/status values:

```text
local_user_role: admin | manager | staff | kitchen
order_status: draft | sent | preparing | ready | served | paid | cancelled
order_item_status: pending | sent | preparing | ready | served | cancelled
payment_method: cash | card | ticket_resto | other
payment_status: pending | paid | failed | refunded
print_job_status: pending | printing | printed | failed
```

Cloud role names and local POS role names are intentionally separate concepts.

## 7. Display schema

Executable schema location: `apps/yuta-display/src/db/schema`.

The display product is standalone and currently owns one table:

```text
display_media
- id
- title
- type
- file_url
- file_name
- mime_type
- size
- duration
- sort_order
- is_active
- created_at
- updated_at
```

Do not create `packages/db-display` unless a second legitimate server-side
consumer needs this schema.

## 8. Current development seed

The cloud foundation seed creates/reuses:

```text
organization:  LUNA / slug luna / active
establishment: LUNA / slug luna / active
establishment: LuNa Poitiers / slug luna-poitiers / active
membership:    owner@luna-restaurant.fr / OWNER / active
membership:    owner@luna-restaurant.fr / OWNER at LuNa Poitiers / active
membership:    manager@luna-restaurant.fr / MANAGER / active
system user:   admin@yutapro.fr / YUTA_ADMIN / no tenant membership
domains:       luna.localhost, luna-poitiers.localhost
```

The three development identities use the seed password configured by:

```text
YUTA_CLOUD_SEED_PASSWORD
```

`YUTA_CLOUD_SEED_ADMIN_PASSWORD` is accepted only as a temporary compatibility
fallback. `admin@yuta.local` is a retired cloud seed identity and is disabled
and stripped of restaurant memberships when the seed runs.

## 9. Source-of-truth precedence for future AI work

When documents or prompts disagree, use this order:

1. Current Drizzle schemas in `packages/db-cloud`, `packages/db-pos`, and
   `apps/yuta-display/src/db`.
2. `docs/YUTA_DATABASE_ARCHITECTURE_RESET_SPEC.md`.
3. `docs/YUTA_CURRENT_DATABASE_CONTEXT_FOR_AI.md` (this document).
4. Feature documentation.
5. Older implementation proposals or chat history.

Any older specification proposing a persisted `tenants` table or generic
`tenant_id` columns is obsolete for this repository and must not be followed.

## 10. Short instruction to prepend in another ChatGPT conversation

```text
Use the attached YUTA Current Database Model as canonical context. YUTA has no
persisted tenants table and no tenant_id column. In cloud code, tenant means a
validated runtime context built from organization_id + establishment_id + user
membership. Keep cloud, local POS, and display databases isolated. Do not
invent compatibility tables or change these boundaries unless I explicitly ask
for an architecture revision.
```
