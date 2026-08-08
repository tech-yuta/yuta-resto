# Acceptance Checklist

## Pack and repository compliance

- [ ] Root and applicable nested `AGENTS.md` were read.
- [ ] `docs/CURRENT_STATE.md`, `docs/ui/README.md`, `docs/ui/YUTA_FRONTEND_RULES.md`, `docs/ui/BACKOFFICE_FRONTEND_RULES.md`, and `docs/ui/PAGE_PACK_PROTOCOL.md` were read.
- [ ] Prompt 00 classified the page as `NEW_PAGE` or `EXISTING_PAGE` before code changes.
- [ ] Exact repository paths and available commands were reported before implementation.
- [ ] The existing application shell and centralized navigation source remain unchanged unless separately approved.
- [ ] No screenshot-only module or navigation item was added.
- [ ] No raw brand color was sampled and hardcoded from the mockup.
- [ ] No second UI/component system was introduced.

## Existing-page protection

When classified `EXISTING_PAGE`:

- [ ] Existing authorization is preserved.
- [ ] Existing organization/establishment scoping is preserved.
- [ ] Existing loaders and real data are preserved; no fixture replacement occurred.
- [ ] Existing mutations and cache invalidation are preserved.
- [ ] Existing validation and error behavior are preserved.
- [ ] Existing tests remain valid or were updated only for approved behavior.

## Product scope

- [ ] The page manages only approved establishment general-information concepts.
- [ ] Weekly service periods, menus, table configuration, booking rules, and
      unrelated modules were not added.
- [ ] No customer-order, payment, invoicing, checkout, or cash-management capability was introduced.
- [ ] Unsupported mockup capabilities are recorded as proposals rather than silently implemented.
- [ ] No new field, enum, permission, contract, API route, server action, or database schema was inferred from the image.

## Header and layout

- [ ] Route `/etablissement/informations-generales` uses the current back-office route convention.
- [ ] H1 is `Informations générales` or the current approved French copy.
- [ ] Subtitle follows the approved page intent.
- [ ] Header actions follow current repository patterns.
- [ ] Completion is not hardcoded and is omitted when no approved capability exists.
- [ ] Desktop uses the intended primary-form/preview hierarchy.
- [ ] Section cards, numbering, spacing, density, and proportions align materially with the reference.

## Form sections

- [ ] Identity, coordinates, public information, and languages/service modes are clearly grouped.
- [ ] Field labels and required states come from current approved validation/contracts.
- [ ] Counters appear only for current approved limits.
- [ ] Logo interaction uses existing media infrastructure or is clearly non-functional in a new-page visual fixture.
- [ ] Address verification appears only when an approved capability exists.
- [ ] Public-visibility controls map to current approved fields.
- [ ] Language and service-mode controls use existing identifiers and labels.

## Public preview

- [ ] Preview reflects supported local form values without persisting them.
- [ ] Empty/hidden rows are not rendered.
- [ ] Description is rendered safely as text.
- [ ] Cover editing was not added.
- [ ] External preview uses an existing route/modal or is safely omitted/disabled.
- [ ] Preview layout follows the approved visual hierarchy.

## Data, authorization, and security

- [ ] Active organization and establishment are resolved through trusted server context.
- [ ] Reads/writes remain scoped to the required organization and establishment.
- [ ] Direct requests cannot bypass read-only or edit permissions.
- [ ] Existing DTO/repository/action patterns are reused.
- [ ] Private contact values are not exposed publicly without current business rules.
- [ ] Contact data is not logged unnecessarily.
- [ ] No external provider was added.

## Interactions and states

- [ ] Dirty-state and save behavior follow current form conventions.
- [ ] Save cannot duplicate-submit.
- [ ] Failed saves preserve unsaved input.
- [ ] Successful saves apply canonical values and reset dirty state.
- [ ] Loading, load-error, read-only, saving, success, failure, and missing-establishment states are handled.
- [ ] Upload progress/failure is handled when upload exists.
- [ ] Keyboard and focus behavior are complete.

## Responsive and accessibility

- [ ] Browser evidence exists at 1440, 1024, 768, and 390 px widths.
- [ ] No viewport has horizontal overflow.
- [ ] Header actions remain reachable.
- [ ] Form grids, chips, service-mode cards, and preview reflow correctly.
- [ ] Exactly one H1 exists.
- [ ] Every control has a programmatic label.
- [ ] Required/error state is not conveyed by color alone.
- [ ] Focus order follows visual order and focus indicators are visible.
- [ ] Selected service modes are distinguishable beyond color.
- [ ] Decorative icons do not duplicate accessible names.

## Validation and delivery

- [ ] Only commands verified in the repository were run.
- [ ] `pnpm docs:check` passed when present.
- [ ] `pnpm format:check` passed when present.
- [ ] `pnpm architecture:check` passed when present.
- [ ] `pnpm -r --if-present typecheck` passed.
- [ ] Relevant `@yuta/backoffice` tests passed when present.
- [ ] `@yuta/backoffice` build passed when applicable.
- [ ] Lint is reported only when an actual lint script was found and executed.
- [ ] Screenshot differences were classified and Critical/Major issues fixed.
- [ ] Final report lists files changed, commands/results, known deviations, and proposals requiring approval.
