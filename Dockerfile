FROM node:20-slim AS base
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

FROM base AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV OPENAI_API_KEY=sk-build-placeholder
RUN mkdir -p data && npx drizzle-kit push && npm run build
# 스키마를 스냅샷으로 덤프 → 런타임 additive 마이그레이터가 사용
RUN npx tsx scripts/dump-schema.ts

FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/node_modules/drizzle-kit ./node_modules/drizzle-kit
COPY --from=builder /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
# 자동 마이그레이션: 스키마 스냅샷 + additive 마이그레이터(시작 시 실행)
COPY --from=builder /app/schema-snapshot.json ./
COPY --from=builder /app/scripts/migrate-prod.cjs ./scripts/migrate-prod.cjs
EXPOSE 3000
# 시작 전 additive 마이그레이션 실행(무손실). 실패해도 앱은 시작.
CMD ["sh", "-c", "node scripts/migrate-prod.cjs; node server.js"]
