# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Toolchain para compilar módulos nativos (bcrypt) y openssl para Prisma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl \
  && rm -rf /var/lib/apt/lists/*

# Instala dependencias con la lockfile para builds reproducibles.
COPY package.json package-lock.json* ./
RUN npm ci

# Genera el cliente de Prisma a partir del schema.
COPY prisma ./prisma
RUN npx prisma generate

# Compila TypeScript -> dist/.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# openssl es requerido en runtime por el query engine de Prisma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Copia dependencias ya instaladas/compiladas y artefactos del build.
# Se incluye node_modules completo para tener disponibles el CLI de Prisma
# (migraciones/db push en el arranque) y tsx (seed).
COPY package.json package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
