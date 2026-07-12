# YuTa UI System — Copilot Instructions

## UI Package

All apps in this monorepo must use `@yuta/ui` (`packages/ui`) as the single source of UI components.

Do NOT introduce external UI libraries (MUI, Ant Design, Chakra UI, Mantine, etc.) into any app.

The `@yuta/ui` package is built on:

- Tailwind CSS 4
- Radix UI primitives
- `class-variance-authority` (cva)
- `clsx` + `tailwind-merge` via `cn()`

---

## Design Tokens

All color and shadow values must use semantic YuTa design tokens, never raw hex values in className. Core UI components use role-based names rather than product/story color names.

| Token family | Usage |
| ------------ | ----- |
| `brand-*` | Brand palette foundation |
| `neutral-*` | Neutral palette foundation |
| `bg-canvas` | Page background |
| `bg-surface` | Card, panel, and input surface |
| `bg-surface-muted` | Subtle backgrounds and hover states |
| `bg-surface-selected` | Selected or brand-tinted soft surface |
| `text-primary`, `text-secondary`, `text-muted`, `text-inverse` | Text roles |
| `border-border-default`, `border-border-strong` | Borders and dividers |
| `bg-action-primary`, `bg-action-danger` | Action backgrounds |
| `ring-focus-ring` | Focus rings |
| `status-*` | Success, warning, danger, and info states |
| `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg` | Elevation |

Correct:

```tsx
<div className="bg-surface-muted border-border-default text-primary">
```

Incorrect:

```tsx
<div style={{ background: '#eef1ea', border: '1px solid #dce3d9' }}>
```

---

## Components

Always import from `@yuta/ui`. Never write raw HTML input/button/label/checkbox/select/dialog when a `@yuta/ui` component exists.

Available components:

- `Button` - variants: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`; sizes: `sm`, `md`, `lg`; props: `loading`, `fullWidth`, `asChild`
- `IconButton` - icon-only action button with Button variants and sizes
- `Badge` - tones: `neutral`, `brand`, `success`, `warning`, `danger`, `info`; variants: `soft`, `outline`, `solid`; sizes: `sm`, `md`
- `StatusBadge` - semantic order/status badge with icon
- `Avatar`, `AvatarGroup` - image/fallback avatars
- `Card` - base container with border + shadow; variants: `default`, `muted`, `canvas`, `inverse`; padding: `default`, `none`, `sm`, `lg`; radius: `default`, `sm`, `lg`
- `Input` - styled text/number/etc input; sizes: `sm`, `md`, `lg`; align: `left`, `center`, `right`
- `Label` - form label
- `Textarea` - styled textarea
- `FormField`, `FieldError`, `FieldHint`, `FormSection` - form composition helpers
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`, `SelectGroup`
- `Checkbox` - Radix UI checkbox (use `Controller` from react-hook-form to integrate)
- `RadioGroup`, `RadioGroupItem`
- `Switch`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- `ConfirmDialog` - controlled confirmation dialog for destructive/primary confirms
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, submenu exports
- `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`
- `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`
- `Alert`, `AlertTitle`, `AlertDescription`
- `Progress` - accessible progress bar
- `Skeleton` - loading placeholder
- `LoadingOverlay` - absolute loading overlay for async panels
- `ErrorState` - standardized error state block
- `SimpleTable` primitives - `SimpleTable`, `SimpleTableHeader`, `SimpleTableBody`, `SimpleTableFooter`, `SimpleTableRow`, `SimpleTableHead`, `SimpleTableCell`, `SimpleTableCaption`
- `DataTable` - typed table with loading and empty states
- `Pagination` - previous/next pagination control
- `FilterBar`, `SearchInput` - search/filter/action toolbar
- `BulkActionBar` - selected-row action toolbar
- `Separator` - horizontal or vertical divider
- `MetricCard` - compact label/value metric block
- `StatCard` - metric card with optional icon, helper, and sparkline
- `ActionPanel` - framed action block with optional icon, title, description
- `PageHeader` - standard page header with optional media/actions
- `Panel`, `PanelHeader` - card section with optional header/action and reusable panel header
- `ListRow` - standard row with media, title, description, meta, and action
- `IconTile` - tones: `neutral`, `brand`, `success`, `warning`, `info`, `danger`, `inverse`
- `EmptyState` - centered empty-state block with icon, title, description, action
- `AppShell`, `AppSidebar`, `AppSidebarHeader`, `AppSidebarFooter`, `AppTopbar`, `AppMain`, `AppFooter` - app shell primitives for fixed sidebar/topbar/main/footer layouts
- `SegmentedNav` - horizontal segmented navigation container
- `Toaster` (from `sonner`) - toast notifications
- `cn()` - utility for merging Tailwind classes

