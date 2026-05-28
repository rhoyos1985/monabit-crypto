# PLAN DE TRABAJO - Reto Tecnico MonaBit: Dashboard Cripto

Plan de ejecucion por fases. Cada fase tiene tareas concretas, criterios de
hecho (Definition of Done) y entregables. Las reglas de stack, arquitectura y
codigo viven en `CLAUDE.md`; este documento es el "que" y el "cuando", no el
"como detallado".

Orden de prioridad de entrega: solucion funcional > claridad > documentacion >
extras. Una fase no se considera terminada hasta cumplir su Definition of Done.

---

## Fase 0 - Preparacion y andamiaje

Objetivo: tener el monorepo, las herramientas y los proyectos vacios corriendo.

Tareas:
1. Inicializar el repositorio Git y la estructura de carpetas de `CLAUDE.md`
   seccion 11. Monorepo simple con `apps/frontend` y `apps/backend`.
2. Configurar `tsconfig.base.json` estricto compartido y `tsconfig` por app.
3. Configurar ESLint + Prettier con reglas que enforcen: arrow functions no
   anonimas, prohibicion de `any`, imports sin usar. Regla
   `func-style: ["error", "expression"]` y `prefer-arrow-callback`.
4. Configurar commitlint + Husky para Conventional Commits en pre-commit.
5. Scaffolding del frontend con Vite + React 19 + TypeScript.
6. Scaffolding del backend con Express + TypeScript.
7. Crear `.env.example` en ambas apps con las variables de `CLAUDE.md` seccion 8.
8. Definir el tema de Styled Components en `apps/frontend/src/shared/` con los
   tokens de la paleta de marca (`brandPrimary`, `brandAccent`, `brandDark`) y
   los neutros, segun `CLAUDE.md` seccion 4.7. Configurar el `ThemeProvider`.

Definition of Done:
- `yarn dev` levanta frontend y backend sin errores.
- `yarn lint` y `yarn typecheck` pasan en ambas apps.
- Un commit que viole Conventional Commits es rechazado por Husky.
- El tema de colores existe como tokens y esta disponible via `ThemeProvider`.

Entregable: repositorio con andamiaje funcional y linting activo.

---

## Fase 0.5 - Entorno de desarrollo local

Objetivo: poder levantar el proyecto en local de dos formas, con Docker Compose
y sin el, para validar cada funcionalidad a medida que se construye.

Versiones de referencia (verificadas, mayo 2026):
- Docker Engine 29.x.
- Docker Compose v5.x (plugin V2+; se invoca como `docker compose`, con espacio,
  no `docker-compose` con guion, que es el binario V1 deprecado desde 2024).
- El archivo `docker-compose.yml` NO lleva el campo `version:` en la cabecera:
  la Compose Specification actual lo considera obsoleto y lo ignora.

### Via A - Sin Docker Compose (ejecucion directa)
Para iteracion rapida del dia a dia.

Tareas:
1. Documentar en el README los prerequisitos: Node.js LTS 22.x, npm, y la CLI
   de Supabase.
2. Documentar el arranque de la base de datos local con `supabase start`, que
   levanta Postgres, Auth y Studio en contenedores gestionados por la CLI de
   Supabase. Aplicar migraciones y el seed del admin con `supabase db reset`.
3. Documentar el arranque del backend: `yarn install` y `yarn dev` en
   `apps/backend`, leyendo `apps/backend/.env`.
4. Documentar el arranque del frontend: `yarn install` y `yarn dev` en
   `apps/frontend`, leyendo `apps/frontend/.env`.
5. Documentar el orden recomendado (base de datos, luego backend, luego
   frontend) y como verificar que cada parte responde.

### Via B - Con Docker Compose
Para levantar todo el entorno con un solo comando, replicando produccion.

Tareas:
1. `Dockerfile` multietapa del backend con dos targets: `development` (con
   hot-reload y dependencias de desarrollo) y `production` (imagen esbelta, la
   misma que usa la Fase 8). Imagen base Node.js LTS 22.x oficial.
2. `Dockerfile` multietapa del frontend con dos targets: `development` (servidor
   de Vite con hot-reload) y `production` (build servido por `nginx`).
