# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — install semua dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install openssl untuk Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies (termasuk devDeps karena dibutuhkan saat build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — build Next.js app
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy deps dari stage sebelumnya
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy seluruh source code
COPY . .

# Set env dummy agar next build tidak error (nilai asli diisi di Coolify)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV JWT_SECRET="placeholder-secret-for-build-only-not-used"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build aplikasi (package.json sudah include "prisma generate && next build")
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: runner — image final yang ringan
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Buat user non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy file yang dibutuhkan untuk runtime
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy node_modules untuk Prisma client
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Buat folder uploads agar persistent storage bisa di-mount
RUN mkdir -p ./public/uploads/school && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Jalankan server
CMD ["node", "server.js"]
