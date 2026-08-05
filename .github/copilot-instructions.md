# YUTA Copilot Instructions

Follow, in order:

1. `/AGENTS.md`
2. `/docs/README.md` and `/docs/CURRENT_STATE.md`
3. the nearest nested `AGENTS.md`
4. the relevant current architecture, feature, local-product, or operations
   document
5. current code and tests as implementation evidence

Keep cloud, POS, and Display runtime/database boundaries separate. Local
products are maintained monorepo components, not legacy code.

Respect the public-product visibility rule in `/AGENTS.md`: local operational
workflows may be documented technically but must not be presented as public
YUTA service capabilities.

Use `@yuta/ui`, semantic tokens, and `lucide-react`. Inspect
`packages/ui/src/index.ts` for the authoritative public export list; do not
duplicate that catalog here.

Before completion, run relevant validation commands, update current
documentation, and report any command not run.
