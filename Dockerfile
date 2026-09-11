# Stage 1 – deps
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2 – builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_ADMIN_PHOTO_URL é embutida no bundle do client no build
# (PreviewOverlay.tsx lê via clientEnv) — precisa de ARG pra chegar ao
# processo de build do Next dentro do container.
ARG NEXT_PUBLIC_ADMIN_PHOTO_URL
ENV NEXT_PUBLIC_ADMIN_PHOTO_URL=$NEXT_PUBLIC_ADMIN_PHOTO_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN SKIP_ENV_VALIDATION=1 npm run build

# Stage 3 – runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
