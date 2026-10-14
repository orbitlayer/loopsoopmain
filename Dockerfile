# syntax=docker/dockerfile:1
#
# Loopsoop — production image for the Hostinger VPS (dev-loopsoop rootless engine).
# Multi-stage build on Next.js standalone output → small, non-root runtime image.
# Served internally on :3000; the deploy publishes it to the host as :8081, which
# Traefik (root engine) routes from loopsoop.187.126.121.91.sslip.io.

# ---- dependencies ---------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime --------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOADS_DIR=/data/uploads

# Non-root runtime user, plus a persistent uploads dir owned by it (a named
# volume mounted here inherits this ownership on first run).
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001 \
  && mkdir -p /data/uploads \
  && chown -R nextjs:nodejs /data

# Standalone output does NOT bundle public/ or .next/static — copy them in.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
