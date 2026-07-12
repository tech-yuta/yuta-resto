# AGENTS.md — YuTa Monorepo

## Workspace Overview

This is the YuTa internal restaurant tool monorepo.

```
apps/admin          — Admin dashboard (port 3001)
apps/web            — Public web app (port 3000)
apps/yuta-display   — Digital signage display (port 3002)
apps/yuta-pos       — Internal restaurant POS (planned)
packages/db         — Shared database package for YuTa ecosystem apps
packages/core       — Shared business logic, tool registry
packages/ui         — Shared UI component library (@yuta/ui)
```

Future apps may include: `yuta-staff`, `yuta-reservation`, `yuta-crm`.

`apps/yuta-display` is intentionally separate from the main YuTa operations
ecosystem and keeps its own database setup. New operations apps such as
`apps/yuta-pos` should use the shared `packages/db` package.

---

## UI Law — Mandatory for All Apps

### Single UI source

All apps MUST use `@yuta/ui` (`packages/ui`).

NEVER introduce MUI, Ant Design, Chakra UI, Mantine, or any other component library.

### Design tokens

Use semantic Tailwind CSS token classes. Never use raw hex values in `className` or `style={{}}`. Core UI components must use role-based tokens, not product/story color names.

| Token family | Purpose |
| ------------- | ------- |
| `brand-*` | Brand palette foundation |
| `neutral-*` | Neutral palette foundation |
| `bg-canvas` | Page background |
| `bg-surface` | Default card, panel, input surface |
| `bg-surface-muted` | Subtle backgrounds and hover states |
| `bg-surface-selected` | Selected or brand-tinted soft surface |
| `text-primary` | Primary text |
| `text-secondary` | Secondary text |
| `text-muted` | Muted text |
| `text-inverse` | Text on dark or solid backgrounds |
| `border-border-default` | Default borders and dividers |
| `border-border-strong` | Stronger borders |
| `bg-action-primary` | Primary action background |
| `bg-action-danger` | Destructive action background |
| `ring-focus-ring` | Focus rings |
| `status-*` | Success, warning, danger, and info states |

### Available `@yuta/ui` components

```
Button       - variants: primary | secondary | outline | ghost | danger | success
              sizes: sm | md | lg
              props: loading | fullWidth | asChild
IconButton   - icon-only action button with Button variants and sizes
Badge        - tones: neutral | brand | success | warning | danger | info
              variants: soft | outline | solid
              sizes: sm | md
StatusBadge  - semantic order/status badge with icon
Avatar      - image/fallback avatar
AvatarGroup - stacked avatar group
Card         - container with border + shadow-sm
              variants: default | muted | canvas | inverse
              padding: default | none | sm | lg
              radius: default | sm | lg
Input        - styled text/number/email/etc input
              sizes: sm | md | lg
              align: left | center | right
Label        - form label
Textarea     - styled textarea
FormField    - label/content/hint/error form wrapper
FieldError   - field-level error text
FieldHint    - field-level helper text
FormSection  - grouped form section with title/description
Select       - SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup
Checkbox     - Radix UI checkbox, use Controller from react-hook-form
RadioGroup   - RadioGroup and RadioGroupItem
Switch       - Radix UI switch
Tabs         - Tabs, TabsList, TabsTrigger, TabsContent
Dialog       - DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
ConfirmDialog - controlled confirmation dialog for destructive/primary confirms
DropdownMenu - menu, item, checkbox/radio item, label, separator, shortcut, submenu
Popover      - PopoverTrigger, PopoverContent, PopoverAnchor
Tooltip      - TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
Alert        - Alert, AlertTitle, AlertDescription
Progress     - accessible progress bar
Skeleton     - loading placeholder
LoadingOverlay - absolute loading overlay for async panels
ErrorState   - standardized error state block
SimpleTable  - table primitives for compact admin data
DataTable    - typed table with loading and empty states
Pagination   - previous/next pagination control
FilterBar    - search/filter/action toolbar
SearchInput  - tokenized search input
BulkActionBar - selected-row action toolbar
OrderCard    - POS order summary card
OrderItemRow - POS order item row
PaymentSummary - payment/totals summary panel
KitchenTicket - grouped kitchen ticket
KitchenItemStatus - kitchen item status badge
TableCard    - restaurant table status card
Separator    - horizontal/vertical divider
MetricCard   - compact label/value metric block
StatCard     - metric card with optional icon, helper, and sparkline
ActionPanel  - framed action block with optional icon, title, description
PageHeader   - standard page header with optional media/actions
Panel        - card section with optional header, action, description, and body
PanelHeader  - reusable panel header
ListRow      - standard row with media, title, description, meta, and action
IconTile     - tones: neutral | brand | success | warning | info | danger | inverse
EmptyState   - centered empty-state block with icon, title, description, action
AppShell     - fixed-height app shell with sidebar slot
AppSidebar   - fixed app sidebar with independent nav scroll
              includes AppSidebarHeader and AppSidebarFooter
AppTopbar    - top application bar with search/actions slots
AppMain      - independently scrolling main content region
AppFooter    - compact fixed footer bar
SegmentedNav - horizontal segmented navigation container
Toaster      - toast via sonner
cn()         - utility: clsx + tailwind-merge
```

