# Codex Prompt — Phase 2: Component Refactor

Refactor only meaningful page-level units after the visual baseline is approved.

Preserve visual output and behavior.

Reuse shared primitives, keep page components near the route, keep Server Components by default, and isolate minimal client boundaries.

Do not create wrapper-only abstractions, move components into `@yuta/ui` without proven reuse, or modify unrelated files.

Run current checks and provide before/after browser evidence.
