# Codex Prompt — Phase 5: Visual and Responsive QA

Capture `/etablissement/horaires-services` at:

- 1440 px;
- 1024 px;
- 768 px;
- 390 px.

Compare in this order:

1. current written page specifications;
2. current Backoffice shell and `@yuta/ui`;
3. page-specific desktop reference;
4. shared shell reference.

Report differences as:

- Critical;
- Major;
- Minor;
- Intentional deviation.

Check:

- shell alignment;
- page hierarchy;
- column proportions;
- exception workflow density;
- current field readability;
- truthful persisted service summaries;
- truthful exception types;
- semantic tokens;
- responsive stacking;
- overflow;
- keyboard;
- focus;
- labels;
- pending, error, success, and retry states;
- browser console and hydration errors.

Fix only approved Critical and Major issues.

Do not combine visual correction with contract, permission, schema, or backend redesign.

Run:

- `pnpm docs:check`;
- `pnpm format:check`;
- `pnpm architecture:check`;
- Backoffice typecheck;
- Backoffice tests;
- Backoffice build;
- relevant booking and tenant tests.

Do not report lint as passed.
