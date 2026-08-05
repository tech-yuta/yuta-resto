# YUTA Development Workflow

Status: Current

Visibility: Engineering

Owner: YUTA engineering

Last updated: 2026-08-05

1. Read root and nearest nested `AGENTS.md`.
2. Read `docs/README.md`, `docs/CURRENT_STATE.md`, and relevant current docs.
3. Inspect existing code, tests, package scripts, and the dirty worktree.
4. Define goal, scope, affected boundaries, security requirements, acceptance
   criteria, validation, and documentation impact.
5. Implement the smallest coherent change and update tests and docs together.
6. Report commands actually run, results, and unresolved risks.

Baseline checks:

```bash
pnpm install
pnpm dev:env:sync
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm -r --if-present typecheck
```

Run only the relevant package tests and application builds in addition to the
baseline. Database integration tests require their documented disposable
database guards. Documentation-only changes do not require application builds,
but paths and links must be verified.

Repository-wide grouped checks used by CI are:

```bash
pnpm test:cloud
pnpm test:local
pnpm build:cloud
```

`test:local` includes the disposable PostgreSQL offline POS acceptance flow.

`docs:check` enforces the current-document index, metadata, local Markdown
links, Booking architecture aliases, and instruction-file consistency.
`format:check` covers Prettier-managed repository files; generated Next.js
declarations, Drizzle metadata, the generated POS service worker, and the pnpm
lockfile are excluded through `.prettierignore`.

Dependabot currently monitors GitHub Actions only. npm/pnpm version updates stay
manual until GitHub Dependabot supports the repository's pnpm 11 lockfile.

Use `docs/tasks/TASK_TEMPLATE.md` for substantial work and an ADR for durable
architectural decisions. Do not claim a command passed when it was not run.