Correct:

```tsx
import { Button, Input, Label, Checkbox } from '@yuta/ui';

<Label htmlFor="title">Title</Label>
<Input id="title" {...register('title')} />
<Button variant="danger" size="sm">Delete</Button>
```

Incorrect:

```tsx
<label className="text-sm font-medium ...">Title</label>
<input className="w-full rounded-lg border ..." />
<button className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 ...">Delete</button>
```

---

## Radix UI + react-hook-form

For Radix-based components (Checkbox, Select, etc.) with react-hook-form, always use `Controller`:

```tsx
import { Controller } from 'react-hook-form';
import { Checkbox } from '@yuta/ui';

<Controller
  name="isActive"
  control={control}
  render={({ field }) => (
    <Checkbox
      checked={field.value}
      onCheckedChange={(checked) => field.onChange(!!checked)}
    />
  )}
/>;
```

---

## Styling Rules

Use Tailwind CSS utility classes only. Do not write inline `style={{}}` props unless absolutely necessary (e.g., dynamic runtime values).

Use `cn()` when merging conditional classes:

```tsx
import { cn } from '@yuta/ui';
<div
  className={cn('base-class', condition && 'conditional-class', className)}
/>;
```

Border radius scale:

- Buttons, inputs, cards: `rounded-lg`
- Larger containers: `rounded-xl`
- Avatars, icon containers: `rounded-full` or `rounded-2xl`
- Small inline elements: `rounded-lg`

---

## Icon Library

Use `lucide-react` for all icons. Never use `@mui/icons-material` or other icon libraries.

```tsx
import { Plus, Trash2, Pencil, ArrowUpRight } from 'lucide-react';
```

---

## Layout Patterns

Sidebar layout (admin-style):

```tsx
<div className="flex min-h-screen bg-canvas">
  <aside className="hidden w-64 border-r border-border-default bg-white md:flex md:flex-col">
    {/* nav */}
  </aside>
  <div className="flex min-w-0 flex-1 flex-col">
    <header className="sticky top-0 z-10 h-[68px] border-b border-border-default bg-white">
      {/* topbar */}
    </header>
    <main className="mx-auto w-full max-w-screen-xl p-6 md:p-10">
      {/* content */}
    </main>
  </div>
</div>
```

---

## Maintenance Rules

Whenever you add, rename, or remove a component from `packages/ui/src/`, you MUST also:

1. Update the **Available components** list in this file (`.github/copilot-instructions.md`)
2. Update the **Available `@yuta/ui` components** section in `AGENTS.md`

Do this in the same edit — never leave these files out of sync with the actual `packages/ui` exports.

Whenever you change app behavior, user flows, routes, setup commands,
deployment behavior, database behavior, or operational rules, update the
relevant docs in the same change.

For POS-related changes, keep these docs current:

- `docs/POS_USER_GUIDE.md` for operator-facing usage flows
- `docs/YUTA_POS.md` for POS architecture, scope, and implementation notes
- `docs/LOCAL_DATABASE.md` for local database setup changes
- `docs/DEPLOYMENT.md` for production or Docker deployment changes

Document important decisions such as cancellation/restore rules, print job
behavior, payment behavior, admin workflows, and known MVP limits when they
change.

---

## CSS Import

Each app must import the shared CSS at the top of its `globals.css`:

```css
@import '@yuta/ui/styles/global.css';
```

Each app must have a `postcss.config.mjs`:

```js
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
```
