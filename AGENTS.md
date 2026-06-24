# AGENTS.md — YuTa Monorepo

## Workspace Overview

This is the YuTa internal restaurant tool monorepo.

```
apps/admin          — Admin dashboard (port 3001)
apps/web            — Public web app (port 3000)
apps/yuta-display   — Digital signage display (port 3002)
packages/core       — Shared business logic, tool registry
packages/ui         — Shared UI component library (@yuta/ui)
```

Future apps may include: `yuta-pos`, `yuta-staff`, `yuta-reservation`, `yuta-crm`.

---

## UI Law — Mandatory for All Apps

### Single UI source

All apps MUST use `@yuta/ui` (`packages/ui`).

NEVER introduce MUI, Ant Design, Chakra UI, Mantine, or any other component library.

### Design tokens

Use Tailwind CSS token classes — never raw hex values in `className` or `style={{}}`:

| Token | Hex | Purpose |
|---|---|---|
| `yuta-ink` | `#16211d` | Text, dark backgrounds |
| `yuta-paper` | `#f8f8f4` | Page background |
| `yuta-mist` | `#eef1ea` | Hover, subtle backgrounds |
| `yuta-line` | `#dce3d9` | Borders, dividers |
| `yuta-accent` | `#b7ef5b` | CTAs, active, highlights |

### Available `@yuta/ui` components

```
Button       — variants: primary | secondary | accent | ghost | destructive | link
              sizes: default | sm | lg | icon
Badge        — variants: active | inactive | neutral | destructive | outline
Card         — container with border + shadow-card
Input        — styled text/number/email/etc input
Label        — form label
Textarea     — styled textarea
Select       — SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup
Dialog       — DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
Checkbox     — Radix UI, use Controller from react-hook-form
Separator    — horizontal/vertical divider
Toaster      — toast via sonner
cn()         — utility: clsx + tailwind-merge
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
