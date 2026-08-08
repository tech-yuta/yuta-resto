# Horaires & services

Status: Current design package for an existing integrated route

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-07

Route: `/etablissement/horaires-services`

Application: `apps/backoffice`

## Current status

This route already exists and is integrated.

It:

- runs inside the authenticated Backoffice shell;
- uses trusted booking tenant context;
- requires `booking.settings.manage`;
- loads establishment-scoped booking administration data from `@yuta/db-cloud`;
- uses establishment locale and timezone;
- displays and edits weekly service periods;
- reads weekly service periods for today and public-preview summaries;
- displays persisted service summaries and upcoming exceptions;
- supports current exception mutations;
- creates and deletes weekly service periods through the current booking
  administration actions;
- uses `@yuta/ui`, semantic tokens, and `lucide-react`.

Global booking rules are managed on the separate integrated route
`/reservations/parametres`.

This package guides visual and interaction improvements. It must not replace the route with fixture data or discard current authorization and persistence.

## Authority

Read:

- root `AGENTS.md`;
- `docs/README.md`;
- `docs/CURRENT_STATE.md`;
- `apps/backoffice/AGENTS.md`;
- current public-booking documentation;
- `docs/ui/README.md`;
- `docs/ui/YUTA_FRONTEND_RULES.md`;
- this package;
- the current route implementation and tests.

## Documents

- `PRODUCT_SCOPE.md`
- `UI_SPEC.md`
- `DATA_AND_INTERACTION_SPEC.md`
- `IMPLEMENTATION_PLAN.md`
- `ACCEPTANCE_CHECKLIST.md`

## References

- `references/desktop.png` — approved visual direction for hierarchy, proportions, and density.
- `../../references/yuta-shell-brand-reference.png` — shared YUTA shell and brand direction.

References are non-authoritative. Do not copy their navigation, sample modules, unsupported fields, or colors.

## Prompt order

1. `prompts/00_REPOSITORY_ANALYSIS.md`
2. `prompts/01_VISUAL_BASELINE.md`
3. `prompts/02_COMPONENT_REFACTOR.md`
4. `prompts/03_INTERACTIONS.md`
5. `prompts/04_DATA_INTEGRATION.md`
6. `prompts/05_VISUAL_QA.md`

Do not start a later phase before the previous phase is reviewed.

Phase 4 is required only for an approved domain extension. Current persistence must remain intact during visual work.
