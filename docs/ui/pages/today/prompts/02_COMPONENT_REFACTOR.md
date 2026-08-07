# Codex prompt — Phase 2: Component refactor

Refactor the reviewed `/aujourdhui` baseline without expanding product behavior.

Requirements:

- keep the page as a Server Component by default;
- isolate only necessary menus or filters as client boundaries;
- keep page-specific components near the route;
- reuse current shared primitives;
- keep domain logic outside presentational components;
- remove the fixture-only dashboard component after verifying all consumers;
- preserve shell, authentication, tenant scope, states, and visual output;
- do not create wrapper-only components or move components into `@yuta/ui`
  without proven independent reuse;
- do not modify unrelated routes.

Report component boundaries, files changed, evidence, commands, and remaining
risks.
