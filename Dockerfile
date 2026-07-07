FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY server ./server
COPY shared ./shared
COPY drizzle ./drizzle
COPY scripts/start-api-production.sh ./scripts/
COPY drizzle.config.ts tsconfig.json ./
RUN npm run build
EXPOSE 3000
CMD ["sh", "scripts/start-api-production.sh"]
