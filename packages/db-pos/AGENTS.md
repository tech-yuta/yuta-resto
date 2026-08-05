# POS Database Package Instructions

`@yuta/db-pos` owns restaurant-local POS schemas, migrations, repositories, and
seeds. `apps/site-agent` is its runtime owner.

- Use `POS_DATABASE_URL`; never import cloud or display persistence.
- POS operational data must never be synchronized to cloud persistence.
- Preserve immutable historical snapshots, cancellation/restore history,
  payment/check invariants, kitchen batches, and durable print jobs.
- Use constraints, indexes, and transactions for operational invariants.
- Never edit a deployed migration; review new generated SQL.
- Keep seeds idempotent and integration tests guarded and disposable.

Validate with architecture check and db-pos typecheck/tests; schema changes also
require the guarded integration suite.
