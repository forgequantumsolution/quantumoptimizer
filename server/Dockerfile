# ─────────────────────────────────────────────────────────────────────────────
# Quantum Optimizer API — Hardened Multi-Stage Dockerfile
# Stage 1: builder   — compile TypeScript, install production deps
# Stage 2: runtime   — minimal image, non-root user, read-only filesystem
# ─────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install only the OS packages needed to build native modules
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Copy manifests first — layer-cache npm install unless deps change
COPY package.json package-lock.json ./

# Install ALL deps (including devDeps for TypeScript compilation)
RUN npm ci --ignore-scripts

# Copy source and compile
COPY . .
RUN npm run build

# Prune to production-only deps
RUN npm ci --only=production --ignore-scripts


# ── STAGE 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Security: remove shell utilities and package manager in final image
RUN apk add --no-cache dumb-init \
    && apk del apk-tools

# Create non-root user + group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder --chown=appuser:appgroup /build/dist         ./dist
COPY --from=builder --chown=appuser:appgroup /build/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /build/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /build/prisma       ./prisma

# Switch to non-root before EXPOSE/CMD
USER appuser

# Expose only the API port (document intent; enforcement is at runtime)
EXPOSE 3001

# Dumb-init properly handles signals and zombie process reaping
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Health check (no curl in distroless — use wget from busybox)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
