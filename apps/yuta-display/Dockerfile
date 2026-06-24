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
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/yuta-display/node_modules ./apps/yuta-display/node_modules
COPY . .
RUN pnpm --filter @yuta/display build

# ── Production image ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/yuta-display ./apps/yuta-display

# Uploads persist via Docker volume mounted at this path
VOLUME ["/app/apps/yuta-display/public/uploads/display"]

EXPOSE 3000
CMD ["pnpm", "--filter", "@yuta/display", "start", "--port", "3000"]
