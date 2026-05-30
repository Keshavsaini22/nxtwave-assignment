# ==========================================
# STAGE 1: Build Stage
# ==========================================
FROM node:20-alpine AS builder

# Install OpenSSL and compat libraries for Prisma engine compatibility in Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install package dependencies
COPY package*.json ./
RUN npm ci

# Copy database schema for Prisma Client generation
COPY prisma ./prisma/

# Copy application source code
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma Client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 2: Production Runtime Stage
# ==========================================
FROM node:20-alpine AS runner

# Install OpenSSL and compat libraries for Prisma engine compatibility in Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and database schema from the builder stage
COPY package*.json ./
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/src/docs ./dist/docs/

# Install only production dependencies
RUN npm ci --omit=dev

# Generate Prisma Client in the runner stage to ensure correct bindings
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "dist/index.js"]
