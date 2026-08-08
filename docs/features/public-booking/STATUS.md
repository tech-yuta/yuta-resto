# Public Booking Status

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-08

## Implemented foundation

- Independent `apps/booking-web` application and pure `packages/booking` domain.
- Current application and package ownership is reconciled in the master product
  specification.
- Cloud persistence and server-side establishment resolution.
- Availability/capacity rules and public creation/management foundations.
- Back-office reservation workflows, shared contracts, and UI foundations.

## Feature-by-feature reconciliation

This matrix reconciles the implemented Phase 0/1 behavior with `README.md` and
the durable requirements in `PRODUCT_SPEC.md`. `Implemented` describes code and
test evidence, not production deployment or visual sign-off.

| Area                                       | Status                           | Reconciled behavior and limits                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent application and configuration  | Implemented, not deployed        | `apps/booking-web` builds independently and validates `CLOUD_DATABASE_URL`, `CLOUD_DATABASE_SSL`, `PUBLIC_BOOKING_BASE_URL`, and `BOOKING_RATE_LIMIT_SECRET` at startup/build. Production domain and deployment have not been verified.                                                                                                                                                                                                                          |
| Public establishment resolution            | Implemented                      | Resolution requires an active organization, active establishment, enabled `booking.enabled` entitlement, and enabled booking settings. Public clients provide only the slug; tenant identifiers remain server-derived.                                                                                                                                                                                                                                           |
| Public guest flow                          | Implemented, browser E2E covered | The five-step French flow supports party size, date, time, required name/phone/email, one optional free-text special-requirements field, creation, confirmed/pending outcomes, and ICS download. Automated Chrome acceptance covers desktop and 390 px mobile flow, responsive overflow, keyboard traversal/activation, visible focus, programmatic labels, Axe checks, and correction recovery. Manual assistive-technology acceptance remains open.            |
| Branding and public information            | Partial                          | The flow renders establishment name, configured logo or YUTA fallback, welcome copy, visible phone/address, and booking policy. Cover image and visible public email are loaded but not rendered; custom theme fields, map links, social links, and multilingual content are not implemented.                                                                                                                                                                    |
| Availability and capacity                  | Implemented                      | Server-side availability applies establishment timezone, booking horizon, minimum notice, weekly periods, dated closures/modified hours/blocked slots, consuming statuses, and per-slot capacity. PostgreSQL advisory locking serializes last-capacity creation. Unit coverage exists for timezone/capacity and guarded integration coverage verifies concurrency.                                                                                               |
| Reservation creation and public management | Implemented, browser E2E covered | Creation supports automatic/manual confirmation, hashed public tokens, scoped idempotency, audit/history/outbox writes, secure detail lookup, cancellation policy, and cancellation. Guarded API integration and isolated Playwright fixtures cover automatic/manual creation, secure management, cross-tenant token denial, invalid tokens, disabled booking, cancellation, and persisted outcomes. Guest modification and resend are later-phase behavior.     |
| Source attribution                         | Partial                          | The public page accepts a bounded `source` enum for direct, Google, social, website, and QR links. UTM parameters, referrer, campaign detail, and conversion analytics are not persisted.                                                                                                                                                                                                                                                                        |
| Public abuse protection                    | Partial                          | Database-backed limits hash the client address with a secret and scope attempts by establishment/action. Phone/email duplicate detection, risk-based CAPTCHA, structured request logs, and broader load verification are not implemented.                                                                                                                                                                                                                        |
| Back-office reservation operations         | Implemented with limits          | Tenant-scoped day/week lists, detail, guest/time/party edits, internal notes, lifecycle actions, status history, and manual creation exist. Manual creation requires enabled public booking, remains online-capacity checked, hardcodes source `BACK_OFFICE`, and has no approved capacity override. Dedicated service-period/source filters and notification history are absent.                                                                                |
| Settings, weekly periods, and exceptions   | Implemented with limits          | Owners/managers can update booking rules and create/delete service periods and dated exceptions. Existing periods and exceptions are replaced through delete/recreate rather than edited in place.                                                                                                                                                                                                                                                               |
| Notifications                              | Outbox only; launch blocker      | Successful booking transactions enqueue provider-neutral email deliveries. No worker claims records, no provider sends messages, and no retry/observability operator owns the queue. Confirmation email is not an implemented capability.                                                                                                                                                                                                                        |
| Loading, error, and recovery states        | Implemented at current routes    | Public and Backoffice reservation routes expose the current loading, unavailable/empty, error, forbidden, conflict, pending, success, and recovery states described in `README.md`.                                                                                                                                                                                                                                                                              |
| Automated and acceptance coverage          | Partial                          | Pure booking, contract, Backoffice model, tenant isolation, public-token scope, concurrency, guarded public API integration, and isolated Playwright/Axe tests exist. Browser coverage includes automatic/manual outcomes, management/cancellation, disabled and invalid/cross-tenant tokens, keyboard/focus, labels, status semantics, and mobile overflow. Manual screen-reader acceptance, repeated-read/load tests, and outbox-backlog behavior remain open. |

