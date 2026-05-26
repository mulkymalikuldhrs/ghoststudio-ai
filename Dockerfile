# =============================================================================
# GhostStudio AI — Multi-stage Production Dockerfile
# Base: oven/bun:1 | Runtime: oven/bun:1-slim
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Dependencies
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy lockfile and package manifests first for layer caching
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install all dependencies (dev + prod — needed for build step)
RUN bun install --frozen-lockfile

# Generate Prisma Client before build
RUN bun run db:generate

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS build

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy Prisma generated client
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Copy full source tree
COPY . .

# Next.js collects completely anonymous telemetry — disable it
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application (standalone output is configured in next.config.ts)
RUN bun run build

# ---------------------------------------------------------------------------
# Stage 3: Production Runner
# ---------------------------------------------------------------------------
FROM oven/bun:1-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=build /app/.next/standalone ./

# Copy static assets that standalone build references
COPY --from=build /app/.next/static ./.next/static

# Copy public directory
COPY --from=build /app/public ./public

# Ensure correct ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
