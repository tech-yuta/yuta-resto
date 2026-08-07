# Prompt 03 — Interactions

Implement or refine approved local interactions for `/etablissement/informations-generales` after the component structure is approved.

## Allowed interactions

Only implement interactions mapped as `SUPPORTED` or `UI_ONLY_DERIVED` in Prompt 00:

- local form editing;
- dirty/pristine state;
- save-button state using current form conventions;
- live public-preview updates from local values;
- supported public-visibility toggles;
- supported language selection/removal;
- supported service-mode selection;
- counters backed by current validation limits;
- current logo-picker interaction when infrastructure already exists;
- current public-preview action when a real route/modal exists;
- keyboard, focus, read-only, loading, and local error states.

## Classification rules

### `NEW_PAGE`

- interactions remain local and fixture-backed;
- do not persist data;
- label or disable non-functional actions according to current UI conventions.

### `EXISTING_PAGE`

- preserve existing loaders, mutations, authorization, scoped context, validation, and cache behavior;
- adjust local interaction wiring without replacing the real data flow;
- do not change backend contracts in this phase.

## Interaction rules

- hiding a supported public field must not delete its value;
- preview updates must not persist data;
- save cannot double-submit;
- failed current mutations preserve unsaved values;
- selected states are conveyed by semantics and visual cues beyond color;
- service-mode controls use existing identifiers, not screenshot-invented enums;
- no counters without approved limits;
- no address verification without an existing approved capability;
- no hardcoded completion percentage.

## Forbidden

- new persistence paths;
- schema, enum, permission, contract, API, or server-action creation;
- new external providers;
- adding screenshot-only options as real capabilities;
- weakening server authorization.

## Required output

- interactions added/refined;
- unsupported interactions intentionally omitted;
- files changed;
- accessibility/keyboard evidence;
- targeted tests added/updated where current infrastructure supports them;
- verified commands actually run and exact results.

Stop before data-integration changes.
