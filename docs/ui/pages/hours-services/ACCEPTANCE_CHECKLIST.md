# Horaires & services — Acceptance Checklist

## Documentation package integrity

- [ ] The current package lives at `docs/ui/pages/hours-services/`.
- [ ] No superseded flat page specification remains under `docs/ui/pages/`.
- [ ] The desktop reference lives inside the page package.
- [ ] Shared shell reference remains under `docs/ui/references/`.
- [ ] `docs/README.md` links are updated.
- [ ] No `v2`, `new`, `final`, or completion report is added.

## Repository and security

- [ ] Root and Backoffice `AGENTS.md` were read.
- [ ] Current public-booking docs were read.
- [ ] Existing route is improved in place.
- [ ] Trusted organization and establishment context is preserved.
- [ ] `booking.settings.manage` is preserved.
- [ ] `@yuta/db-cloud` remains server-side.
- [ ] No browser-provided tenant scope is trusted.
- [ ] No unrelated route or shell behavior changes.

## Product scope

- [ ] Current service-period fields remain authoritative.
- [ ] Global booking settings remain on
      `/reservations/parametres` and are not duplicated here.
- [ ] Current exception kinds remain authoritative.
- [ ] No distinct opening-exception kind is invented.
- [ ] No per-service reservation window is persisted.
- [ ] No per-service last-arrival field is persisted.
- [ ] No per-service duration is persisted.
- [ ] No empty-day switch semantics are invented.
- [ ] No copy-day semantics are invented.

## Shared UI

- [ ] `@yuta/ui` components are reused.
- [ ] Semantic tokens are used.
- [ ] `lucide-react` is used.
- [ ] No second UI or icon library is added.
- [ ] No raw hex color is copied from references.
- [ ] No duplicate public component catalog is documented.
- [ ] Page-specific components remain near the route.
- [ ] Server Components remain the default.

## Visual structure

- [ ] Current Backoffice shell remains unchanged.
- [ ] The editable seven-day weekly schedule appears only on this route.
- [ ] Service-period create/delete mutations require
      `booking.settings.manage`.
- [ ] Supporting summaries are secondary.
- [ ] All seven weekdays remain readable.
- [ ] Open and closed state includes text.
- [ ] Current service fields remain readable.
- [ ] Public preview uses persisted schedules.
- [ ] Current exception kinds are represented truthfully.
- [ ] Primary actions describe their actual mutation scope.
- [ ] Intentional mockup deviations are reported.

## Interactions and states

- [ ] Current create and delete actions work.
- [ ] Deletion requires confirmation.
- [ ] Pending state prevents duplicate submission.
- [ ] Validation errors remain associated with fields or forms.
- [ ] Save errors preserve recoverable context.
- [ ] Persisted success is communicated truthfully.
- [ ] Retry behavior exists where applicable.
- [ ] Dialog focus is managed.
- [ ] Irrelevant exception fields are not submitted.

## Time and locale

- [ ] Establishment locale is used.
- [ ] Establishment timezone is used.
- [ ] Canonical repository time representation is preserved.
- [ ] Exception dates remain local calendar dates.
- [ ] No UTC conversion changes the intended exception date.

## Responsive and accessibility

- [ ] 1440 px checked.
- [ ] 1024 px checked.
- [ ] 768 px checked.
- [ ] 390 px checked.
- [ ] No horizontal page overflow.
- [ ] Supporting cards stack correctly.
- [ ] Service data uses readable responsive presentation.
- [ ] Primary actions are not clipped.
- [ ] Disclosures are keyboard accessible.
- [ ] Visible focus is preserved.
- [ ] Icon-only actions have accessible names.
- [ ] Status does not rely on color alone.
- [ ] Touch targets remain usable.

## Verification

- [ ] `pnpm docs:check`
- [ ] `pnpm format:check`
- [ ] `pnpm architecture:check`
- [ ] `pnpm --filter @yuta/backoffice typecheck`
- [ ] `pnpm --filter @yuta/backoffice test`
- [ ] `pnpm --filter @yuta/backoffice build`
- [ ] Relevant booking tests
- [ ] Relevant tenant and authorization tests
- [ ] Relevant contract and cloud-database tests when affected
- [ ] Browser console checked
- [ ] Hydration errors checked
- [ ] Screenshots attached
- [ ] No lint result is claimed unless a real lint command exists