3. `docker-compose.yml` en la raiz del repositorio, sin campo `version:`, que
   orquesta los servicios: backend, frontend y la pila de Supabase local.
   Definir `depends_on` con `condition: service_healthy`, `healthcheck` por
   servicio, red interna, volumenes para hot-reload del codigo y persistencia
   de la base de datos, y carga de variables desde archivos `.env`.
4. (Opcional) `docker-compose.override.yml` para ajustes exclusivos de
   desarrollo, de modo que el `docker-compose.yml` base quede limpio.
5. Documentar en el README los comandos: `docker compose up --build` para
   levantar todo, `docker compose down` para detener, y como ver logs por
   servicio con `docker compose logs -f <servicio>`.
6. Verificar que un `docker compose up` en limpio levanta el entorno completo y
   la aplicacion es accesible.

Definition of Done:
- Via A: con `supabase start` mas `yarn dev` en cada app, el proyecto corre
  en local y se puede validar funcionalidad por funcionalidad.
- Via B: `docker compose up --build` levanta backend, frontend y base de datos,
  con los servicios esperando a que sus dependencias esten sanas.
- El hot-reload funciona en ambas vias durante el desarrollo.
- El README documenta las dos vias con sus comandos y prerequisitos.

Entregable: `Dockerfile` de backend y frontend (multietapa), `docker-compose.yml`
en la raiz, y la seccion de ejecucion local en el README con ambas vias.

---

## Fase 1 - Base de datos y modelo de datos (Supabase)

Objetivo: tener el esquema relacional creado y RLS configurado.

Tareas:
1. Crear el proyecto en Supabase. Obtener `SUPABASE_URL`, `anon` key y
   `service_role` key.
2. Crear las tablas `profiles`, `user_preferences` y (opcional) `price_alerts`
   segun `CLAUDE.md` seccion 9. Nombres en `snake_case`, columnas en ingles.
   La columna `role` de `profiles` lleva DEFAULT `"user"`.
3. Crear el trigger que inserta una fila en `profiles` al registrarse un
   usuario en `auth.users`, forzando `role = "user"` en todos los casos.
4. Activar Row Level Security en todas las tablas y escribir las policies:
   cada usuario accede solo a sus filas; rol `admin` gestiona todos los
   `profiles`. Una policy adicional impide que un usuario no-admin modifique su
   propio campo `role`.
5. Escribir el script de seed de la migracion inicial que crea el usuario
   `admin` por defecto a partir de `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`
   (ver `CLAUDE.md` seccion 4.6). El seed debe ser idempotente: si el admin ya
   existe, no lo duplica ni lo sobrescribe.
6. Generar los tipos TypeScript del esquema con la CLI de Supabase y guardarlos
   en `apps/backend/src/shared/database.types.ts`.
7. Documentar el modelo de datos en `docs/modelo-de-datos.md`.

Definition of Done:
- Las tablas existen y un insert manual respeta las restricciones.
- RLS impide que un usuario lea filas de otro (verificado con dos usuarios).
- Un usuario no-admin no puede cambiar su propio `role` (verificado).
- El seed crea el admin inicial en el primer despliegue y es idempotente al
  re-ejecutarse.
- Los tipos generados compilan sin error.

Entregable: esquema en Supabase + seed del admin + `docs/modelo-de-datos.md`.

---

## Fase 2 - Backend: modulo de autenticacion

Objetivo: registro, login, logout y validacion de sesion funcionando.

Tareas:
1. Crear el modulo `auth` con sus cuatro capas (domain, application,
   infrastructure, interfaces).
2. Adaptador de infraestructura: cliente Supabase Admin para registrar usuarios
   y verificar JWT (`auth.getUser`).
3. Casos de uso: `registerUser`, `loginUser`, `logoutUser`, `getCurrentUser`.
   `registerUser` siempre asigna `role = "user"`; ignora cualquier `role` que
   venga en el body. Lo mismo aplica al alta via login con Google.
4. Router de interfaces con endpoints: `POST /auth/register`, `POST /auth/login`,
   `POST /auth/logout`, `GET /auth/me`. Schemas Zod para cada body; el schema de
   registro no acepta el campo `role`.
5. Middleware `requireAuth`: extrae el JWT del header `Authorization`, lo valida
   contra Supabase y adjunta el usuario al request. Las rutas privadas lo usan.
