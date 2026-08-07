# Prompt 02 — Component Refactor

Refactor the approved visual baseline for `/etablissement/informations-generales` without changing its approved appearance or business behavior.

## Tasks

1. Review the files created/modified in Phase 1.
2. Reuse current `@yuta/ui` and app-local primitives before adding page-level components.
3. Extract focused page-level components only where they improve readability, testing, or ownership, for example:
   - section container/header;
   - identity section;
   - coordinates section;
   - public-information section;
   - languages/service-modes section;
   - public preview.
4. Keep feature-specific components inside the existing page/feature directory.
5. Move nothing into shared UI unless there is demonstrated reuse by independent features and repository rules allow it.
6. Preserve server/client boundaries, authorization wrappers, loaders, mutations, form state, and tests.
7. Remove duplicated local styling only when an existing token/variant already covers it.
8. Keep responsive and accessibility behavior unchanged.

## Forbidden

- visual redesign;
- fixtures replacing real data on an `EXISTING_PAGE`;
- schema, API, contract, permission, or mutation changes;
- adding generic abstraction layers for a single use;
- page-specific boolean props added to shared primitives without approval;
- unrelated refactors.

## Required output

- files changed;
- components reused;
- components extracted and ownership rationale;
- proof that visuals and behavior remain unchanged;
- verified commands actually run and exact result.

Stop before adding new interactions.
