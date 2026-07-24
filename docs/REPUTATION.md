# Avis & commentaires

This document tracks the Phase 1 reputation module implemented across
`apps/admin`, `apps/web`, `packages/contracts`, and `packages/db`.

## Product surfaces

- Admin inbox: `/customers/reviews` in `apps/admin`.
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

The admin inbox now requires a database-backed server session. The authenticated
layout resolves the session user, validates the active membership, creates a
trusted tenant context, checks `reputation.enabled`, and enforces
`reputation.read` before the repository is called.

No production development-tenant fallback remains in the admin application.
Organization, establishment, role, entitlement, and permission values are never
accepted from the browser. See `docs/AUTHENTICATION.md`.

## Remaining Phase 1 work

- Google OAuth, encrypted credential service, review synchronization, and reply
  publication.
- AI analysis and reply services with versioned prompts and strict structured
  output validation.
- Admin mutation flows, incidents, notifications, audit timeline, analytics,
  jobs, and connector monitoring. Each mutation must use the implemented
  server-side permission boundary.
- QR PNG/SVG downloads.
- Integration and end-to-end tests for external connectors.
