# YuTa

Nền tảng cho các công cụ YuTa, xây bằng Next.js, TypeScript, Tailwind CSS và SCSS.

## Cấu trúc

- `apps/web` — portal và tool đầu tiên.
- `packages/ui` — component, token SCSS và UI primitives dùng chung.
- `packages/core` — domain models, registry và logic không phụ thuộc giao diện.

## Bắt đầu

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`. Để thêm tool mới, khai báo metadata của nó trong `packages/core/src/tools.ts`, sau đó tạo route ở `apps/web/src/app/tools/<slug>`.
