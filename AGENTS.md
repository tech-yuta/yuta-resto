# AGENTS.md — YuTa Monorepo

## Workspace Overview

This is the YuTa internal restaurant tool monorepo.

```
apps/backoffice     — Restaurant back-office (port 3001)
apps/booking-web    — Public restaurant booking app (port 3005)
apps/web            — Public web app (port 3000)
apps/yuta-display   — Digital signage display (port 3002)
apps/yuta-pos       — Local-only restaurant POS client (port 3003)
apps/site-agent     — Target local POS API/device integration boundary (port 3004)
packages/db-cloud   — Target cloud SaaS database package
packages/db-pos     — Target local POS database package
packages/auth       — Authentication contracts and cryptographic primitives
packages/contracts  — Shared transport contracts and Zod schemas
packages/tenant     — Trusted cloud tenant context and authorization guards
packages/booking    — Pure public-booking domain logic
packages/core       — Shared business logic, tool registry
packages/ui         — Shared UI component library (@yuta/ui)
```

Future apps may include: `yuta-staff` and `yuta-crm`.

## Instruction and documentation order

Before editing:

1. Read this file.
2. Read `docs/README.md` and `docs/CURRENT_STATE.md`.
3. Read the nearest nested `AGENTS.md`.
4. Read the relevant architecture, feature, product, or operations document.
5. Inspect the implementation and tests.

The nearest nested `AGENTS.md` has priority for its directory. Current approved
documentation defines intended behavior; code and tests are implementation
evidence. Report conflicts rather than silently choosing one.

The legacy shared `packages/db` has been removed.
The authoritative current architecture is documented under `docs/architecture/`.

- `apps/backoffice` and server-side cloud features in `apps/web` use
  `packages/db-cloud`.
- `apps/yuta-pos` accesses local operational data through `apps/site-agent`;
  `site-agent` is the runtime owner of `packages/db-pos`.
- POS operational data must never be stored in or synchronized to the cloud
  database.
- `apps/yuta-display` is a standalone local product and keeps its single-owner
  database under `apps/yuta-display/src/db`.
- Do not create `packages/db-display` unless a second legitimate server-side
  consumer needs the display schema or repositories.
- Do not introduce a compatibility package that re-exports the new databases
  through `@yuta/db`.
- The future internal YUTA administration application is reserved as
  `apps/platform-admin`; do not use `apps/backoffice` for platform administration.
- `apps/booking-web` is an independent public cloud application. It resolves an
  establishment server-side and uses `packages/db-cloud`; its browser bundle
  must never receive database credentials or trusted tenant scope.

Run `pnpm architecture:check` after changing dependencies, environment access,
database boundaries, or package imports.

---

## Product visibility boundary

Repository ownership and public product visibility are different concerns.
Engineering documentation may describe every maintained cloud and local
runtime. Do not present local checkout, payment, billing, invoicing,
cash-register, or money-management workflows as YUTA public-service
capabilities in marketing/SEO copy, pricing, partner or bank materials,
commercial proposals, customer-facing roadmaps, or public announcements.

This restriction does not apply to technical documentation, tests, source code,
or local operator documentation. `Engineering` and `Local operator` visibility
labels define communication scope, not confidentiality.

---

## UI Law — Mandatory for All Apps

### Single UI source

All apps MUST use `@yuta/ui` (`packages/ui`).

NEVER introduce MUI, Ant Design, Chakra UI, Mantine, or any other component library.

### Design tokens

Use semantic Tailwind CSS token classes. Never use raw hex values in `className` or `style={{}}`. Core UI components must use role-based tokens, not product/story color names.

| Token family            | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `brand-*`               | Brand palette foundation                  |
| `neutral-*`             | Neutral palette foundation                |
| `bg-canvas`             | Page background                           |
| `bg-surface`            | Default card, panel, input surface        |
| `bg-surface-muted`      | Subtle backgrounds and hover states       |
| `bg-surface-selected`   | Selected or brand-tinted soft surface     |
| `text-primary`          | Primary text                              |
| `text-secondary`        | Secondary text                            |
| `text-muted`            | Muted text                                |
| `text-inverse`          | Text on dark or solid backgrounds         |
| `border-border-default` | Default borders and dividers              |
| `border-border-strong`  | Stronger borders                          |
| `bg-action-primary`     | Primary action background                 |
| `bg-action-danger`      | Destructive action background             |
| `ring-focus-ring`       | Focus rings                               |
| `status-*`              | Success, warning, danger, and info states |

