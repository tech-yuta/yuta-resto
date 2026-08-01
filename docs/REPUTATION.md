# Avis & commentaires

This document tracks the Phase 1 reputation module implemented across
`apps/backoffice`, `apps/web`, `packages/contracts`, and the cloud database
boundary.

The persistence package is `packages/db-cloud`; back-office and public web server
code use it through `CLOUD_DATABASE_URL`. Reputation data is cloud-only and always
scoped by `organization_id` and, where applicable, `establishment_id`.

The implementation sequence and current task status are maintained in
`docs/REPUTATION_PHASE1_BACKLOG.md`. Update that tracker whenever Phase 1 work
is completed, added, deferred, or reordered.

## Product surfaces

- Back-office inbox: `/customers/reviews` in `apps/backoffice`.
- Review detail route: `/customers/reviews/[reviewId]`.
- Public feedback form: `/{tenantSlug}/feedback` in `apps/web`.
- Public submission endpoint:
  `POST /api/public/feedback/{tenantSlug}`.

All customer-facing UI is French. Code, schemas, contracts, logs, and technical
documentation are English.

## Implemented foundation

Migration `0007_overjoyed_spencer_smythe.sql` adds the Phase 1 persistence
model:

- Unified Google and direct-feedback inbox records.
- AI analyses and version metadata.
- Reply drafts and publication states.
- Direct feedback, contact consent, and collection source tags.
- Operational incidents and internal notes.
- Google connector state with encrypted-token storage fields.
- Location-specific reputation settings.
- Reputation audit events.

Every operational record is scoped by `organizationId`; location-owned records
also contain `establishmentId`. Repository reads require a trusted tenant
context. Public submissions resolve their tenant from the request hostname and
verify that the route slug matches the location reputation settings.

For local development only, `localhost/{tenantSlug}/feedback` may resolve the
seeded tenant by its public feedback slug. This fallback is disabled in
production. Production must use a verified hostname in `tenant_domains`.

## Public feedback behavior

- Rating is required and must be between 1 and 5.
- Topics and the comment are optional.
- Contact information is optional.
- Consent is mandatory when an email address or phone number is supplied.
- Contact consent and its timestamp are stored.
- The raw client IP address is not stored. A salted SHA-256 hash is used for
  database-backed rate limiting.
- A hidden honeypot field provides basic bot protection.
- A client may submit at most five feedback records per 15-minute window.
- External review links are displayed after submission independently of the
  submitted score.
- Customer email and phone are not sent to an AI provider.

Set `PUBLIC_FEEDBACK_IP_HASH_SALT` to a long random value in every production
web environment. Production submissions fail closed if it is missing.

## Development data

The idempotent database seed creates:

- Reputation settings for LUNA with public slug `luna`.
- Three Google reviews with 5-, 3-, and 1-star ratings.
- One positive direct feedback record.
- One negative direct feedback record with contact consent.
- Stored analyses, one published reply, one failed reply, and one open incident.

After migrating and seeding, use:

```text
http://localhost:3000/luna/feedback
http://localhost:3001/customers/reviews
```

The hostname-scoped public URL is also available through
`http://luna.localhost:3000/luna/feedback` when the local environment resolves
`luna.localhost`.

## Authentication boundary

The back-office inbox now requires a database-backed server session. The authenticated
layout resolves the session user, validates the active membership, creates a
trusted tenant context, checks `reputation.enabled`, and enforces
`reputation.read` before the repository is called.

The back-office shell can switch to another active establishment membership. The
server validates the target and rotates the session before reloading the inbox,
so review queries always use the newly authenticated organization and
establishment scope.

The inbox filters, sorts, and paginates through server-backed URL parameters.
Managers can persist status and assignment changes, save or edit a manual
Google reply draft, and add internal notes. These mutations validate input with
shared contracts, repeat authorization checks on the server, and create
reputation audit events. Employees can read and act only on feedback assigned
to their own user account.

No production development-tenant fallback remains in the back-office application.
Organization, establishment, role, entitlement, and permission values are never
accepted from the browser. See `docs/AUTHENTICATION.md`.

## Google Business Profile connector

Owners and administrators configure Google Business Profile from
`/settings/integrations`. The OAuth start and callback routes bind a signed,
short-lived state value to the current user, organization, and establishment.
The callback rejects mismatched or expired state before storing credentials.

Access and refresh tokens are encrypted with AES-256-GCM before database
storage. Tokens are never returned to the browser or included in application
logs. Access tokens are refreshed server-side when they approach expiration.
The account and location selected in the UI are fetched from Google again before
the connector is marked `CONNECTED`.

Back-office environments require:

```env
GOOGLE_BUSINESS_PROFILE_CLIENT_ID=...
GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET=...
GOOGLE_BUSINESS_PROFILE_REDIRECT_URI=https://app.yutapro.fr/api/reputation/google/oauth/callback
REPUTATION_CREDENTIAL_ENCRYPTION_KEY=...
```

Generate `REPUTATION_CREDENTIAL_ENCRYPTION_KEY` as 32 random bytes encoded with
base64. Never reuse `AUTH_SECRET` as the credential-encryption key. Register the
redirect URI exactly in Google Cloud, request Business Profile API access, and
enable the Account Management and Business Information APIs. The connector uses
the non-deprecated `https://www.googleapis.com/auth/business.manage` scope.

Current connector boundary: OAuth, credential storage, account discovery,
location discovery, selection, token refresh, and recovery UI are implemented.
Review import, synchronization scheduling, and Google reply reconciliation are
the next connector tasks.

## Remaining Phase 1 work

- Google review synchronization and reply publication.
- AI analysis and reply services with versioned prompts and strict structured
  output validation.
- Incidents, notifications, audit timeline, analytics, jobs, and connector
  monitoring. Each mutation must use the implemented server-side permission
  boundary.
- QR PNG/SVG downloads.
- Integration and end-to-end tests for external connectors.
