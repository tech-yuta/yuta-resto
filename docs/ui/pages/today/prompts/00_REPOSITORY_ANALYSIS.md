# Codex prompt — Phase 0: Repository analysis

Analyze the existing authenticated `/aujourdhui` route without modifying files.

Read:

- root and `apps/backoffice/AGENTS.md`;
- `docs/README.md` and `docs/CURRENT_STATE.md`;
- current booking and reputation documentation;
- `docs/ui/README.md`, `docs/ui/YUTA_FRONTEND_RULES.md`,
  `docs/ui/BACKOFFICE_FRONTEND_RULES.md`, and `docs/ui/PAGE_PACK_PROTOCOL.md`;
- every document in `docs/ui/pages/today/`;
- current route, shell, fixture dashboard, repositories, permissions, and tests.

Inspect the reference image and report:

1. current route maturity and component tree;
2. fixture content that must be removed;
3. trusted tenant, entitlement, and permission boundaries;
4. exact reservation, booking-service, and review sources;
5. unsupported reference modules and fields;
6. shared primitives and semantic tokens to reuse;
7. proposed files to change;
8. relevant commands and tests;
9. browser access or authentication limitations.

Do not write code, create files, change dependencies, or infer new modules.
Stop after the report.
