# MonaBit Dashboard - Cripto

Aplicación web fullstack para visualizar y gestionar información del mercado de criptomonedas.

**Stack**: React 19 + Vite | Express + Node.js LTS | Supabase (PostgreSQL + Auth) | Google Cloud Run

## Quickstart

### Prerequisitos
- Node.js LTS 22.x (verificar con `nvm use` si tienes nvm instalado)
- npm 10.x **o** yarn 4.x
- (Para fase 0.5) Docker Engine 29.x y Docker Compose v5.x

### Desarrollo local (sin Docker)

**Con npm:**
```bash
npm install
npm run dev              # Inicia frontend y backend en paralelo
npm run typecheck       # TypeScript en todas las apps
npm run lint            # ESLint en todas las apps
```

**Con yarn:**
```bash
yarn install
yarn dev                # Inicia frontend y backend en paralelo
yarn typecheck          # TypeScript en todas las apps
yarn lint               # ESLint en todas las apps
```

**Apps por separado:**
```bash
cd apps/frontend && npm run dev  # Frontend: http://localhost:5173
cd apps/backend && npm run dev   # Backend: http://localhost:8080
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

## Fase actual

**Fase 0: Preparación y andamiaje** ✓ En progreso
- Git inicializado
- Monorepo con npm workspaces
- Configuración de linting (ESLint + Prettier)
- commitlint + Husky para Conventional Commits
- Scaffolding de frontend (Vite + React 19 + TypeScript)
- Scaffolding de backend (Express + TypeScript)
- Tema de colores (tokens de Styled Components)
