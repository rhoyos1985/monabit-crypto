# Build stage
FROM node:22-alpine AS builder

# Build args para variables VITE_* (se embeben en el bundle final)
ARG VITE_API_BASE_URL=""
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

WORKDIR /app

# Copiar archivos del monorepo
COPY package.json yarn.lock ./
COPY apps/frontend/package.json ./apps/frontend/

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar configuración base y código fuente
COPY tsconfig.base.json ./
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/vite.config.ts ./apps/frontend/
COPY apps/frontend/index.html ./apps/frontend/
COPY apps/frontend/src ./apps/frontend/src

WORKDIR /app/apps/frontend

# Compilar para producción
RUN yarn build

# Development stage
FROM node:22-alpine AS development

WORKDIR /app

# Copiar archivos del monorepo
COPY package.json yarn.lock ./
COPY apps/frontend/package.json ./apps/frontend/

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar configuración base y código fuente
COPY tsconfig.base.json ./
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/vite.config.ts ./apps/frontend/
COPY apps/frontend/index.html ./apps/frontend/
COPY apps/frontend/src ./apps/frontend/src

WORKDIR /app/apps/frontend

# Exponer puerto
EXPOSE 5173

# Vite dev server con HMR
ENV VITE_HMR_PROTOCOL=ws
ENV VITE_HMR_HOST=localhost
ENV VITE_HMR_PORT=5173

CMD ["yarn", "dev", "--host", "0.0.0.0"]

# Production stage (Nginx)
FROM nginx:alpine AS production

WORKDIR /usr/share/nginx/html

# Copiar configuración de nginx
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build desde builder
COPY --from=builder /app/apps/frontend/dist ./

# Usuario nginx
USER nginx

# Exponer puerto (Cloud Run espera 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
