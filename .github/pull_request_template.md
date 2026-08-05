## Goal

<!-- What user or system outcome does this PR deliver? -->

## Scope

<!-- Paths and behavior intentionally changed, plus relevant out-of-scope work. -->

## Architecture and security

- [ ] Cloud, POS, and display database ownership remains separated.
- [ ] Tenant-owned reads and mutations include organization scope.
- [ ] Establishment-owned data additionally includes establishment scope.
- [ ] Browser input is not trusted for identity, role, permission, or scope.
- [ ] No client module imports persistence, drivers, secrets, or server env code.
- [ ] Public product copy does not promote local operational workflows as YUTA public services.
- [ ] No stable seed password, PIN, token, or production-like credential is documented.
- [ ] No speculative package, table, route, or framework was introduced.
- [ ] `pnpm architecture:check` passes.

## Validation

- [ ] Relevant type-checks pass.
- [ ] Relevant unit/integration tests pass.
- [ ] Relevant application builds pass.
- [ ] New or changed failure paths are covered.

```text
Commands:
Results:
```

## Documentation

- [ ] No documentation change is required, or current documentation was updated.
- [ ] Old or superseded documentation was removed only after durable rules were preserved.

## Screenshots

<!-- Required for meaningful UI changes. -->