## Local browser QA evidence — 2026-08-08

- Desktop `luna-poitiers` completed the five-step manual-confirmation flow for
  2 guests on 2026-08-08 at 19:00. Native required-field and invalid-email
  validation focused the failing field; correcting the data completed the
  request with `PENDING` status and a scoped public management link.
- The `luna` local fixture was temporarily changed from `MANUAL` to `AUTOMATIC`
  for one isolated request and restored immediately. Its secured management
  route showed `CONFIRMED`; cancellation returned `CANCELLED`, removed the
  cancellation action, and kept the management route readable.
- The public management page now localizes status, date, and party-size copy
  instead of exposing internal enum/date formatting.
- At a 390 x 844 viewport, the party and guest steps had no horizontal overflow.
  The guest inputs now have programmatic French labels, including the optional
  special-requirements field.
- An unknown establishment slug rendered the public unavailable state without
  horizontal overflow. Validation correction exercised the current recoverable
  guest-input path.
- Full Tab-order, visible-focus, and screen-reader acceptance is not signed off:
  the integrated browser run did not produce reliable synthetic Tab/Enter
  traversal, so code inspection is not recorded as acceptance evidence.

## Automated browser acceptance — 2026-08-08

- Six Playwright scenarios run against a production Booking Web build on an
  isolated port with unique organization/establishment fixtures and automatic
  database cleanup.
- Chrome verifies manual and automatic creation, secure management links,
  cross-tenant token denial, cancellation, disabled booking, invalid tokens,
  keyboard traversal and activation, visible focus, and 390 px mobile overflow.
- Axe runs on the guest flow, confirmation, management, cancelled, disabled,
  and invalid-token states. The first acceptance run identified and corrected
  shared muted, action, focus, success, and warning contrast plus standalone
  `EmptyState` heading semantics.
- Automated semantic checks do not replace a manual screen-reader pass with
  supported assistive technology.

## Remaining release blockers

- Select and approve an email provider, implement the cloud outbox worker, and
  assign retry, monitoring, and incident ownership.
- Verify the production deployment, domain, migrations, environment, and health
  endpoint in the target environment.
- Complete a manual screen-reader pass; automated keyboard, focus, semantic,
  Axe, and mobile responsive evidence is recorded above.
- Run repeated availability-read, traffic-spike, advisory-lock, and outbox
  backlog tests at launch-representative volume.

## Product decisions requiring alignment

- The current contract requires guest email, while the master specification
  describes email as optional.
- Decide whether manual staff creation should remain subject to public
  eligibility/capacity or gain an audited override and source selection.
- Decide which campaign/referrer fields belong in Phase 1 before adding
  attribution persistence.
- Approve the production observability and abuse-protection baseline; do not
  infer providers, CAPTCHA, analytics, or logging infrastructure from the
  master specification.

## External dependency and operator register

Role owners below identify the accountable function, not a named person. A row
with an unassigned approval owner remains blocked even when repository code
exists.

