# Cloud Database Package Instructions

`@yuta/db-cloud` owns cloud schemas, migrations, repositories, tenant/auth
persistence adapters, booking/reputation persistence, and cloud seeds. Only
server code may import it.

- Use `CLOUD_DATABASE_URL` and never import another database boundary.
- Tenant-owned queries include organization scope; establishment-owned queries
  include both organization and establishment scope in the query.
- Verify parent ownership, use constraints/indexes/transactions, and add
  cross-tenant denial tests for sensitive access.
- Create only tables required by approved implemented features.
- Do not expose rows as public contracts or leak provider secrets.
- Never edit a deployed migration or add a production reset command.
- Keep seeds idempotent and integration tests guarded and disposable.

Validate with architecture check and db-cloud typecheck/tests; schema changes
also require the guarded integration suite and reviewed generated SQL.
