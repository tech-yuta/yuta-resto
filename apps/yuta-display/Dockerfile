# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable

# ── Install all workspace dependencies ──────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/core/package.json ./packages/core/
COPY apps/yuta-display/package.json ./apps/yuta-display/
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
# Root node_modules contains all hoisted workspace dependencies via pnpm.
# Workspace packages (ui, core) do NOT get their own node_modules folder
# unless they have unique unhoisted deps — do not COPY them conditionally.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/yuta-display/node_modules ./apps/yuta-display/node_modules
COPY . .
RUN pnpm --filter @yuta/display build

# ── Production image (standalone — ~150 MB vs ~800 MB full) ──────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone output bundles the Node server + required node_modules.
# The static files and public directory must be copied separately.
COPY --from=builder /app/apps/yuta-display/.next/standalone ./
COPY --from=builder /app/apps/yuta-display/.next/static ./apps/yuta-display/.next/static
COPY --from=builder /app/apps/yuta-display/public ./apps/yuta-display/public

# Uploads persist via Docker volume mounted at this path
VOLUME ["/app/apps/yuta-display/public/uploads/display"]

EXPOSE 3000
CMD ["node", "apps/yuta-display/server.js"]
