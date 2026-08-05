# YUTA POS Agent Instructions

`apps/yuta-pos` is a local-only restaurant POS client. UI text is French.

- Access operational persistence only through `apps/site-agent`; never import
  `@yuta/db-cloud` or `@yuta/db-pos` into the POS client.
- Never add cloud synchronization for orders, payments, kitchen state, print
  jobs, local staff, menu snapshots, or operational reports.
- Preserve historical accuracy, no-hard-delete rules, payment invariants,
  kitchen batches, print-job behavior, and offline-safe failure handling.
- Reuse `@yuta/ui` and keep touch targets, focus, status, loading, retry, and
  device-disconnected states usable in restaurant conditions.
- Update the current POS product, operator, QA, offline, local-development, and
  deployment documents when their behavior changes.

Validate with architecture check, POS typecheck/tests/build, and affected
site-agent, db-pos, contracts, core, and UI checks.
