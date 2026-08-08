# <Page name>

Status: Draft design package

Visibility: Engineering

Owner: YUTA product and engineering

Route: `<real route>`

Application: `<application>`

## Current status

State whether the route is:

- new and not implemented;
- visually implemented but not integrated;
- interactive;
- already integrated and in production-like use.

## Authority

Read:

- root `AGENTS.md`;
- nearest application `AGENTS.md`;
- `docs/CURRENT_STATE.md`;
- relevant feature/product documentation;
- `docs/ui/README.md`;
- `docs/ui/YUTA_FRONTEND_RULES.md`;
- the target application's frontend rules (for Backoffice,
  `docs/ui/BACKOFFICE_FRONTEND_RULES.md`);
- this package.

## Documents

- `PRODUCT_SCOPE.md`
- `UI_SPEC.md`
- `DATA_AND_INTERACTION_SPEC.md`
- `IMPLEMENTATION_PLAN.md`
- `ACCEPTANCE_CHECKLIST.md`

## References

List page-specific images and their purpose.

Images are non-authoritative.

## Prompt order

1. `prompts/00_REPOSITORY_ANALYSIS.md`
2. `prompts/01_VISUAL_BASELINE.md`
3. `prompts/02_COMPONENT_REFACTOR.md`
4. `prompts/03_INTERACTIONS.md`
5. `prompts/04_DATA_INTEGRATION.md`
6. `prompts/05_VISUAL_QA.md`

Do not run a later phase before reviewing the previous phase.

For an existing integrated route, preserve current authorization, data access, mutations, and tests.
