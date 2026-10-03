# 1. Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ENV NODE_ENV=production
RUN npm run build

# 2. Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 -G nodejs nodejs

COPY --from=builder --chown=nodejs:nodejs /app/.output ./.output

USER nodejs

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
