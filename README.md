# MonaBit Dashboard - Cripto

Aplicación web fullstack para visualizar y gestionar información del mercado de criptomonedas.

**Stack**: React 19 + Vite | Express + Node.js LTS | Supabase (PostgreSQL + Auth) | Google Cloud Run

## Quickstart

### Prerequisitos
- Node.js LTS 22.x (verificar con `nvm use`; ver `.nvmrc`)
- yarn 4.x (gestor de paquetes principal)
- **Opción A (sin Docker)**: CLI de Supabase instalada (`npm install -g supabase`)
- **Opción B (con Docker)**: Docker Engine 29.x y Docker Compose v5.x

### Opción A: Desarrollo local (sin Docker) - Recomendado para iteración rápida

**1. Iniciar base de datos local con Supabase CLI:**
```bash
supabase start        # Levanta Postgres, Auth y Studio en contenedores
```
Espera a que los servicios estén listos. Supabase CLI muestra las credenciales.

**2. En una segunda terminal, levantar el backend:**
```bash
cd apps/backend
cp ../.env.example .env    # Copiar variables de ejemplo
# Actualizar .env con credenciales de Supabase (desde el paso 1)
yarn dev                   # Backend en http://localhost:8080
```

**3. En una tercera terminal, levantar el frontend:**
```bash
cd apps/frontend
cp ../.env.example .env
# Actualizar .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
yarn dev                   # Frontend en http://localhost:5173
```

**Orden recomendado**: Base de datos → Backend → Frontend

**Validar que cada parte responde:**
```bash
curl http://localhost:8080/health     # Backend health check
curl http://localhost:5173/           # Frontend (debería cargar HTML)
```

### Opción B: Desarrollo local (con Docker Compose)

Esta opción requiere que Supabase ya esté corriendo en el host (vía `supabase start`).

**1. Iniciar Supabase en el host:**
```bash
supabase start    # Supabase corre en localhost:54321
```

**2. Crear `.env` en la raíz con las claves reales de Supabase:**
```env
SUPABASE_SERVICE_ROLE_KEY=<service_role-key-de-supabase-status>
SUPABASE_ANON_KEY=<anon-key-de-supabase-status>
```

**3. Levantar backend y frontend en contenedores:**
```bash
docker compose up --build
```
Los contenedores se conectan a Supabase via `host.docker.internal:54321`.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Supabase Studio: http://localhost:54323

**4. Detener el entorno:**
```bash
docker compose down
```

**Ver logs de un servicio específico:**
```bash
docker compose logs -f backend    # Backend logs en tiempo real
docker compose logs -f frontend   # Frontend logs
```

### Validación rápida

```bash
yarn typecheck          # TypeScript en todas las apps
yarn lint               # ESLint
yarn build              # Build de producción
```

## Estructura del proyecto

```
monabit-dashboard/
├── apps/
│   ├── frontend/        (React + Vite)
│   └── backend/         (Express + Node.js)
├── infrastructure/      (Terraform, Docker, observabilidad)
├── docs/               (documentación)
├── .github/            (GitHub Actions)
└── PLAN-DE-TRABAJO.md  (plan de 11 fases)
```

## Documentación

- **CLAUDE.md**: Stack fijo, arquitectura, reglas de código.
- **PLAN-DE-TRABAJO.md**: Fases de ejecución detalladas.
- Ver secciones en el README principal una vez completadas las fases.

## Fases completadas

**Fase 0: Preparación y andamiaje** ✅
- Git y monorepo con yarn workspaces
- ESLint + Prettier + commitlint + Husky
- Frontend (Vite + React 19) y Backend (Express + TypeScript)
- Tema de colores (tokens de Styled Components)

**Fase 0.5: Entorno de desarrollo local** ✅
- Opción A (sin Docker): Supabase CLI + yarn dev
- Opción B (con Docker): docker-compose.yml + Dockerfiles multietapa
  - Backend: targets `development` (ts-node) y `production` (Node.js)
  - Frontend: targets `development` (Vite HMR) y `production` (Nginx)
  - Postgres + Supabase Auth integrados
  - Health checks y hot-reload

**Fase 1: Base de datos (Supabase)** ✅
- Esquema relacional: `profiles`, `user_preferences`, `price_alerts`
- Row Level Security (RLS) en todas las tablas
- Triggers automáticos al crear usuarios
- Función de seed del admin (idempotente)
- Documentación en `docs/modelo-de-datos.md` y `docs/setup-supabase.md`

**Próxima**: Fase 2 - Backend: autenticación (register, login, OAuth Google)
