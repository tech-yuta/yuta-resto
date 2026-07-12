# YuTa

YuTa is a modular restaurant operations platform built with Next.js,
TypeScript, Tailwind CSS, and shared workspace packages.

## Workspace

- `apps/web` - public YuTa website and product landing page for restaurants.
- `apps/admin` - restaurant back office for daily operations, clients, staff,
  marketing, compliance, and module settings.
- `apps/yuta-pos` - restaurant POS runtime for orders, payments, tables, and
  service workflows.
- `apps/yuta-display` - digital signage display app.
- `packages/ui` - shared UI components, app-shell primitives, and design tokens.
- `packages/core` - shared business logic and registries.
- `packages/db` - shared database schema/client for operations apps.

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` for the public website.

Useful app scripts:

```bash
pnpm dev:admin
pnpm dev:pos
pnpm dev:display
```
