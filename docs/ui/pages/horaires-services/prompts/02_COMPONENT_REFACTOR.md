# Codex Prompt — Phase 2: Component Refactor

Refactor the approved `/establishment/hours-services` visual baseline without changing behavior.

Requirements:

- keep page-specific components near the route;
- reuse `@yuta/ui`;
- use `lucide-react`;
- keep Server Components by default;
- isolate minimal client boundaries;
- preserve authorization, loading, mutations, validation, and error handling;
- use existing native or composed disclosure behavior when no shared export exists;
- do not create wrapper-only components;
- do not move components into `@yuta/ui` without proven independent reuse;
- do not modify unrelated files.

Provide before and after screenshots, files changed, component boundaries, commands, exact results, and remaining deviations.
