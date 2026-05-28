# MonaBit Dashboard - Cripto

Aplicación web fullstack que permite a un usuario autenticarse y acceder a un
dashboard privado con información del mercado de criptomonedas: top 10, precios,
variación porcentual, capitalización de mercado, volumen, KPIs generales y
gráficas. Incluye gestión de usuarios, autenticación con Google y despliegue en
Google Cloud Run.

**Stack**: React 19 + Vite | Express + Node.js 22 | Supabase (PostgreSQL + Auth) | Google Cloud Run

## Aplicación desplegada

- Frontend: https://monabit-prod-frontend-mqeimenz4q-uc.a.run.app
- Backend (API): https://monabit-prod-backend-mqeimenz4q-uc.a.run.app
- Swagger: https://monabit-prod-backend-mqeimenz4q-uc.a.run.app/docs/
- Health del backend: https://monabit-prod-backend-mqeimenz4q-uc.a.run.app/health

## Funcionalidades

- Registro, inicio de sesión, cierre de sesión e inicio de sesión con Google (OAuth).
- Rutas privadas protegidas, con distinción entre usuario y administrador.
- Gestión de usuarios (solo administradores): listar, crear, editar y desactivar.
- Dashboard con el top 10 de criptomonedas: precio actual, variación de 24 h,
  capitalización de mercado, volumen, KPIs globales, gráficas y fecha y hora de
  la última actualización.
- Edición del perfil y cambio de contraseña (disponible solo para cuentas
  creadas con correo y contraseña, no para las de Google).
- Preferencias por usuario: tema claro u oscuro y criptomonedas favoritas.

Como extras se incorporaron: roles de usuario, caché de datos cripto en el
backend, modo oscuro, favoritos por usuario, logs estructurados, endpoint de
salud, pruebas automatizadas con umbral de cobertura, CI/CD e infraestructura
como código.

## Quickstart (ejecución local)

### Prerequisitos
- Node.js LTS 22.x (verificar con `nvm use`; ver `.nvmrc`).
- yarn 4.x (gestor de paquetes principal).
- Opción A (sin Docker): CLI de Supabase instalada (`npm install -g supabase`).
- Opción B (con Docker): Docker Engine 29.x y Docker Compose v5.x.

### Opción A: desarrollo local sin Docker (recomendado para iterar rápido)

**1. Iniciar la base de datos local con la CLI de Supabase:**
```bash
supabase start        # Levanta Postgres, Auth y Studio en contenedores
```
La CLI muestra las credenciales al terminar de arrancar.

**2. En una segunda terminal, levantar el backend:**
```bash
cd apps/backend
cp .env.example .env        # Copiar variables de ejemplo
# Actualizar .env con las credenciales de Supabase (del paso 1)
yarn dev                    # Backend en http://localhost:8080
```

**3. En una tercera terminal, levantar el frontend:**
```bash
cd apps/frontend
cp .env.example .env
# Actualizar .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
yarn dev                    # Frontend en http://localhost:5173
```

Orden recomendado: base de datos, luego backend, luego frontend.

**Validar que cada parte responde:**
```bash
curl http://localhost:8080/health     # Health check del backend
curl http://localhost:5173/           # Frontend (debería cargar HTML)
```

### Opción B: desarrollo local con Docker Compose

Requiere que Supabase ya esté corriendo en el host (vía `supabase start`).

```bash
supabase start                 # Supabase en localhost:54321
# Crear .env en la raíz con SUPABASE_SERVICE_ROLE_KEY y SUPABASE_ANON_KEY reales
docker compose up --build
```
Los contenedores se conectan a Supabase mediante `host.docker.internal:54321`.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Supabase Studio: http://localhost:54323

Para detener el entorno: `docker compose down`.

### Validación rápida del repositorio
```bash
yarn typecheck          # TypeScript en todas las apps
yarn lint               # ESLint
yarn build              # Build de producción
```

## Arquitectura

El proyecto es un monorepo gestionado con yarn workspaces (`apps/frontend` y
`apps/backend`), con la infraestructura y la documentación en sus propias
carpetas.

El backend se construyó con Express y TypeScript siguiendo una arquitectura
hexagonal ligera. Cada módulo (`auth`, `users`, `market`, `preferences`,
`locations`) se organiza en cuatro capas: `domain` (tipos y reglas puras),
`application` (casos de uso y puertos), `infrastructure` (adaptadores hacia
Supabase y APIs externas) e `interfaces` (routers de Express y validación con
Zod). Los módulos no se importan entre sí directamente; se comunican a través de
puertos explícitos.

