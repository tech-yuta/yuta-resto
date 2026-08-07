# Codex prompt — Phase 4: Current data integration

Integrate only the approved current data sources for `/aujourdhui`.

Requirements:

- derive organization, establishment, user, locale, timezone, role,
  permissions, and entitlements from trusted server context;
- determine today in the establishment timezone;
- reuse `listReservations`, `getBookingAdministration`, and entitled
  `listFeedback` behavior rather than duplicating domain logic;
- enforce `booking.read` and `reputation.read` with their entitlements;
- load independent sections in parallel and isolate failures;
- represent ready, empty, hidden/forbidden, and unavailable states truthfully;
- return only fields rendered by the page;
- add focused timezone, scoping, capability, empty, and partial-failure tests;
- update current documentation in the same change.

Do not add tasks, team planning, email, content approval, new contracts, schema,
permissions, migrations, analytics, or integrations. Stop for approval if a
required view cannot be produced from current sources.
