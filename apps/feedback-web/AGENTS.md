# Public Feedback Agent Instructions

`apps/feedback-web` is the independent, mobile-first public direct-feedback
application. Its customer-facing UI is French and it does not share a browser
session with the back-office.

- Resolve the establishment on the server from a verified hostname and the
  configured public feedback slug. Never trust organization or establishment
  IDs supplied by the browser.
- Keep `@yuta/db-cloud`, environment variables, rate-limit secrets, and trusted
  tenant context server-only.
- Validate submissions with shared reputation contracts and persist them
  through the cloud reputation repository.
- Minimize customer contact data, require consent before storing contact
  details, and preserve honeypot and database-backed rate limiting.
- Public feedback URLs are `noindex, nofollow` unless product policy changes.
- Reuse `@yuta/ui`; implement unavailable, validation, submitting, success,
  rate-limit, and recovery states.

Validate with the feedback-web typecheck/build plus contracts, db-cloud, tenant,
documentation, and architecture checks.
