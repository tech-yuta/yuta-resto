# Prompt 01 — Visual Baseline

Implement or align the visual baseline for `/etablissement/informations-generales` only after Prompt 00 has been approved.

## Inputs

- approved Prompt 00 report and page classification;
- `README.md`;
- `PRODUCT_SCOPE.md`;
- `UI_SPEC.md`;
- `DATA_AND_INTERACTION_SPEC.md`;
- `references/establishment-general-information-desktop-reference.png`;
- current YUTA shell, tokens, typography, and shared components.

## Branch by classification

### `NEW_PAGE`

- create the route using current repository conventions;
- typed fixture data is allowed only inside this page/feature to establish layout;
- clearly isolate fixtures so Phase 4 can remove them;
- do not create API routes, server actions, database fields, permissions, or persistence;
- mock upload/preview actions must not appear functional unless an existing capability is reused.

### `EXISTING_PAGE`

- improve the current implementation in place;
- keep real data loading, authorization, scoped context, mutations, validation, cache behavior, and tests;
- do not replace existing data with fixtures;
- do not bypass current components merely to reproduce the screenshot.

## Visual tasks

1. Reuse the current application shell and navigation.
2. Align page header hierarchy and actions.
3. Build or align the four numbered profile sections.
4. Build/align the public-preview column using supported fields only.
5. Match proportions, spacing, density, radius, borders, and selected-state tone using semantic tokens.
6. Implement responsive composition at 1440, 1024, 768, and 390 px.
7. Preserve French copy and current repository vocabulary.
8. Use only current approved fields and capabilities from the mapping table.

## Forbidden in this phase

- schema or migration changes;
- new contracts/enums/permissions;
- new API routes or server actions;
- new storage/geocoding providers;
- global shell/sidebar redesign;
- unrelated shared-component changes;
- claiming visual parity without browser evidence.

## Required evidence

- route tested;
- classification repeated;
- files changed;
- shared components reused;
- screenshot paths at 1440, 1024, 768, and 390 px;
- horizontal-overflow status;
- console/hydration errors;
- intentional deviations;
- unsupported capabilities omitted or proposed.

Stop after the visual baseline and wait for approval before refactoring.