| Dependency or gate                                | Current state                                                                                                                                                                                                                          | Accountable owner                                                                | Evidence required to unblock                                                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email provider approval                           | No provider selected or configured.                                                                                                                                                                                                    | Unassigned product/operations approver                                           | Approved provider, data-processing review, sending domain, credentials owner, rate limits, and cost decision.                                                                                |
| Notification outbox worker                        | Schema and transactional enqueue exist; no consumer, retry processor, or resend operation exists.                                                                                                                                      | YUTA engineering for implementation; YUTA operations for runtime                 | Guarded claim/send/update implementation, provider adapter, idempotent retries, dead-letter policy, tests, deployment, dashboard, and runbook.                                               |
| Vercel project and production domain              | Target project, root directory, and `reservation.yutapro.fr` are documented; live project/domain/DNS/TLS are not verified.                                                                                                             | YUTA operations                                                                  | Project settings capture, DNS/TLS verification, manual deployment record, canonical URL check, and rollback owner.                                                                           |
| Production environment and secrets                | Four required booking variables are fail-fast validated; production values and rotation ownership are not verified.                                                                                                                    | YUTA operations                                                                  | Environment inventory with secret-store location, least-privilege access, rotation owner/date, and successful production build/runtime validation.                                           |
| Cloud migrations                                  | Current Drizzle journal and one-shot migration procedure exist; target production schema has not been verified.                                                                                                                        | YUTA engineering and operations                                                  | Reviewed migration plan, backup/PITR confirmation, dry run against an empty or disposable database, production journal check, and rollback decision.                                         |
| Managed database backup and recovery              | Deployment policy delegates backup/PITR to the managed provider; provider configuration and restore drill are not evidenced.                                                                                                           | YUTA operations                                                                  | Retention/RPO/RTO decision, encryption/access review, successful restore drill, and named incident owner.                                                                                    |
| Health and readiness                              | `/api/health` returns a static process response and does not prove database readiness or booking queries.                                                                                                                              | YUTA engineering for semantics; YUTA operations for probing                      | Approved liveness/readiness contract, dependency-safe implementation, external probe, alert routing, and failure/recovery evidence.                                                          |
| Logs, metrics, tracing, and alerts                | Audit rows and generic server errors exist; no production telemetry provider, SLO, dashboard, or alert owner is configured.                                                                                                            | Unassigned engineering/operations owner                                          | Privacy-safe structured events, availability/creation latency and error metrics, outbox backlog metric, SLOs, dashboard, alerts, retention, and runbook.                                     |
| Privacy, legal copy, and data-controller identity | Policy acceptance timestamp and marketing-consent boolean persist; the booking flow lacks approved controller/processor copy and an in-flow privacy notice. Public legal URLs exist only as external links from the root landing page. | Unassigned product/legal approver                                                | Approved booking/privacy copy, controller identity rules, consent purposes, retention/deletion policy, contact channel, external URL verification, and legal sign-off.                       |
| Abuse-protection baseline                         | Hashed database rate limiting exists. CAPTCHA, duplicate-contact controls, edge/WAF policy, retention cleanup, and incident thresholds are undecided.                                                                                  | YUTA product/security for policy; YUTA engineering/operations for implementation | Approved threat baseline, limits, retention job, edge controls, privacy review, alert thresholds, and abuse-response runbook.                                                                |
| Release acceptance                                | Focused tests, guarded API integration, production build, seeded local QA, and automated Chrome/Axe browser acceptance pass; manual screen-reader acceptance, load tests, and live production smoke tests remain open.                 | Unassigned release owner                                                         | Signed checklist covering migrations, health, booking/cancellation scenarios, tenant denial, mobile/accessibility, load, notification delivery, monitoring, rollback, and go/no-go decision. |

## Next roadmap step

Add guarded launch-representative reliability coverage for repeated
availability reads, traffic spikes, advisory-lock contention, and notification
outbox backlog behavior. Manual screen-reader, provider delivery, and production
approval remain separate acceptance gates.

## Validation

```bash
pnpm architecture:check
pnpm --filter @yuta/booking typecheck
pnpm --filter @yuta/booking test
pnpm --filter @yuta/booking-web test
YUTA_ALLOW_DATABASE_INTEGRATION_TESTS=true pnpm test:booking-web:e2e
pnpm --filter @yuta/booking-web typecheck
pnpm --filter @yuta/booking-web build
pnpm --filter @yuta/backoffice typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```
