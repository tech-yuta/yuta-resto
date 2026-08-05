# YUTA Tenancy and Authorization

Status: Current

Owner: YUTA engineering

Last updated: 2026-08-05

## Model

```text
organization
└── establishment
```

There is no persisted `tenant` entity. A tenant is immutable trusted runtime
context used to isolate and authorize a cloud request.

Authenticated context is derived from a validated server session, active user,
active membership, related active organization/establishment, role,
permissions, and entitlements. Public context is resolved from a verified
hostname/domain mapping or an explicitly documented public booking identifier.

Route parameters, query strings, forms, headers, browser state, local storage,
hidden fields, and user-editable cookies are never authorization proof.

## Scope rules

- Organization-owned access includes `organizationId` in the database query.
- Establishment-owned access includes both `organizationId` and
  `establishmentId` in the same query whenever possible.
- Lookup by resource ID alone is forbidden for tenant-owned data.
- Missing context, membership, permission, entitlement, or scope fails closed.
- Tenant switching validates the target membership on the server and refreshes
  trusted session state.

Sensitive repositories and mutations require tests for allowed access, wrong
organization, wrong establishment, suspended membership, missing permission or
entitlement, and stale/removed access.

These cloud tenant rules do not make POS operational data cloud-owned. POS and
display retain the separate boundaries defined in `DATABASE_BOUNDARIES.md`.
