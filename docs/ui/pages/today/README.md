# Today dashboard

Status: Current implemented page package

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-06

Route: `/aujourdhui`

Application: `apps/backoffice`

## Current status

The route is integrated inside the authenticated Backoffice shell. Its Server
Component composes establishment-scoped reservations, booking service periods
with dated exceptions, and entitled reputation feedback from current cloud
repositories. Each section has independent ready, empty, unavailable, and,
where applicable, hidden states.

The former fixture-only dashboard component and its unsupported financial and
placeholder modules have been removed.

The current repository provides real, establishment-scoped sources for:

- reservations;
- booking service periods and settings;
- reputation feedback when the entitlement is enabled;
- authenticated user, organization, establishment, locale, timezone, role, and
  entitlement context.

Daily tasks, team planning, content approval, and generic email workflows still
do not have current dashboard-ready domain implementations and are intentionally
absent from the route.

## Authority

Read in this order:

1. root and `apps/backoffice/AGENTS.md`;
2. `docs/CURRENT_STATE.md` and current feature documentation;
3. current contracts, persistence, permissions, route code, and tests;
4. `docs/ui/README.md`, `docs/ui/YUTA_FRONTEND_RULES.md`, and
   `docs/ui/PAGE_PACK_PROTOCOL.md`;
5. this page package;
6. visual references.

The image is visual evidence only. It does not authorize modules, fields,
navigation, persistence, or permissions.

## Documents

- [`PRODUCT_SCOPE.md`](PRODUCT_SCOPE.md)
- [`UI_SPEC.md`](UI_SPEC.md)
- [`DATA_AND_INTERACTION_SPEC.md`](DATA_AND_INTERACTION_SPEC.md)
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- [`ACCEPTANCE_CHECKLIST.md`](ACCEPTANCE_CHECKLIST.md)

## References

- [`references/today-dashboard-approved.png`](references/today-dashboard-approved.png)
  — approved hierarchy, proportions, density, and visual tone.
- [`references/README.md`](references/README.md) — reference interpretation and
  integrity data.
- [`../../references/yuta-shell-brand-reference.png`](../../references/yuta-shell-brand-reference.png)
  — shared shell and brand direction.

## Prompt order

1. `prompts/00_REPOSITORY_ANALYSIS.md`
2. `prompts/01_VISUAL_BASELINE.md`
3. `prompts/02_COMPONENT_REFACTOR.md`
4. `prompts/03_INTERACTIONS.md`
5. `prompts/04_DATA_INTEGRATION.md`
6. `prompts/05_VISUAL_QA.md`

Review each phase before starting the next. Phases may be delivered in one
coherent change only when explicitly authorized, and no delivery may leave
fabricated production dashboard values behind.

## Stop conditions

Stop for approval before adding a new module, schema field, permission,
contract, mutation, integration, navigation item, analytics provider, or
polling/realtime mechanism.
