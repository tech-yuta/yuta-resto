# YUTA UI Page Pack Protocol

Status: Current

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

## Purpose

This protocol defines the required artifact shape when an external design assistant or coding agent creates a YUTA UI page package.

It prevents flat, ambiguous packs and ensures that visual references, product decisions, implementation instructions, and acceptance criteria remain scoped to one stable page directory.

## Trigger convention

The project shorthand is:

```text
Lên UI + Codex pack chuẩn cho page `<route or page name>`.
```

The resulting package must comply with this document.

## ZIP root rule

The archive entry paths must begin directly at:

```text
docs/ui/pages/<page-slug>/
```

Correct:

```text
docs/ui/pages/today/README.md
docs/ui/pages/today/UI_SPEC.md
```

Incorrect:

```text
YUTA_TODAY_CODEX_PACK/docs/ui/pages/today/README.md
```

Incorrect:

```text
YUTA_TODAY_CODEX_PACK/01_UI_SPEC.md
```

The archive must be safe to extract at the repository root.

## Slug rules

A page slug:

- is lowercase;
- uses hyphens;
- contains no accents;
- remains stable across revisions;
- normally follows the real route or established feature vocabulary.

Examples:

```text
/aujourdhui                         -> today
/etablissement/horaires-services   -> hours-services
/etablissement/informations        -> establishment-information
/equipe/taches-quotidiennes        -> daily-tasks
```

Do not create `v2`, `new`, `final`, or `latest` page directories.

## Required page structure

```text
docs/ui/pages/<page-slug>/
├── README.md
├── PRODUCT_SCOPE.md
├── UI_SPEC.md
├── DATA_AND_INTERACTION_SPEC.md
├── IMPLEMENTATION_PLAN.md
├── ACCEPTANCE_CHECKLIST.md
├── references/
└── prompts/
    ├── 00_REPOSITORY_ANALYSIS.md
    ├── 01_VISUAL_BASELINE.md
    ├── 02_COMPONENT_REFACTOR.md
    ├── 03_INTERACTIONS.md
    ├── 04_DATA_INTEGRATION.md
    └── 05_VISUAL_QA.md
```

`PRODUCT_SCOPE.md` may be omitted only when the page is trivial and its scope is fully governed by an existing current feature document. The page `README.md` must state the reason.

## Shared documentation

Do not copy shared rules into every page package.

Shared authority remains:

```text
docs/ui/README.md
docs/ui/YUTA_FRONTEND_RULES.md
packages/ui/src/index.ts
packages/ui/src/styles/global.css
```

Page documents link to these sources rather than reproducing the component export catalog or design-token implementation.

## Required file responsibilities

### `README.md`

Contains:

- page name and route;
- target application;
- current implementation status;
- authority order;
- page documents;
- references;
- prompt execution order;
- important stop conditions.

### `PRODUCT_SCOPE.md`

Contains:

- user goal;
- current approved capabilities;
- out-of-scope capabilities;
- current product and domain boundaries;
- proposed capabilities requiring separate approval;
- relationships with other features.

### `UI_SPEC.md`

Contains:

- current visual and behavioral baseline;
- page hierarchy;
- content structure;
- French UI copy;
- responsive behavior;
- accessibility;
- visual acceptance;
- intentional deviations from mockups.

It must not describe unsupported persistence as if it already exists.

### `DATA_AND_INTERACTION_SPEC.md`

Contains:

- mapping from current domain fields to UI fields;
- current interactions;
- current mutations and permissions;
- validation;
- pending, error, success, and recovery states;
- tenant, establishment, locale, and timezone boundaries;
- explicit gaps requiring product/schema decisions.

A UI model is not a database schema.

### `IMPLEMENTATION_PLAN.md`

Uses six phases but adapts them to route maturity.

For a new route, Phase 1 may use typed fixture data.

For an existing integrated route, Phase 1 improves the visual baseline in place and must preserve working authorization, loading, data access, mutations, and tests.

### `ACCEPTANCE_CHECKLIST.md`

Covers:

- repository and tenant boundaries;
- product scope;
- visual structure;
- current behavior preservation;
- responsive layout;
- accessibility;
- truthful states;
- documentation;
- exact repository checks;
- browser evidence.

### `references/`

Contains page-specific visual evidence only.

Global shell or brand references belong in:

```text
docs/ui/references/
```

Each reference must be described in the page `README.md`. Images are non-authoritative.

### `prompts/`

Contains one focused instruction per phase. Do not replace these with one large `CODEX_PROMPT.md`.

## Existing-route rule

Before producing implementation prompts, determine whether the route already exists.

When it exists and is integrated:

- do not instruct Codex to recreate it from fixture data;
- do not discard working forms, authorization, or server actions;
- require current-page screenshots before editing;
- preserve current domain behavior;
- treat unsupported mockup fields as proposals;
- separate visual improvement from data-model extension.

## New-route rule

When the route does not exist:

- inspect current route and shell conventions first;
- define product scope before persistence;
- typed fixtures may establish the visual baseline;
- do not add contracts, permissions, or schema fields before mapping and approval.

## Reference-image rule

A generated or supplied image may guide:

- hierarchy;
- density;
- proportions;
- spacing;
- visual tone.

It must not define:

- navigation;
- permission;
- route ownership;
- domain fields;
- database shape;
- mutation behavior;
- unsupported modules;
- exact colors.

## Verification before delivery

Before delivering a ZIP:

1. list every archive entry;
2. confirm the first entries begin with `docs/ui/pages/<page-slug>/`;
3. confirm all required files exist;
4. confirm there is no outer wrapper directory;
5. confirm page references are inside the page package;
6. confirm shared documents are not duplicated;
7. confirm the prompts distinguish new and existing route behavior;
8. confirm the package uses current repository command names;
9. report any intentionally omitted file.

## Updating an existing page package

Update the stable directory in place.

The update must identify:

- files changed;
- product decisions changed;
- references replaced;
- prompts affected;
- documentation links that Codex must update.

Git history records prior versions.
