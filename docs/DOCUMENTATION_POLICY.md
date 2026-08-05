# YUTA Documentation Policy

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

- Architecture documents contain durable boundaries and invariants and are
  updated in place.
- Feature and product documents contain current behavior and user flows.
- Operations documents contain setup, deployment, recovery, and maintenance.
- A feature `STATUS.md` or issue tracks temporary remaining work.
- ADRs preserve durable decisions, alternatives, and consequences.
- Task specifications are removed after completion once durable information is
  incorporated into current documents.

## Visibility metadata

Use one of:

- `Visibility: Public product`
- `Visibility: Engineering`
- `Visibility: Local operator`

These labels define communication scope, not secrecy. Public-product documents
must not present local checkout, payment, billing, invoicing, cash-register, or
money-management workflows as public YUTA service capabilities.

Completed implementation reports, pre-migration audits, superseded reset plans,
duplicate catalogs, and old execution-order documents do not remain active.
Their history belongs in Git.

Use stable descriptive names, not `new`, `final`, `v2`, or `latest`. A behavior
change updates its current documentation in the same change. A move or deletion
updates every reference. Do not delete a product specification that still holds
unique requirements until those requirements have been preserved elsewhere.

`packages/ui/src/index.ts` is the authoritative UI export catalog. Package
manifests are authoritative for framework and tool versions.
