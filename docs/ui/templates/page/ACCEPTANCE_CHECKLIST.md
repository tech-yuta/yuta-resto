# <Page name> — Acceptance Checklist

## Repository and scope

- [ ] Root and application instructions were read.
- [ ] Current feature documentation was read.
- [ ] Product scope is preserved.
- [ ] Tenant and establishment boundaries are preserved.
- [ ] No unsupported module is introduced.

## UI

- [ ] Existing shell is reused.
- [ ] `@yuta/ui` is reused.
- [ ] Semantic tokens are used.
- [ ] `lucide-react` is used.
- [ ] No raw colors are copied from references.
- [ ] No duplicate shared primitive is created.

## Behavior

- [ ] Current authorization is preserved.
- [ ] Current loading and mutations are preserved for existing routes.
- [ ] Unsupported mockup concepts remain proposals.
- [ ] Destructive behavior is confirmed.
- [ ] Validation is truthful.
- [ ] Save errors preserve input.

## Responsive and accessibility

- [ ] 1440 px checked.
- [ ] 1024 px checked.
- [ ] 768 px checked.
- [ ] 390 px checked.
- [ ] No horizontal overflow.
- [ ] Keyboard and focus behavior work.
- [ ] Status includes text.
- [ ] Icon-only controls have accessible names.

## Verification

- [ ] `pnpm docs:check`
- [ ] `pnpm format:check`
- [ ] `pnpm architecture:check`
- [ ] Backoffice typecheck
- [ ] Backoffice tests
- [ ] Backoffice build
- [ ] Relevant domain tests
- [ ] Browser evidence attached
- [ ] No lint result is claimed unless a real lint command exists
