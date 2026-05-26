# Configuración del Proyecto MonaBit

## Prerequisitos

- Node.js 22.x (usa `nvm use` o configura manualmente)
- Yarn 4.x
- Docker & Docker Compose
- Supabase CLI

## Instalación

```bash
# 1. Instalar dependencias
yarn install

# 2. Instalar Supabase CLI (si no lo tienes)
npm install -g @supabase/cli

# 3. Copiar variables de entorno
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

## Ejecución Local

### Opción 1: Con Docker Compose (Recomendado)

```bash
# Terminal 1: Levantar Supabase en el host
supabase start

# Cuando Supabase esté listo, verás algo como:
#   API URL: http://localhost:54321
#   Anon Key: eyJhbGci...
#   Service Role Key: eyJhbGci...

# Terminal 2: Levantar los contenedores de la app
docker compose up --build

# La aplicación estará disponible en:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
# API Docs: http://localhost:8080/docs
```

### Opción 2: Sin Docker (Desarrollo rápido)

```bash
# Terminal 1: Supabase
supabase start

# Terminal 2: Backend
cd apps/backend
yarn dev

# Terminal 3: Frontend
cd apps/frontend
yarn dev
```

## Variables de Entorno

### Backend (apps/backend/.env)

```env
PORT=8080
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<key-from-supabase-start>
SUPABASE_ANON_KEY=<key-from-supabase-start>
COINGECKO_API_BASE=https://api.coingecko.com/api/v3
CORS_ORIGIN=http://localhost:5173
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Change123!@#
LOG_LEVEL=debug
NODE_ENV=development
```

### Frontend (apps/frontend/.env)

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<key-from-supabase-start>
```

## Credenciales de Prueba

Cuando `supabase start` se ejecuta, crea un usuario admin automático:

- Email: `supabase@example.com`
- Password: `password`

Puedes crear usuarios adicionales mediante la API de registro.

## Parar Supabase

```bash
supabase stop
```

Para resetear completamente (elimina datos):

```bash
supabase stop --remove-volumes
```

## Solución de Problemas

### Los contenedores no pueden conectar a Supabase

En Mac/Windows Docker Desktop, `host.docker.internal` debería funcionar. En Linux, puede que necesites usar la IP del host:

```bash
# Obtén la IP del host
hostname -I

# Actualiza docker-compose.yml:
SUPABASE_URL: http://<tu-ip>:54321
```

### Supabase dice que ya está corriendo

```bash
supabase status
supabase stop
supabase start
```

### Puertos ocupados

Los puertos por defecto son:
- Supabase API: 54321
- Backend: 8080
- Frontend: 5173

Si hay conflictos, configura los puertos en `.env` o cambia los puertos de Supabase con:

```bash
supabase start --exclude "postgres,realtime,storage,edge-runtime"
```
