# Public Web Agent Instructions

`apps/web` is the public YUTA website and an approved public cloud boundary.
User-facing content is French.

- Describe implemented capabilities accurately; label pilot, planned, and
  unavailable behavior.
- Do not invent customers, testimonials, certifications, ratings, prices,
  legal details, performance claims, or endorsements.
- Preserve canonical URLs, metadata, sitemap, robots, Open Graph, and JSON-LD.
- Resolve tenant context on the server and fail closed for unknown, disabled,
  or mismatched mappings. A route slug alone is not authorization proof.
- Client code never imports `@yuta/db-cloud`, database drivers, secrets, or
  server environment modules.
- Validate public input, minimize personal data, and apply documented abuse
  protection.
- Reuse `@yuta/ui` and preserve responsive, accessible navigation.

Validate with `pnpm architecture:check`, the web typecheck/build, and affected
contract, tenant, core, or database tests.
