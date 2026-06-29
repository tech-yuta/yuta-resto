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

All color and shadow values must use YuTa design tokens, never raw hex values in className:

| Token | Value | Usage |
|---|---|---|
| `bg-yuta-ink` | `#16211d` | Primary text, dark backgrounds |
| `bg-yuta-paper` | `#f8f8f4` | Page background |
| `bg-yuta-mist` | `#eef1ea` | Subtle backgrounds, hover states |
| `border-yuta-line` | `#dce3d9` | All borders, dividers |
| `bg-yuta-accent` | `#b7ef5b` | CTAs, active states, highlights |
| `shadow-card` | — | Card shadows |

Correct:
```tsx
<div className="bg-yuta-mist border-yuta-line">
```

Incorrect:
```tsx
<div style={{ background: '#eef1ea', border: '1px solid #dce3d9' }}>
```

---

## Components

Always import from `@yuta/ui`. Never write raw HTML input/button/label/checkbox/select/dialog when a `@yuta/ui` component exists.

Available components:
- `Button` — variants: `primary`, `secondary`, `accent`, `ghost`, `destructive`, `link`; sizes: `default`, `sm`, `lg`, `icon`
- `Badge` — variants: `active`, `inactive`, `neutral`, `destructive`, `outline`
- `Card` — base container with border + shadow
- `Input` — styled text/number/etc input
- `Label` — form label
- `Textarea` — styled textarea
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`, `SelectGroup`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- `Checkbox` — Radix UI checkbox (use `Controller` from react-hook-form to integrate)
- `Separator` — horizontal or vertical divider
- `Toaster` (from `sonner`) — toast notifications
- `cn()` — utility for merging Tailwind classes

Correct:
```tsx
import { Button, Input, Label, Checkbox } from '@yuta/ui';

<Label htmlFor="title">Title</Label>
<Input id="title" {...register('title')} />
<Button variant="destructive" size="sm">Delete</Button>
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
/>
```

---

## Styling Rules

Use Tailwind CSS utility classes only. Do not write inline `style={{}}` props unless absolutely necessary (e.g., dynamic runtime values).

Use `cn()` when merging conditional classes:
```tsx
import { cn } from '@yuta/ui';
<div className={cn('base-class', condition && 'conditional-class', className)} />
```

Border radius scale:
- Buttons, inputs, badges: `rounded-xl`
- Cards: `rounded-2xl`
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
<div className="flex min-h-screen bg-yuta-paper">
  <aside className="hidden w-64 border-r border-yuta-line bg-white md:flex md:flex-col">
    {/* nav */}
  </aside>
  <div className="flex min-w-0 flex-1 flex-col">
    <header className="sticky top-0 z-10 h-[68px] border-b border-yuta-line bg-white">
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
