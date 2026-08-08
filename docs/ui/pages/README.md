# YUTA UI Page Packages

Status: Current

Visibility: Engineering

Each active page-specific design package has one stable lowercase slug directory.

The current packages all target `apps/backoffice`. Read both
`../YUTA_FRONTEND_RULES.md` and `../BACKOFFICE_FRONTEND_RULES.md` before using
them.

Current packages:

- `hours-services/` — integrated Backoffice route `/etablissement/horaires-services`.
- `establishment-general-information/` — integrated establishment profile editor
  at `/etablissement/informations-generales`.
- `today/` — integrated authenticated Backoffice dashboard at `/aujourdhui`.

Every package follows `../PAGE_PACK_PROTOCOL.md`.

Do not add flat page specifications directly under `docs/ui/pages/`.

Do not create `v2`, `new`, `final`, or `latest` directories. Update current packages in place.
