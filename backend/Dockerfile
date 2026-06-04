# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && \
    echo "=== Build complete. Verifying dist/ ===" && \
    ls -la dist/

# Stage 2: Runtime
FROM node:18-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Fail loudly if the builder did not produce a dist/ folder
RUN --mount=type=bind,from=builder,source=/app/dist,target=/mnt/dist \
    test -d /mnt/dist && echo "dist/ verified in builder stage"

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