6. Middleware de manejo de errores centralizado: respuestas de error
   consistentes, sin stack traces al cliente.
7. Endpoint OAuth de Google: el frontend inicia el flujo con Supabase; el
   backend expone `GET /auth/me` que valida la sesion resultante.

Definition of Done:
- Registro, login y `/auth/me` funcionan via cliente HTTP (probado con curl o
  supertest).
- Un usuario recien registrado siempre queda con rol `"user"`, incluso si el
  body de registro intenta forzar otro rol.
- Una peticion sin JWT a una ruta privada devuelve 401.
- Un JWT invalido o expirado devuelve 401, no 500.

Entregable: modulo `auth` del backend con endpoints operativos.

---

## Fase 3 - Backend: modulo de usuarios

Objetivo: gestion basica de usuarios (CRUD) con control de rol.

Tareas:
1. Crear el modulo `users` con sus cuatro capas.
2. Casos de uso: `listUsers`, `createUser`, `updateUserProfile`,
   `deactivateUser` (desactivacion logica via `is_active`, no borrado fisico).
3. Router con endpoints: `GET /users`, `POST /users`, `PATCH /users/:id`,
   `PATCH /users/:id/deactivate`. Schemas Zod en cada uno.
4. Autorizacion por rol: solo `admin` puede listar todos los usuarios, crear y
   desactivar. Un usuario normal solo edita su propio perfil.
5. Regla de creacion de roles (ver `CLAUDE.md` seccion 4.6): el endpoint
   `POST /users` es la unica via para crear un usuario con rol `"admin"`, y solo
   un usuario autenticado con rol `"admin"` puede usarlo para ello. Si un usuario
   no-admin alcanzara el endpoint, recibe 403. El caso de uso valida el rol del
   solicitante antes de asignar `"admin"`.
6. Garantizar idempotencia minima: restriccion unica de email en `profiles`
   impide usuarios duplicados ante reintentos.

Definition of Done:
- Un `admin` puede listar, crear, editar y desactivar usuarios.
- Un `admin` puede crear otro usuario con rol `"admin"` desde `POST /users`.
- Un usuario normal recibe 403 al intentar acciones de `admin`, incluida la
  creacion de cualquier usuario.
- No existe ninguna via fuera de este endpoint para asignar el rol `"admin"`.
- Crear dos veces el mismo email no genera duplicado.

Entregable: modulo `users` del backend con CRUD y autorizacion.

---

## Fase 4 - Backend: modulo de mercado cripto

Objetivo: integracion estable con CoinGecko y entrega de datos al frontend.

Tareas:
1. Crear el modulo `market` con sus cuatro capas.
2. Adaptador de infraestructura `coinGeckoClient`: consume `/coins/markets`
   (top 10 por market cap) y `/global` (KPIs de mercado). Aislamiento total:
   ningun otro modulo conoce a CoinGecko.
3. Caso de uso `getMarketOverview`: devuelve top 10 normalizado (symbol, name,
   price, changePercent24h, marketCap, volume, image) + KPIs globales + timestamp
   de ultima actualizacion.
4. Cache en memoria con TTL corto (ej. 60s) para no agotar el rate limit de
   CoinGecko y mejorar la latencia del dashboard.
5. Manejo de errores: si CoinGecko falla, responder con datos cacheados si los
   hay, o un error controlado claro si no.
6. Router con endpoint `GET /market/overview`. Ruta privada (requiere JWT).

Definition of Done:
- `GET /market/overview` devuelve top 10 + KPIs + timestamp.
- Dos llamadas seguidas dentro del TTL no golpean CoinGecko dos veces.
- Una caida simulada de CoinGecko no tumba el backend.

Entregable: modulo `market` del backend integrado con CoinGecko.

---

## Fase 5 - Frontend: autenticacion y rutas privadas

Objetivo: flujo completo de auth en la UI y proteccion de rutas.

Tareas:
1. Crear la feature `auth` con sus cinco capas.
2. Configurar Redux Toolkit: slice `session` con estado de usuario y rol.
   TanStack Query NO se usa aqui; la sesion es estado de UI.
3. Capa `infrastructure`: cliente Supabase del navegador para el flujo OAuth de
   Google, y adaptador HTTP al backend para registro/login con email.
4. Hooks de `application`: `useLogin`, `useRegister`, `useLogout`,
   `useGoogleLogin`, `useCurrentUser`.
