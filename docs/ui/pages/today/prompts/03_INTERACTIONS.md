# Codex prompt — Phase 3: Approved interactions

Implement only current approved interactions on `/aujourdhui`.

Allowed scope:

- links to current reservation, booking-settings, and reviews routes;
- reservation creation through the existing route or mutation path;
- a capability-filtered add action only when real destinations exist;
- retry behavior for independently recoverable supported sections;
- keyboard, visible focus, accessible names, and focus return.

Do not implement task completion, team actions, email/content actions,
unsupported filter chips, empty overflow menus, new mutations, a new form/state
library, analytics, polling, or realtime behavior.

Test pending/error behavior when a mutation is actually used. Report exact
results and skipped checks.
