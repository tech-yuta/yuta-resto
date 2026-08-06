# Codex Prompt — Phase 1: Visual Baseline

Improve the existing `/establishment/hours-services` route in place.

Use the approved Phase 0 report and the current page package.

Preserve:

- authenticated Backoffice shell;
- trusted tenant and establishment scope;
- `booking.settings.manage`;
- server boundaries;
- current data loading;
- current service-period, settings, and exception mutations;
- current validation;
- current exception kinds;
- current tests.

Improve only the approved visual baseline:

- page hierarchy;
- today summary based on persisted data;
- weekly schedule as dominant content;
- supporting summaries as a narrower secondary region;
- current service-field readability;
- responsive stacking;
- semantic-token consistency;
- accessibility-visible states.

Do not:

- replace the route with fixture data;
- add a day-level switch without persistence semantics;
- add per-service reservation windows, last arrival, or duration;
- add `OPEN_EXCEPTIONALLY`;
- add copy-day persistence;
- change contracts, permissions, schema, shell, or unrelated routes;
- copy raw colors or navigation from references.

Capture 1440, 1024, 768, and 390 px evidence.

Run current docs, format, architecture, typecheck, test, build, and relevant booking checks. Do not report lint as passed.
