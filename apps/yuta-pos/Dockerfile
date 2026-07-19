# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/tenant/package.json ./packages/tenant/
COPY apps/yuta-pos/package.json ./apps/yuta-pos/
RUN pnpm install --frozen-lockfile

FROM deps AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY packages/contracts ./packages/contracts
COPY packages/tenant ./packages/tenant
COPY packages/db ./packages/db
COPY packages/core ./packages/core
CMD ["pnpm", "--filter", "@yuta/core", "print:worker:watch"]

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_POS_URL=http://localhost:3003
ENV DATABASE_URL=postgres://yuta:yuta@localhost:5432/yuta_resto
ENV NEXT_PUBLIC_POS_URL=$NEXT_PUBLIC_POS_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/yuta-pos/node_modules ./apps/yuta-pos/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY . .
RUN pnpm --filter @yuta/pos build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/yuta-pos/.next/standalone ./
COPY --from=builder /app/apps/yuta-pos/.next/static ./apps/yuta-pos/.next/static
COPY --from=builder /app/apps/yuta-pos/public ./apps/yuta-pos/public

EXPOSE 3000
CMD ["node", "apps/yuta-pos/server.js"]
