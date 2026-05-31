FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ─── Dependencies stage ───────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM base AS builder
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeapp

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

RUN mkdir -p uploads/invoices logs
RUN chown -R nodeapp:nodejs /app

USER nodeapp

EXPOSE 4001

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
