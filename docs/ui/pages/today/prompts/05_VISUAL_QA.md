# Codex prompt — Phase 5: Visual and responsive QA

Verify the authenticated `/aujourdhui` route at:

- 1536 px;
- 1024 px;
- 768 px;
- 390 px.

Compare in this order:

1. current written page scope and specifications;
2. current Backoffice shell, `@yuta/ui`, and semantic tokens;
3. `references/today-dashboard-approved.png`.

Report differences as Critical, Major, Minor, or Intentional deviation. Check
shell alignment, hierarchy, card proportions, density, responsive order,
overflow, keyboard, focus, labels, truthful states, console errors, and
hydration errors.

Fix only approved Critical and Major issues. Do not reintroduce unsupported
reference modules or combine visual correction with backend redesign.

Run:

```bash
pnpm docs:check
pnpm format:check
pnpm architecture:check
pnpm -r --if-present typecheck
pnpm --filter @yuta/backoffice test
pnpm --filter @yuta/backoffice build
```

Run affected booking, reputation, tenant, authorization, contract, and
cloud-database tests. Do not claim a lint result because Backoffice has no lint
command.
