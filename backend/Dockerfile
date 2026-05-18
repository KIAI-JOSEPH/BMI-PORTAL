# BMI UMS Backend — Multi-stage Dockerfile
# Stage 1: Build (includes TypeScript compiler and all dev dependencies)
FROM node:20-alpine AS builder

RUN apk add --no-cache curl

WORKDIR /app

# Install ALL dependencies (including devDependencies for TypeScript compilation)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Compile TypeScript → dist/
COPY src ./src
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production image (only runtime dependencies + compiled output)
FROM node:20-alpine AS production

RUN apk add --no-cache curl

WORKDIR /app

# Install ONLY production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Persistent log directory
RUN mkdir -p logs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