El frontend se organizó por features (`auth`, `users`, `dashboard`,
`preferences`, `locations`), cada una con capas `domain`, `application`,
`ports`, `infrastructure` y `ui`. Se usó TanStack Router con enrutamiento basado
en archivos, TanStack Query como caché de datos de servidor, Redux Toolkit solo
para el estado global de interfaz y sesión, Styled Components para los estilos y
Recharts para las gráficas. Una regla que se mantuvo es que los componentes de
interfaz nunca llaman directamente a `fetch` ni a clientes HTTP: lo hacen a
través de hooks de la capa de aplicación.

En cuanto a la comunicación, el frontend consume el backend propio para todos los
datos de negocio y solo usa el cliente de Supabase del navegador para el flujo de
OAuth con Google. Los datos persisten en Supabase (PostgreSQL); los datos de
mercado provienen de CoinGecko y el listado de ciudades de API-Colombia.

## Variables de entorno

No se incluye ningún secreto real en el repositorio. Cada aplicación tiene su
propio archivo de ejemplo: `apps/backend/.env.example` y
`apps/frontend/.env.example`.

**Backend (`apps/backend/.env`):**

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (Cloud Run lo asigna; por defecto 8080). |
| `SUPABASE_URL` | URL del proyecto Supabase (`https://<ref>.supabase.co`, sin sufijos). |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase. Solo en el backend. |
| `SUPABASE_ANON_KEY` | Clave anónima de Supabase. |
| `COINGECKO_API_BASE` | URL base de la API de CoinGecko. |
| `COINGECKO_API_KEY` | Clave opcional de CoinGecko (plan con clave). |
| `CORS_ORIGIN` | Origen permitido para CORS (URL del frontend). |
| `SEED_ADMIN_EMAIL` | Correo del administrador inicial (seed). |
| `SEED_ADMIN_PASSWORD` | Contraseña del administrador inicial (seed). |
| `LOG_LEVEL` | Nivel de log (`info`, `debug`, etc.). |
| `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT` | Reservadas para observabilidad (ver limitaciones). |
| `CRYPTO_PRIVATE_KEY` | Llave privada RSA (PEM) para el cifrado de auth/users. Obligatoria en producción. |
| `CRYPTO_PUBLIC_KEY` | Llave pública RSA (PEM) para el cifrado de auth/users. |

**Frontend (`apps/frontend/.env`):**

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL pública del backend. |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (`https://<ref>.supabase.co`, sin `/rest/v1`). |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase (se embebe en el bundle). |
| `VITE_ENCRYPTION_ENABLED` | Activa el cifrado de extremo a extremo en auth/users (`true` por defecto). |

## Proveedor de datos cripto

Se eligió CoinGecko. Se consume el endpoint `/coins/markets` para el top 10 y
`/global` para los KPIs de mercado. La razón principal es que ofrece una API
gratuita y sin clave para uso básico, con datos completos de precio, variación,
capitalización y volumen, y buena estabilidad. La integración se mantuvo aislada
en un adaptador de infraestructura del módulo `market`, con una caché en memoria
de 60 segundos; si CoinGecko cambia o falla, solo se toca ese adaptador.

## Modelo de datos

La persistencia se resuelve en Supabase (PostgreSQL). Las tablas principales son
`profiles` (datos de perfil, rol y estado del usuario) y `user_preferences`
(tema y criptomonedas favoritas). La tabla `auth.users` la gestiona Supabase
Auth, y `profiles` se crea por trigger al registrarse un usuario, siempre con
rol `user`. El detalle completo, incluidas las políticas de Row Level Security,
está en [docs/modelo-de-datos.md](docs/modelo-de-datos.md).

## Autenticación y seguridad

La autenticación se apoya en Supabase Auth, con registro por correo y contraseña,
inicio de sesión, cierre de sesión e inicio de sesión con Google (OAuth). La
sesión se materializa como un JWT emitido por Supabase. El backend valida cada
petición privada verificando el token contra Supabase (`auth.getUser`), sin
confiar en datos del cliente.

Se aplicaron las siguientes prácticas de seguridad:

- Row Level Security activo en las tablas con datos por usuario.
- La clave `service_role` de Supabase vive solo en el backend; el frontend solo
  conoce la clave anónima y la URL del backend.
- Validación de toda la entrada del cliente con Zod en la capa de interfaces.
- Manejo de errores centralizado que no filtra trazas ni detalles internos.
- Roles `admin` y `user`. El registro público siempre crea usuarios con rol
  `user`; un administrador solo puede ser creado por otro administrador, y el
  primero se genera por un seed idempotente durante el despliegue.