### Component authority

`packages/ui/src/index.ts` is the authoritative public component export list.
Inspect source exports and existing usage before adding an app-local primitive.
Do not duplicate the export catalog in instruction or feature documents.

### Icons

Use `lucide-react` only. Never `@mui/icons-material`.

### Typography

Public YuTa websites and the restaurant back-office use Geist Sans for all UI
text, with `Inter, sans-serif` as the fallback stack. Do not use serif fonts.

### CSS setup per app

`globals.css` must start with:

```css
@import '@yuta/ui/styles/global.css';
```

`postcss.config.mjs` must contain:

```js
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
```

### Maintenance

Whenever a public component is added, renamed, or removed, update
`packages/ui/src/index.ts` and any focused usage documentation. Do not maintain
a second full catalog.

---

## General Rules

### Language

- Code, comments, types, variable names, commit messages: **English**
- UI text per app: see app-specific AGENTS.md (e.g., French for `yuta-display`)

### Tech stack

Package manifests are authoritative for framework and tool versions. Use
Next.js App Router, TypeScript strict mode, and the repository's Tailwind CSS
setup; do not introduce Pages Router.

### Exports

Named exports only. No default exports.

### Components

- PascalCase filenames and component names
- Prefer Server Components
- Use `'use client'` only when interactivity is required

### TypeScript

- Strict mode enabled
- No `any`
- Validate external input with Zod

### State management

No Redux, MobX, or Zustand unless explicitly added. Use React state and Server Components.

### Documentation maintenance

Whenever an agent changes app behavior, user flows, routes, setup commands,
deployment behavior, database behavior, or operational rules, the agent MUST
update the relevant docs in the same change.

The documentation index is `docs/README.md`. Update current documents in place;
do not add implementation reports or overlapping `final`, `new`, `v2`, or
`latest` documents. Use an ADR for durable architectural decisions and Git
history for completed execution history.

For POS-related work, keep these docs current:

- `docs/products/pos/USER_GUIDE.md` for operator-facing usage flows.
- `docs/products/pos/README.md` for POS architecture, scope, and implementation notes.
- `docs/operations/LOCAL_DEVELOPMENT.md` for local database setup changes.
- `docs/operations/DEPLOYMENT.md` for production or Docker deployment changes.

Do not rely on memory for newly added behavior. Document important decisions
such as cancellation/restore rules, print job behavior, payment behavior,
admin workflows, and known MVP limits when they change.

### Task workflow and validation

For meaningful changes:

1. Identify the goal, scope, affected runtime/data boundaries, and risks.
2. Inspect current code, tests, and documentation.
3. Reuse existing contracts, repositories, pure logic, and shared UI.
4. Implement the smallest coherent change with relevant tests.
5. Update current documentation in the same change.
6. Run `pnpm architecture:check` and `pnpm -r --if-present typecheck`.
7. Run relevant package tests and application builds.
8. Report files changed, commands run, results, skipped checks, and risks.

A task is complete only when the requested scope is satisfied, runtime and
authorization boundaries remain enforced, relevant checks pass, documentation
is current, and no duplicated source of truth was introduced.

---

## Deployment Rules

Shared production deployment conventions live in:

```txt
docs/operations/DEPLOYMENT.md
```

All new YuTa apps with Docker deployment must follow those conventions unless
the user explicitly requests a different production topology.

Key defaults:

- Cloud and local runtime families use separate database names, credentials,
  migrations, and failure domains.
- Cloud apps receive `CLOUD_DATABASE_URL`; only `site-agent` receives
  `POS_DATABASE_URL`; standalone display server code receives
  `DISPLAY_DATABASE_URL`.
- Browser bundles receive no database connection string.
- Local deployments may use the existing PostgreSQL server and
  `postgres_default` network, but cloud, POS, and display databases must remain
  logically isolated.
- Use Docker hostnames in database URLs, never container IP addresses.
- Keep production env files next to the app as `apps/<app-name>/.env.production`.
- Run Docker Compose from the repository root with `--env-file` and `-f`.
- Use a one-shot `migrate` service for database migrations.
- Run migrations with `--build` so the latest migration files are included.
- For runtime uploads, keep folders with `.gitkeep` and ignore uploaded media.
- If uploaded files return `404` in Next.js standalone mode, add a `GET` route
  that serves files from `UPLOAD_DIR`.