5. UI: pantallas de Login y Registro. Componentes tipados con `React.FC` y
   props en interface (ver `CLAUDE.md` seccion 4.2). Sin `<form>` con submit
   nativo si se renderiza como artifact; usar handlers `onClick`.
6. Componente `ProtectedRoute`: redirige a login si no hay sesion valida.
7. Configurar React Router con rutas publicas (login, registro) y privadas
   (dashboard, gestion de usuarios).

Definition of Done:
- Un usuario puede registrarse, iniciar sesion con email y con Google, y cerrar
  sesion.
- Acceder a una ruta privada sin sesion redirige a login.
- Al recargar la pagina la sesion persiste.

Entregable: feature `auth` del frontend con rutas protegidas.

---

## Fase 6 - Frontend: dashboard cripto

Objetivo: dashboard privado con top 10, KPIs y graficas.

Tareas:
1. Crear la feature `dashboard` con sus cinco capas.
2. Capa `infrastructure`: adaptador HTTP que consume `GET /market/overview` del
   backend. La feature nunca llama a CoinGecko directamente.
3. Hook de `application` `useMarketOverview` basado en TanStack Query, con
   refetch por intervalo (ej. 60s) para datos frescos.
4. UI del dashboard:
   - Tabla/grid del top 10: symbol, name, precio actual, variacion porcentual
     (con color segun signo), market cap, volumen.
   - Tarjetas de KPIs generales del mercado.
   - Grafica con Recharts (ej. variacion del top 10 o dominancia de mercado).
     Las series usan la paleta de marca (`brandPrimary`, `brandAccent`); ver
     `CLAUDE.md` seccion 4.7.
   - Etiqueta de fecha y hora de ultima actualizacion.
5. Componentes tipados con `React.FC` y props en interface. Estados de carga,
   error y vacio resueltos explicitamente.

Definition of Done:
- El dashboard muestra top 10, KPIs, una grafica y el timestamp.
- Los datos se refrescan periodicamente sin recargar la pagina.
- Los estados de carga y error se ven correctamente.

Entregable: feature `dashboard` del frontend funcional.

---

## Fase 7 - Frontend: gestion de usuarios

Objetivo: pantalla de administracion de usuarios.

Tareas:
1. Crear la feature `users` con sus cinco capas.
2. Capa `infrastructure`: adaptador HTTP a los endpoints `/users` del backend.
3. Hooks de `application`: `useUsers`, `useCreateUser`, `useUpdateUser`,
   `useDeactivateUser`, basados en TanStack Query (listado) y mutaciones.
4. UI: tabla de usuarios registrados, formulario de creacion, edicion de datos
   basicos y accion de desactivar. Visible solo para rol `admin`.
5. Componentes tipados con `React.FC` y props en interface.

Definition of Done:
- Un `admin` ve la lista, crea, edita y desactiva usuarios desde la UI.
- Un usuario normal no ve la seccion de gestion.

Entregable: feature `users` del frontend funcional.

---

## Fase 8 - Infraestructura como codigo y despliegue automatico

Objetivo: infraestructura reproducible con Terraform y despliegue automatico
con GitHub Actions a Google Cloud Run.

Tareas:
1. Reutilizar el target `production` de los `Dockerfile` multietapa de backend
   y frontend creados en la Fase 0.5. Verificar que el target `production` del
   frontend incluye el `nginx.conf` con fallback a `index.html` para el router.
   No se crean Dockerfiles nuevos: son los mismos, con el target de produccion.
2. Preparar el proyecto de Google Cloud: habilitar las APIs necesarias
   (Cloud Run, Artifact Registry, Secret Manager, IAM), crear el repositorio de
   Artifact Registry y la cuenta de servicio del pipeline.
3. Escribir la infraestructura en `infrastructure/` con Terraform, proveedor
   unico Google Cloud. Punto de entrada `main.tf` parametrizado solo por
   `environment`. Recursos: dos servicios de Cloud Run (frontend y backend),
   secretos en Secret Manager, permisos IAM. Nombres en ingles `snake_case`.
4. Configurar el backend de estado de Terraform en un bucket de Google Cloud
   Storage (estado remoto, no local).