### Icons

Use `lucide-react` only. Never `@mui/icons-material`.

### CSS setup per app

`globals.css` must start with:

```css
@import '@yuta/ui/styles/global.css';
```

`postcss.config.mjs` must contain:

```js
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
```

### Maintenance

Whenever a component is added, renamed, or removed from `packages/ui/src/`, the agent MUST update:

- The component list in this file (`AGENTS.md`)
- The component list in `.github/copilot-instructions.md`

Both files must always reflect the actual exports of `packages/ui`.

---

## General Rules

### Language

- Code, comments, types, variable names, commit messages: **English**
- UI text per app: see app-specific AGENTS.md (e.g., French for `yuta-display`)

### Tech stack

```
Next.js App Router (no Pages Router)
React 19
TypeScript (strict mode)
Tailwind CSS 4
```

### Exports

Named exports only. No default exports.

### Components

- PascalCase filenames and component names
- Prefer Server Components
- Use `'use client'` only when interactivity is required

### TypeScript

- Strict mode enabled
- No `any`
- Validate external input with Zod

### State management

No Redux, MobX, or Zustand unless explicitly added. Use React state and Server Components.

### Documentation maintenance

Whenever an agent changes app behavior, user flows, routes, setup commands,
deployment behavior, database behavior, or operational rules, the agent MUST
update the relevant docs in the same change.

For POS-related work, keep these docs current:

- `docs/POS_USER_GUIDE.md` for operator-facing usage flows.
- `docs/YUTA_POS.md` for POS architecture, scope, and implementation notes.
- `docs/LOCAL_DATABASE.md` for local database setup changes.
- `docs/DEPLOYMENT.md` for production or Docker deployment changes.

Do not rely on memory for newly added behavior. Document important decisions
such as cancellation/restore rules, print job behavior, payment behavior,
admin workflows, and known MVP limits when they change.

---

## Deployment Rules

Shared production deployment conventions live in:

```txt
docs/DEPLOYMENT.md
```

All new YuTa apps with Docker deployment must follow those conventions unless
the user explicitly requests a different production topology.

Key defaults:

- Production apps use the existing PostgreSQL container `luna-postgres`.
- Production apps join the external Docker network `postgres_default`.
- Use Docker hostnames in `DATABASE_URL`, never container IP addresses.
- Keep production env files next to the app as `apps/<app-name>/.env.production`.
- Run Docker Compose from the repository root with `--env-file` and `-f`.
- Use a one-shot `migrate` service for database migrations.
- Run migrations with `--build` so the latest migration files are included.
- For runtime uploads, keep folders with `.gitkeep` and ignore uploaded media.
- If uploaded files return `404` in Next.js standalone mode, add a `GET` route
  that serves files from `UPLOAD_DIR`.
