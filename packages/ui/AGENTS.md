# UI Package Instructions

`@yuta/ui` is the only shared component system. Components are accessible,
business-domain neutral, use named exports, preserve refs/native attributes,
keyboard behavior, focus visibility, and accessible names, and keep product
copy outside the package where possible.

Use semantic YUTA tokens, `cn()` for conditional classes, existing Radix
primitives, typed variants, and `lucide-react`. Do not introduce another UI
framework, hard-coded feature colors, application/database/provider imports, or
inline styles except for genuinely dynamic runtime values.

Before adding a component, search existing exports and usage. Export new public
components from `src/index.ts`; it is the authoritative catalog, so do not
duplicate the list in instruction files. Validate the UI typecheck and affected
consuming applications.
