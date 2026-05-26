# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package.json yarn.lock ./

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar código fuente
COPY tsconfig.json tsconfig.json
COPY vite.config.ts vite.config.ts
COPY index.html index.html
COPY src ./src

# Compilar para producción
RUN yarn build

# Development stage
FROM node:22-alpine AS development

WORKDIR /app

# Copiar archivos
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json tsconfig.json
COPY vite.config.ts vite.config.ts
COPY index.html index.html
COPY src ./src

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
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build desde builder
COPY --from=builder /app/dist ./

# Usuario nginx
USER nginx

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