5. Cargar los secretos de la aplicacion (claves de Supabase, CoinGecko y las
   credenciales del seed admin `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) en
   Secret Manager; Terraform los referencia y los inyecta como variables de
   entorno en Cloud Run. Ningun secreto en el repositorio.
6. Configurar la autenticacion de GitHub Actions contra Google Cloud mediante
   Workload Identity Federation (preferido) o cuenta de servicio con clave en
   secretos de GitHub.
7. Escribir el workflow de CI en `.github/workflows/`: en cada pull request
   ejecuta lint, typecheck, build y tests.
8. Escribir el workflow de despliegue en `.github/workflows/`: al hacer merge a
   la rama principal construye las imagenes Docker, las publica en Artifact
   Registry, ejecuta `terraform plan` y `terraform apply`, y Cloud Run toma la
   nueva revision. Sin pasos manuales.
9. Configurar CORS del backend para aceptar el dominio del frontend desplegado.
10. Verificar el flujo completo en produccion: registro, login con Google,
    dashboard y gestion de usuarios.

Definition of Done:
- `terraform plan` y `terraform apply` levantan toda la infraestructura desde
  cero de forma reproducible.
- Un merge a la rama principal despliega automaticamente sin intervencion manual.
- Frontend y backend responden desde URLs publicas de Cloud Run.
- El flujo completo funciona en produccion, no solo en local.
- No hay secretos en la imagen, en el repositorio ni en el estado de Terraform.

Entregable: carpeta `infrastructure/` con Terraform, workflows de GitHub Actions
y dos servicios desplegados en Cloud Run con URLs publicas.

---

## Fase 9 - Observabilidad: logs, metricas, trazas y dashboard

Objetivo: instrumentar la aplicacion con observabilidad open source y un
dashboard de Grafana para monitorearla.

Stack de observabilidad (open source, coherente con el ecosistema Grafana):
- Logs estructurados en formato JSON.
- Loki como almacen de logs.
- Prometheus para metricas.
- Tempo para trazas distribuidas.
- OpenTelemetry como capa de instrumentacion del backend.
- Grafana como capa de visualizacion (dashboard unico que une las tres senales).

Tareas:
1. Logs estructurados: integrar un logger JSON en el backend (ej. `pino`). Cada
   linea de log lleva timestamp, nivel, mensaje, modulo y, cuando exista, el
   `trace_id` de la peticion. Prohibido `console.log` suelto. El middleware de
   error registra los fallos con su contexto, sin filtrar datos sensibles.
2. Health endpoint: `GET /health` en el backend. Responde el estado del servicio
   y una verificacion basica de dependencias criticas (conexion a Supabase).
   Cloud Run lo usa como health check.
3. Endpoint de metricas: `GET /metrics` exponiendo metricas en formato
   Prometheus. Como minimo: latencia de peticiones HTTP, conteo por codigo de
   estado, throughput, y una metrica de negocio (ej. llamadas a CoinGecko y
   aciertos/fallos de cache).
4. Trazas distribuidas: instrumentar el backend con OpenTelemetry. Cada peticion
   genera una traza que cubre el ciclo completo: entrada HTTP, caso de uso,
   llamada a Supabase y llamada a CoinGecko. Las trazas se exportan a Tempo.
5. Propagar el `trace_id` a los logs para correlacionar las tres senales (log,
   metrica, traza) desde un mismo identificador.
6. Configurar el envio de las tres senales: Loki para logs, Prometheus para
   metricas y Tempo para trazas. Documentar las variables de entorno de los
   endpoints de exportacion (`OTEL_EXPORTER_OTLP_ENDPOINT`, etc.).
7. Crear el dashboard de Grafana como JSON versionado en el repositorio
   (`infrastructure/observability/grafana-dashboard.json`), de modo que sea
   reproducible e importable. Paneles minimos: tasa de peticiones, latencia
   (p50/p95/p99), tasa de errores por codigo, salud del servicio, metricas de la
   integracion con CoinGecko, volumen de logs por nivel y acceso a trazas
   recientes.
8. Documentar en `docs/observabilidad.md` como levantar el stack, importar el
   dashboard y leer cada panel.

Definition of Done:
- `GET /health` responde el estado real del servicio y sus dependencias.
- `GET /metrics` expone metricas en formato Prometheus consumibles.
- Una peticion genera una traza completa visible en Tempo.
- Los logs son JSON estructurado y se correlacionan por `trace_id`.
- El dashboard de Grafana se importa desde el JSON del repositorio y muestra las
  tres senales sin configuracion manual adicional.

Entregable: backend instrumentado con logs/metricas/trazas, `GET /health`,
`GET /metrics`, `infrastructure/observability/grafana-dashboard.json` y
`docs/observabilidad.md`.

---

## Fase 10 - Documentacion y entrega

Objetivo: cerrar todos los entregables del reto.

Tareas:
1. README con: descripcion, stack, e instrucciones de ejecucion local paso a
   paso por las dos vias definidas en la Fase 0.5: con Docker Compose
   (`docker compose up --build`) y sin Docker Compose (`supabase start` mas
   `yarn dev` por app). Incluir prerequisitos y orden de arranque.
2. README con explicacion general de arquitectura (hexagonal ligera, modulos,
   features).
3. Documentar variables de entorno con valores de ejemplo.
4. Seccion: proveedor cripto elegido (CoinGecko) y justificacion.
5. Seccion: explicacion breve del modelo de datos (enlazar
   `docs/modelo-de-datos.md`).
6. Seccion: autenticacion y seguridad (Supabase Auth, JWT, RLS, manejo de
   secretos).
7. Seccion: observabilidad (enlazar `docs/observabilidad.md`): logs, metricas,
   trazas y como usar el dashboard de Grafana.
8. Seccion: uso de herramientas de IA. Que herramientas se usaron, para que,
   que partes se investigaron con IA, que decisiones tecnicas tomo el candidato,
   y que limitaciones o riesgos se encontraron en las respuestas de IA.
9. Seccion: limitaciones conocidas y mejoras futuras.
10. Resumen del despliegue realizado.

Definition of Done:
- El README cubre todos los puntos del checklist de `CLAUDE.md` seccion 12.
- Un tercero puede clonar, configurar y levantar el proyecto solo con el README.

Entregable: documentacion completa lista para evaluacion.

---

## Fase 11 - Extras opcionales (solo si hay tiempo)

Abordar en este orden de valor/esfuerzo, sin comprometer las fases 0-10:

1. Rate limiting en los endpoints del backend.
2. Dark mode en el frontend (ya hay `theme` en `user_preferences`).
3. Busqueda y filtros de criptomonedas en el dashboard.
4. Criptomonedas favoritas por usuario (usa `favorite_coins`).
5. Tests: unitarios de casos de uso (Jest) y E2E del flujo de login.
6. Ampliar el workflow de CI/CD (la base ya existe en la Fase 8): cobertura de
   tests, entornos por rama, o despliegue a un entorno de staging previo.
7. Alertas simples de precio (usa la tabla `price_alerts`).
8. Auditoria basica de acciones.

Definition of Done de cada extra: la funcionalidad opera sin romper lo anterior
y queda mencionada en la seccion de extras del README.

---

## Resumen de fases

| Fase | Nombre | Bloque |
|------|--------|--------|
| 0 | Preparacion y andamiaje | Base |
| 0.5 | Entorno de desarrollo local (con y sin Docker Compose) | Base |
| 1 | Base de datos y modelo (Supabase) | Datos |
| 2 | Backend: autenticacion | Backend |
| 3 | Backend: usuarios | Backend |
| 4 | Backend: mercado cripto | Backend |
| 5 | Frontend: auth y rutas privadas | Frontend |
| 6 | Frontend: dashboard cripto | Frontend |
| 7 | Frontend: gestion de usuarios | Frontend |
| 8 | IaC con Terraform y despliegue automatico (GitHub Actions) | Despliegue |
| 9 | Observabilidad: logs, metricas, trazas y dashboard Grafana | Observabilidad |
| 10 | Documentacion y entrega | Cierre |
| 11 | Extras opcionales | Opcional |

Las fases 2-4 (backend) pueden solaparse con 5-7 (frontend) una vez definidos
los contratos de API. La fase 1 es prerequisito de todo el backend. La fase 8
requiere las fases 2-7 razonablemente completas. La fase 9 (observabilidad)
puede iniciarse en paralelo a las fases de backend —el logger y el health
endpoint cuanto antes mejor— pero su cierre depende de tener el backend
desplegado en la fase 8.
