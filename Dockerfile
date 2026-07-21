# === STAGE 1: builder ===
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY src ./src
COPY tsconfig.json prisma.config.ts credentials.json ./

ARG DATABASE_URL

RUN npx prisma generate --schema ./src/database/schema.prisma
RUN pnpm build

# === STAGE 2: runtime ===
FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/credentials.json ./
COPY --from=builder /app/src/database/schema.prisma ./src/database/schema.prisma
COPY --from=builder /app/src/database/migrations ./src/database/migrations

ARG DATABASE_URL

RUN npx prisma generate --schema ./src/database/schema.prisma
RUN mkdir -p /app/cache

EXPOSE 8080

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]