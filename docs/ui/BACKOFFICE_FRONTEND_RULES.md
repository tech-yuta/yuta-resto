# YUTA Backoffice Frontend Rules

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-08

## Scope

These rules apply only to UI work in `apps/backoffice` and extend
`YUTA_FRONTEND_RULES.md`.

The Backoffice is the authenticated restaurant-facing cloud application. UI
text is French; code, identifiers, comments, logs, and technical documentation
are English.

User-facing page routes use canonical lowercase French slugs without accents.
Do not add compatibility aliases unless a current route-migration decision
explicitly requires redirects for existing bookmarks. API routes remain
English and `/api/...` paths are not translated.

## Required reading

In addition to the shared frontend reading order:

1. read `apps/backoffice/AGENTS.md`;
2. read `docs/ui/README.md` and `docs/ui/PAGE_PACK_PROTOCOL.md` when a page
   package is involved;
3. read the current package under `docs/ui/pages/<page-slug>/`;
4. inspect the route, Backoffice shell, navigation, implementation, tests, and
   related feature documentation.

## Tenant, authorization, and cloud ownership

- Authenticate and authorize on the server.
- Derive organization, establishment, membership, role, permissions, and
  entitlements from the validated server session and active membership.
- Every tenant-owned repository read and mutation receives trusted
  organization and establishment scope as required by ownership.
- Passing identifiers to presentation components does not make browser values
  trusted. Server actions and endpoints rederive or validate tenant scope.
- Keep `@yuta/db-cloud`, provider integrations, secrets, and trusted scope
  behind server boundaries.
- Visible navigation filtering is not a substitute for server authorization.
- Do not place platform-wide YUTA administration or local POS workflows in the
  restaurant Backoffice.

## Route composition

A Backoffice `page.tsx` may resolve parameters, enforce route-level
authentication and authorization, resolve trusted organization and
establishment context, load server data, handle redirects or missing resources,
and compose page sections.

When decomposing an integrated page, preserve authorization, tenant scope,
data loading, mutations, validation, errors, tests, canonical routes, and domain
behavior. Component extraction does not authorize backend contract or
persistence redesign.

## Shell and navigation

Unless explicitly authorized:

- do not redesign the Backoffice shell, sidebar, topbar, or establishment
  selector;
- do not infer navigation items from a reference image;
- do not add unsupported cloud-service modules;
- do not alter authentication or tenant switching;
- do not add dead links: future navigation items require an approved, real
  route and truthful placeholder state.

Canonical route groups and visible navigation ownership must follow current
Backoffice information architecture and capability decisions.

## Forms, time, and data

- Use current Backoffice form and mutation conventions.
- Preserve server-derived permissions and tenant-scoped repository access.
- Use establishment timezone and locale where available.
- Treat exception dates as establishment-local calendar dates.
- Preserve the repository's canonical time representation.
- Stop and request approval when a design requires a new domain field,
  constraint, enum value, route, permission, contract, or migration.

## Page packages

Current packages under `docs/ui/pages/` describe Backoffice pages unless their
README states otherwise. They extend both the shared and Backoffice frontend
rules and must not duplicate them.

Update one stable package in place. Page documents may specify route-local
component boundaries and page-specific states, but they do not override
architecture, tenant authorization, contracts, or implemented domain
semantics.

## Verification

Use the repository-wide checks from `YUTA_FRONTEND_RULES.md` and the relevant
Backoffice commands:

```text
pnpm --filter @yuta/backoffice typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Run affected auth, tenant, contract, booking, and cloud-database tests when
their behavior changes.

For visual work, review the relevant states at:

```text
1440 px
1024 px
768 px
390 px
```

Verify console and hydration errors, keyboard operation, visible focus,
responsive layout, horizontal overflow, and truthful loading, empty, error,
forbidden, conflict, success, and recovery states.

The Backoffice currently has no lint script. Never report lint as passed unless
a lint script is deliberately added and executed.
