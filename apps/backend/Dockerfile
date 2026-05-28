# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración del monorepo
COPY package.json yarn.lock ./

# Copiar package.json de apps (workspaces)
COPY apps/backend/package.json ./apps/backend/

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar configuración base y código fuente
COPY tsconfig.base.json ./
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/tsconfig.build.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

WORKDIR /app/apps/backend

# Compilar TypeScript
RUN yarn build

# Development stage
FROM node:22-alpine AS development

WORKDIR /app

# Instalar herramientas de desarrollo
RUN apk add --no-cache git

# Copiar archivos del monorepo
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar configuración base y código fuente
COPY tsconfig.base.json ./
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/tsconfig.build.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

WORKDIR /app/apps/backend

# Compilar TypeScript
RUN yarn build

# Exponer puerto
EXPOSE 8080

# Ejecutar servidor compilado
CMD ["yarn", "start"]

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copiar archivos del monorepo
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/

# Instalar solo dependencias de producción
RUN yarn install --frozen-lockfile --production

# Copiar código compilado desde builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Ejecutar aplicación compilada
CMD ["node", "apps/backend/dist/server.js"]
