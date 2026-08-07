# Codex prompt — Phase 1: Visual baseline

Improve the approved `/aujourdhui` visual baseline in place using the reviewed Phase
0 report and current page package.

Preserve:

- authenticated Backoffice shell and tenant selector;
- server-derived tenant context;
- current routes, entitlements, and permissions;
- French Backoffice copy conventions;
- `@yuta/ui`, semantic tokens, and `lucide-react`.

Implement the approved hierarchy for supported content only:

- local date and greeting;
- reservation, booking-service, and conditional review summaries;
- dominant reservation section;
- secondary booking-service and review sections;
- responsive stacking and truthful states.

Do not add tasks, team, email, content approval, financial content, table/phone
fields, cut-off/last-arrival fields, new navigation, contracts, permissions,
schema, dependencies, or production fixture values.

Use development-only fixture data solely for isolated visual tests when needed.
Do not leave fabricated values on the production route. Capture relevant
desktop, tablet, and mobile evidence and report intentional omissions.
