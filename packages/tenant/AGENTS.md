# Tenant Package Instructions

`@yuta/tenant` defines trusted cloud tenant context, resolution ports,
normalization, guards, and scope assertions. It remains portable and must not
import persistence, Drizzle, React, Next.js, HTTP framework objects, UI, or
environment variables.

Tenant context is resolved from trusted server state, never constructed from
browser input. Public resolution uses verified identifiers; authenticated
resolution requires an active matching membership. Organization,
establishment, role, entitlement, and permission checks fail closed. Context
objects are immutable and no production fallback silently selects a tenant.

Validate with tenant typecheck/tests and architecture check.
