# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — install dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — generate Prisma + build Next.js
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Env dummy agar next build tidak error (nilai asli diisi di Coolify/env)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV JWT_SECRET="placeholder-build-only"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# prisma generate + next build (sudah ada di scripts build di package.json)
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: runner — image final yang ringan
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# User non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Prisma schema (untuk runtime migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# package.json (dibutuhkan Prisma runtime)
COPY --from=builder /app/package.json ./package.json

# Next.js standalone output — extract ke root /app/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Static files CSS/JS — harus di-copy SETELAH standalone agar tidak ditimpa
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Public assets — di-copy SETELAH standalone agar tidak ditimpa
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# node_modules dari builder (sudah include Prisma generated client)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Folder uploads persistent
RUN mkdir -p ./public/uploads/school && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
