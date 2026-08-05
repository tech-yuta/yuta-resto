# Reputation Phase 1 Backlog

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

This file is the operational implementation tracker for
the reputation feature. Durable behavior belongs in the adjacent `README.md`.

## Current objective

Implement idempotent Google review import and a manual synchronization action.

## Completed foundation

- Shared reputation enums, Zod contracts, database schema, indexes, repository
  reads, permissions, LUNA seed data, and the independent `feedback-web` app.
- Unified inbox list and feedback detail reads.
- Public direct-feedback page with validation, consent handling, external review
  links, tenant resolution, and abuse rate limiting.
- Database-backed back-office authentication with HttpOnly sessions.
- Tenant and establishment selector with server-side membership validation and
  session rotation.
- `/team/users-access` membership administration for owners and administrators.
- Multi-tenant and multi-location persistence model.
- Authentication and membership audit events.

## Completed operational inbox

`/customers/reviews` is now a persistent, tenant-scoped operational inbox:

- [x] Add repository mutations for feedback status.
- [x] Add repository mutations for assignment to a tenant user.
- [x] Add manual reply draft creation and editing.
- [x] Add internal note creation.
- [x] Add server actions with Zod validation.
- [x] Enforce organization, establishment, entitlement, and role checks on every
      mutation.
- [x] Restrict employees to feedback assigned to their own user account.
- [x] Record reputation audit events for status, assignment, draft, and note
      changes.
- [x] Replace local-only editor state with persisted database state.
- [x] Move filtering, sorting, and pagination to repository-backed queries.
- [x] Complete responsive list/detail behavior for tablet and mobile layouts.
- [x] Add contract and database integration coverage for mutations,
      employee-level visibility, and cross-tenant denial.

Acceptance result: a manager can process feedback, assign it, save a manual
Google reply draft, add an internal note, reload the page, and see every change
persisted. Publishing remains disabled until the Google connector is complete.

## Next task: Google connector

Implement the connector in this order:

- [ ] Configure Google Cloud and enable the Business Profile APIs.
- [x] Implement tenant-bound OAuth start and callback routes.
- [x] Encrypt access and refresh tokens at rest with AES-256-GCM.
- [x] Refresh expired access tokens server-side when a refresh token is
      available.
- [x] List accessible Google accounts and locations.
- [x] Save a server-verified location to the tenant connector.
- [ ] Import and update reviews without duplicates.
- [ ] Add manual synchronization.
- [ ] Add scheduled synchronization and retry behavior.
- [x] Display connector status, configuration errors, OAuth errors, and expired
      authorization recovery.
- [ ] Reconcile Google replies with local reply state.

Required external configuration:

- Google OAuth client ID and client secret.
- Approved redirect URI.
- Business Profile API access.
- Production credential-encryption key.

Public application preparation:

- [x] Add a public YUTA homepage that accurately presents the review workflow.
- [x] Add public Google integration, privacy, terms, legal, data-management,
      and contact routes.
- [ ] Publish the website over HTTPS on a verified `yutapro.fr` hostname.
- [ ] Complete the registered publisher and production hosting details.
- [ ] Verify the production domain for the Google OAuth consent screen.

Application-side configuration and connector UI are complete. Google Cloud
project approval, API enablement, OAuth consent configuration, and production
credentials remain operator tasks.

## Remaining milestones

### AI analysis and reply generation

- [ ] Add a provider-independent AI service.
- [ ] Version the analysis and reply prompts.
- [ ] Validate structured analysis output with Zod.
- [ ] Store sentiment, urgency, topics, summary, and suggested action.
- [ ] Generate replies using the tenant brand voice.
- [ ] Support tone transformations.
- [ ] Add retry, timeout, loading, and error states.
- [ ] Ensure AI never publishes automatically.

Required external configuration:

- Selected AI provider and API credentials.
- Approved model and production usage limits.

### Google reply publication

- [ ] Validate publish permission and connector state.
- [ ] Publish an approved reply to Google.
- [ ] Track publishing, published, and failed states.
- [ ] Retry recoverable failures.
- [ ] Reconcile local and remote reply state.
- [ ] Audit every external publication attempt.

### Public collection completion

- [ ] Add QR-code management UI.
- [ ] Download QR codes as PNG and SVG.
- [ ] Verify the production hostname and printed QR flow.

### Incident workflow

- [ ] Create an incident from feedback.
- [ ] Add incident list and detail routes.
- [ ] Assign owner, category, priority, and status.
- [ ] Record root cause and corrective action.
- [ ] Resolve and close incidents.
- [ ] Keep incidents linked to source feedback.
- [ ] Add in-app notifications.

### Analytics and hardening

- [ ] Average rating, review count, reply rate, and average reply time.
- [ ] Rating distribution and top negative topics.
- [ ] Open incident count.
- [ ] Notification rules.
- [ ] Reputation audit timeline.
- [ ] Connector and background-job observability.
- [ ] Empty, loading, retry, and error states.
- [ ] Unit tests required by the specification.
- [ ] Google and AI integration tests.
- [ ] End-to-end tests for the eight required Phase 1 scenarios.
- [ ] Desktop, tablet, and mobile acceptance verification.

## Deferred beyond Phase 1

- Facebook and Instagram connectors.
- Private social messages.
- Automatic AI publication.
- Advanced approval workflows.
- SMS and email campaigns.
- Automatic customer compensation.
- Competitor monitoring.
- Cross-organization analytics.
- Platform super-admin UI.

## Standing implementation rules

- Code and technical documentation are English; product UI is French.
- Use `@yuta/ui` and `lucide-react`.
- Use server-side authentication, tenant resolution, entitlements, and
  permissions.
- Never trust organization, establishment, role, or permission input from the
  browser.
- Every external action and material workflow mutation must be audited.
- Google and AI provider code must remain outside UI components.
- OAuth tokens and customer contact data must never appear in logs.
- AI generates drafts only and never publishes autonomously.
- Public review links must not depend on the submitted score.
- Update this backlog whenever a task is completed, added, deferred, or
  reordered.
