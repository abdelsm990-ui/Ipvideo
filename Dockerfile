# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY server/package*.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY client ./client

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "dist/server.js"]