- En el pipeline, GitHub Actions se autentica contra Google Cloud mediante
  Workload Identity Federation (sin claves estáticas), y los secretos de la
  aplicación se gestionan con Secret Manager.
- Cifrado de extremo a extremo (defensa en profundidad sobre HTTPS) en `/auth` y
  `/users`: request y response viajan como un sobre híbrido (RSA-OAEP-256 +
  A256GCM) con la estructura `{ message: { payload, signed } }`. Detalle en
  [docs/cifrado.md](docs/cifrado.md).

La configuración del inicio de sesión con Google se documenta en
[docs/google-oauth.md](docs/google-oauth.md).

## Despliegue

La solución se despliega en Google Cloud Run con contenedores Docker
independientes para el frontend (servido por nginx) y el backend (Node.js). Las
imágenes se publican en Artifact Registry y la infraestructura se gestiona con
Terraform. El pipeline de GitHub Actions ejecuta, en cada push a `main`, las
pruebas con un umbral de cobertura del 95 % como compuerta de calidad, y solo si
pasan construye las imágenes, aplica las migraciones de Supabase y despliega cada
servicio. El detalle del despliegue y la configuración inicial está en
[docs/despliegue.md](docs/despliegue.md).

## Uso de herramientas de IA

Durante el desarrollo me apoyé en un asistente de IA generativa (Claude)
integrado al flujo de trabajo. Debido al tiempo que requería el reto, que tuve
que compartir con mi empleo actual, la IA fue de bastante ayuda en los procesos
de codificación: se trabajó de la mano, generando código y resolviendo
incidencias, mientras que mi mayor enfoque estuvo en la revisión del código
generado y en establecer las reglas de negocio y de estilo de codificación.

- **Qué herramientas se usaron**: un asistente de codificación basado en Claude,
  empleado tanto para generar y refactorizar código como para diagnosticar
  errores durante la integración y el despliegue.
- **Para qué se usaron**: andamiaje del proyecto, escritura de módulos del
  backend y de componentes del frontend, configuración de la infraestructura y
  el pipeline, y resolución de problemas concretos de despliegue.
- **Qué se investigó con ayuda de IA**: principalmente las herramientas y APIs
  planteadas en el documento del reto (CoinGecko, Supabase, Google Cloud Run,
  Terraform, Workload Identity Federation y el ecosistema de TanStack), para
  tomar decisiones informadas sobre su uso.
- **Qué decisiones técnicas tomé yo**: la definición del stack, las reglas de
  negocio (manejo de roles, seed del administrador, rutas privadas), las reglas
  de estilo de codificación y la revisión crítica de todo lo generado antes de
  incorporarlo.
- **Limitaciones y riesgos observados**: en algunos casos las respuestas
  generadas proponían configuraciones que requerían ajuste o corrección (por
  ejemplo, detalles de la federación de identidades, la ejecución de nginx como
  usuario no root o el manejo de secretos entre jobs del pipeline). Por eso la
  revisión humana fue determinante: la IA se usó como apoyo técnico, no como
  fuente única de verdad.

## Limitaciones conocidas y mejoras futuras

- **Observabilidad parcial**: se implementaron logs estructurados en JSON y el
  endpoint `/health`, pero no se alcanzaron las métricas (`/metrics` para
  Prometheus), las trazas con OpenTelemetry ni el dashboard de Grafana que se
  habían planteado en el diseño. Las variables `OTEL_*` quedan reservadas.
- **Alertas de precio**: el modelo de datos contempla la tabla, pero no se
  expusieron endpoints ni interfaz para esta funcionalidad.
- **Búsqueda y filtros de criptomonedas** en el dashboard: no se implementaron.
- **Rate limiting**: no se incorporó limitación de tasa en el backend.
- **Auditoría de acciones**: no se implementó un registro de auditoría.
- **Gestión de usuarios**: se optó por desactivación lógica (`is_active`) en
  lugar de borrado físico, que el reto admite como alternativa.

## Documentación adicional

- [docs/modelo-de-datos.md](docs/modelo-de-datos.md): modelo de datos y RLS.
- [docs/despliegue.md](docs/despliegue.md): despliegue e infraestructura.
- [docs/google-oauth.md](docs/google-oauth.md): configuración de login con Google.
- [docs/cifrado.md](docs/cifrado.md): cifrado de extremo a extremo en auth y users.
- [docs/setup-supabase.md](docs/setup-supabase.md): preparación de Supabase local.
- `CLAUDE.md`: stack, arquitectura y reglas de código del proyecto.
