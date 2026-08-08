# Establishment general information

Status: Current implemented page package

Visibility: Engineering

Owner: YUTA product and engineering

Last updated: 2026-08-08

Route: `/etablissement/informations-generales`

Application: `apps/backoffice`

## Current status

The authenticated route is an establishment-scoped editor backed by the
canonical profile fields on `establishments`. OWNER and MANAGER memberships may
edit; STAFF memberships have read-only access. The page provides explicit save,
field validation, loading and error states, visibility controls, supported
language and service-mode selections, and a local unsaved-value preview.

Weekly service periods are managed independently under
`/etablissement/horaires-services`.

General profile ownership includes identity, structured address, primary and
public contacts, website, description, logo and cover URLs, languages, service
modes, and public visibility. Booking settings retain booking-only rules,
welcome copy, and booking policy.

The migration copies legacy public contact, address, logo, and cover values from
`booking_settings` before removing those columns. Public booking continues to
read the canonical establishment profile and respects its visibility settings.

## Intentional reference deviations

- Media is edited as validated HTTP(S) URLs because no approved upload/storage
  lifecycle exists.
- Address verification is omitted because there is no approved geocoding
  provider.
- The preview is local and read-only; no separate public establishment-profile
  route is claimed.
- Completion is derived locally from current supported fields and is not stored.

## Authority

Read root and Backoffice instructions, current architecture and product docs,
the implemented schema/contracts/repositories,
`docs/ui/YUTA_FRONTEND_RULES.md`,
`docs/ui/BACKOFFICE_FRONTEND_RULES.md`, this package, then the visual reference.
The image controls hierarchy and visual direction only.

## Documents

- [`PRODUCT_SCOPE.md`](PRODUCT_SCOPE.md)
- [`UI_SPEC.md`](UI_SPEC.md)
- [`DATA_AND_INTERACTION_SPEC.md`](DATA_AND_INTERACTION_SPEC.md)
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- [`ACCEPTANCE_CHECKLIST.md`](ACCEPTANCE_CHECKLIST.md)

## References

- [`references/establishment-general-information-desktop-reference.png`](references/establishment-general-information-desktop-reference.png)
- [`references/README.md`](references/README.md)
- [`../../references/yuta-shell-brand-reference.png`](../../references/yuta-shell-brand-reference.png)

## Prompt order

The prompts under `prompts/` remain the phased maintenance workflow. The route
is `EXISTING_PAGE`; fixture replacement is forbidden.

## Stop conditions

Stop for approval before adding a storage/geocoding provider, public profile
route, new service-mode value, or changing profile ownership or role policy.
