# Codex Prompt — Phase 0: Repository Analysis

Analyze the existing integrated route `/etablissement/horaires-services`.

Read:

- root `AGENTS.md`;
- `docs/README.md`;
- `docs/CURRENT_STATE.md`;
- `apps/backoffice/AGENTS.md`;
- current public-booking documentation;
- `docs/ui/README.md`;
- `docs/ui/YUTA_FRONTEND_RULES.md`;
- every document under `docs/ui/pages/hours-services/`;
- the current route implementation and tests.

Inspect:

- route and component files;
- server and client boundaries;
- tenant and establishment scope;
- `booking.settings.manage`;
- current queries and mutations;
- current Zod validation;
- current service-period read model and settings/exception mutations;
- `@yuta/ui` exports and semantic tokens;
- current browser layout at 1440, 1024, 768, and 390 px.

Report:

1. current files and component tree;
2. current behavior and mutations;
3. current domain-to-UI mapping;
4. reusable shared primitives;
5. differences from the page specifications;
6. unsupported concepts visible in references;
7. proposed files to change;
8. exact verification commands and relevant tests.

Do not modify any file. Stop after the report.
