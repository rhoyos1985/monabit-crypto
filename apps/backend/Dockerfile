# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package.json yarn.lock ./

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar código fuente
COPY tsconfig.json tsconfig.json
COPY src ./src

# Compilar TypeScript
RUN yarn build

# Development stage
FROM node:22-alpine AS development

WORKDIR /app

# Instalar herramientas de desarrollo
RUN apk add --no-cache git

# Copiar archivos
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json tsconfig.json
COPY src ./src

# Exponer puerto
EXPOSE 8080

# Hot-reload con ts-node
CMD ["yarn", "dev"]

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Instalar solo dependencias de producción
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

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
CMD ["node", "dist/server.js"]
