# Multi-stage build for FitFlow (Podman/Docker compatible)
# Build client
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY client/package.json client/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY client/ ./
RUN npm run build

# Build server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY server/ ./
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY --from=server-builder /app/dist ./dist
COPY --from=client-builder /app/dist ./client-dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
