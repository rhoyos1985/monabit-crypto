# CLAUDE.md - Reto Tecnico MonaBit: Dashboard Cripto

Instrucciones de proyecto para Claude Code. Este archivo se carga automaticamente
en cada sesion dentro de este repositorio. Es la fuente de verdad sobre stack,
arquitectura, convenciones y reglas de codigo. El plan de trabajo por fases vive
en `PLAN-DE-TRABAJO.md`; consultalo cuando se solicite avanzar tareas.

---

## 1. Objetivo del proyecto

Aplicacion web fullstack que permite a un usuario autenticarse y acceder a un
dashboard privado con informacion del mercado de criptomonedas: top 10, precios,
variacion porcentual, market cap, volumen, KPIs y graficas. Incluye gestion de
usuarios, autenticacion con Google, rutas privadas y despliegue en Google Cloud Run.

La solucion se evalua como reto tecnico. Prioridad de entrega, en orden:
solucion funcional > claridad del codigo > documentacion > extras opcionales.
No sobre-ingenierizar: cada decision debe justificarse contra un requisito real.

---

## 2. Stack tecnologico (decisiones fijas)

### Frontend (`apps/frontend/`)
- React 19+ con Vite, TypeScript estricto.
- TanStack Router para enrutamiento (file-based routing en `src/routes/`, rutas
  totalmente tipadas, rutas privadas protegidas). El plugin `@tanstack/router-plugin`
  genera `src/routeTree.gen.ts`. Las rutas son thin wrappers que importan los
  componentes de page de cada feature (`features/*/ui/`); la protección de rutas
  se mantiene con los componentes `ProtectedRoute`/`AdminRoute`.
- TanStack Query para cache de servidor (datos cripto, listados de usuarios).
- Redux Toolkit SOLO para estado global de UI y sesion. NUNCA para cache de
  servidor: esa responsabilidad es exclusiva de TanStack Query.
- Styled Components para estilos, con tokens centralizados (colores, espaciado,
  tipografia). Paleta de marca restringida a la gama azul/cian del logo, ver
  seccion 4.7. `flex` como sistema principal de layout.
- Recharts para graficas y visualizaciones del dashboard.
- Cliente Supabase del lado del navegador solo para el flujo OAuth de Google;
  todo dato de negocio se consume del backend propio.

### Backend (`apps/backend/`)
- Node.js LTS (22.x), Express, TypeScript estricto.
- Monolito modular con arquitectura hexagonal ligera (Ports & Adapters).
- `@supabase/supabase-js` v2 como cliente de acceso a datos y verificacion de
  sesion. Se usa el `service_role` key solo en el backend, nunca expuesto.
- Zod para validacion de entrada en los adaptadores de interfaz (schemas).
- Jest + supertest para pruebas.

### Base de datos: Supabase (PostgreSQL)
Decision fija. Razon: PostgreSQL relacional real (joins, indices, agregaciones
SQL para KPIs y filtros), SDK oficial JS/TS tipado de primera clase, Auth con
Google OAuth integrado, Row Level Security para datos privados, y escala a cero
en el plan gratuito. Firestore queda descartado por su modelo NoSQL y su coste
por lectura de documento, que encajan mal con un dashboard de consultas
relacionales.

### Autenticacion
- Supabase Auth: registro con email/password, login, logout y login con Google
  (OAuth). La sesion se materializa como JWT emitido por Supabase.
- El backend valida cada peticion privada verificando el JWT contra Supabase
  (`auth.getUser(token)`), no confia en datos del cliente.
- Row Level Security activado en todas las tablas con datos por usuario.

### Cloud / despliegue
- Google Cloud Run para frontend y backend, contenedores Docker multietapa
  independientes. Autoescalado horizontal, escala a cero, HTTPS nativo.
- Frontend: bundle de Vite servido por contenedor `nginx`.
- Backend: imagen Node.js que expone la API Express.
- Infraestructura como codigo con Terraform. Proveedor unico: Google Cloud.
  Punto de entrada unico (`main.tf`) parametrizado solo por `environment`.
  Terraform es la unica herramienta de IaC; nada de aprovisionamiento manual
  desde la consola de Google Cloud salvo la creacion inicial del proyecto y la
  habilitacion de la cuenta de servicio para el pipeline.
- Despliegue automatico con GitHub Actions: al hacer merge a la rama principal,
  el workflow construye las imagenes Docker, las publica en Artifact Registry,
  ejecuta `terraform plan` y `terraform apply`, y Cloud Run toma la nueva
  revision. Sin pasos manuales de despliegue.
- Recursos de infraestructura nombrados en ingles, `snake_case` (modulos
  Terraform, variables, outputs).

### Observabilidad
- Logs estructurados en JSON con `pino`. Prohibido `console.log` suelto.
- Instrumentacion del backend con OpenTelemetry para metricas y trazas.
- Stack open source: Loki (logs), Prometheus (metricas), Tempo (trazas),
  Grafana (visualizacion). Coherente con el ecosistema Grafana.
- El backend expone `GET /health` (estado del servicio y dependencias) y
  `GET /metrics` (formato Prometheus).
- El dashboard de Grafana se versiona como JSON en el repositorio
  (`infrastructure/observability/grafana-dashboard.json`), reproducible e
  importable. La fase 9 del plan de trabajo define el detalle de esta capa.

### Desarrollo local
El proyecto debe poder levantarse en local de dos formas, para validar cada
funcionalidad a medida que se construye. La fase 0.5 del plan lo define en
detalle.
- Gestor de paquetes: **yarn 4.x** (gestor principal). El archivo `.nvmrc` fija Node.js LTS 22.11.0.
  Usa `nvm use` si tienes nvm instalado, o configura manualmente la version.
- Sin Docker Compose: la CLI de Supabase (`supabase start`) levanta la base de
  datos local; cada app corre con `yarn dev`. Iteracion rapida.
- Con Docker Compose: `docker compose up --build` levanta todo el entorno.
- Versiones fijas: Docker Engine 29.x, Docker Compose v5.x (plugin V2+, se
  invoca `docker compose` con espacio; el binario `docker-compose` con guion es
  V1 y esta deprecado, no usarlo). El archivo `docker-compose.yml` NO lleva el
  campo `version:`: la Compose Specification actual lo considera obsoleto.
- Los `Dockerfile` de backend y frontend son multietapa con dos targets:
  `development` (hot-reload) y `production` (la imagen que despliega Cloud Run).
  Una sola definicion de imagen sirve para local y para produccion.

### API externa de criptomonedas
- Proveedor: CoinGecko (endpoint publico `/coins/markets` para top 10 y
  `/global` para KPIs de mercado). Razon: API gratuita sin clave para uso basico,
  datos completos de precio, variacion, market cap y volumen, buena estabilidad.
- La integracion vive aislada en un adaptador de infraestructura del modulo
  `market`. Si CoinGecko cambia o falla, solo se toca ese adaptador.

---

## 3. Arquitectura hexagonal ligera

### Backend: capas por modulo
Cada modulo (`auth`, `users`, `market`) tiene cuatro capas estrictas:

- `domain/`: entidades, value objects, tipos puros. Sin imports de Express,
  Supabase ni de la capa de red.
- `application/`: casos de uso y puertos (interfaces in/out).
- `infrastructure/`: adaptadores driven (cliente Supabase, cliente CoinGecko).
- `interfaces/`: adaptadores driving (router Express, schemas Zod).

Comunicacion entre modulos: nunca import directo entre dominios. Si un modulo
necesita a otro, se hace via un puerto explicito.

### Frontend: capas por feature
Cada feature (`auth`, `users`, `dashboard`) tiene cinco capas:

- `domain/`: tipos y reglas puras. Sin React, sin fetch, sin storage.
- `application/`: casos de uso y hooks de negocio.
- `ports/`: interfaces TypeScript.
- `infrastructure/`: adaptadores (API HTTP con TanStack, storage, SDK Supabase).
- `ui/`: componentes presentacionales y containers.

**Regla inviolable**: los componentes UI nunca llaman a `fetch`, `useQuery` ni
a clientes HTTP directamente. Lo hacen a traves de hooks de la capa
`application/`.

---

## 4. Reglas de codigo (no negociables)

### 4.1 Arrow functions no anonimas - estricto (frontend y backend)
Toda funcion se declara como arrow function asignada a una constante con nombre.
Prohibido: `function` declarado, y prohibido pasar arrow functions anonimas como
callbacks reutilizables o como handlers nombrables. Una arrow function que se
pasa como argumento inline trivial (ej. `.map((item) => item.id)`) es aceptable;
cualquier logica con nombre propio debe extraerse a una constante nombrada.

Correcto:
```typescript
const getUserById = async (id: string): Promise<User> => {
  // ...
};

const handleSubmit = (): void => {
  // ...
};
```

Incorrecto:
```typescript
function getUserById(id: string) { /* ... */ }        // declaracion function
export default function Dashboard() { /* ... */ }      // declaracion function
const users = data.filter(function (u) { return u.active; }); // anonima function
```

### 4.2 Componentes React con React.FC y props fuertemente tipadas
Todo componente se declara como arrow function nombrada tipada con `React.FC`.
Las props se definen siempre en una interface o type nombrado, exportable,
sin propiedades implicitas ni `any`. Props opcionales se marcan con `?` y, si
aplica, valor por defecto explicito.

Correcto:
```typescript
interface CryptoCardProps {
  symbol: string;
  price: number;
  changePercent24h: number;
  isFavorite?: boolean;
  onToggleFavorite: (symbol: string) => void;
}

const CryptoCard: React.FC<CryptoCardProps> = ({
  symbol,
  price,
  changePercent24h,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return <article>{/* ... */}</article>;
};

export default CryptoCard;
```

Incorrecto:
```typescript
function CryptoCard(props) { /* ... */ }               // function + props sin tipar
const CryptoCard = ({ symbol }: any) => { /* ... */ }; // any
const CryptoCard = (props: { symbol: string }) => {};  // props inline sin interface, sin React.FC
```

### 4.3 TypeScript estricto
- `strict: true` en `tsconfig`. Prohibido `any`. Sin variables ni imports sin usar.
- No saltar `noUncheckedIndexedAccess`. Tipar retornos de funcion explicitamente.
- ESLint y `tsconfig.base.json` enforzan estas reglas; no desactivarlas con
  comentarios `eslint-disable` salvo justificacion documentada.

### 4.4 Principios
SOLID, KISS, DRY, YAGNI aplicados a codigo e infraestructura. Una sola
responsabilidad por modulo/clase/funcion. No anticipar requisitos no pedidos.

### 4.5 Idempotencia (operaciones de escritura sensibles)
Las operaciones de escritura criticas (creacion de usuario, alta de favorito si
se implementa) deben ser seguras ante reintentos. Como minimo: restricciones
unicas en base de datos que impidan duplicados. No se exige tabla
`idempotency_keys` completa para este reto salvo que el tiempo lo permita.

### 4.6 Reglas de negocio de roles (no negociables)
- Roles del sistema: `"admin"` y `"user"`.
- El registro publico (email/password y login con Google) SIEMPRE crea el
  usuario con rol `"user"`. El cliente nunca puede elegir ni enviar el rol; el
  campo `role` se ignora si llega en el body y se fuerza a `"user"` en el
  backend. El trigger de creacion de `profiles` y la policy de RLS tambien
  imponen `"user"` como valor por defecto, como defensa en profundidad.
- Un usuario con rol `"admin"` solo puede ser creado por otro usuario `"admin"`
  a traves del endpoint protegido de gestion de usuarios. No existe ninguna otra
  via para asignar el rol `"admin"`.
- El primer y unico `"admin"` inicial se genera por seed durante el primer
  despliegue, en la migracion de base de datos. Sus credenciales provienen de
  variables de entorno (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`), nunca
  hardcodeadas. El seed es idempotente: si el admin ya existe, no lo duplica ni
  lo sobrescribe.
- A partir de ese admin inicial, cualquier admin adicional se crea desde la
  aplicacion. La cadena de confianza arranca siempre en el seed.

### 4.7 Paleta de colores del frontend (obligatoria)
La identidad visual usa exclusivamente la gama de azul/cian del logo de MonaBit.
Estan permitidos como maximo TRES colores de marca, todos extraidos del logo:

- `brandPrimary`  = `#0098BF`  (azul principal: botones, enlaces, acentos,
  elementos activos).
- `brandAccent`   = `#00B0C7`  (cian claro: hover, estados secundarios,
  resaltados, series de graficas).
- `brandDark`     = `#231F20`  (negro de marca: texto principal y superficies
  oscuras; tercer color, opcional, usar solo si hace falta).

Reglas:
- Ningun otro color de marca. No introducir verdes, morados, naranjas ni otros
  azules fuera de esta gama. Si un diseno parece necesitar un color nuevo,
  resolverlo con opacidad, tono o luminosidad de los tres anteriores.
- Los neutros funcionales (blanco, escala de grises para fondos, bordes y texto
  deshabilitado) NO cuentan como colores de marca y estan permitidos; toda UI
  los necesita. Mantenerlos neutros, sin tinte azul fuerte.
- Los colores semanticos de estado (exito, error, advertencia) se permiten solo
  donde comunican informacion imprescindible —por ejemplo, el verde/rojo de la
  variacion porcentual de una cripto— y se usan con la minima saturacion
  necesaria. No son colores decorativos ni de marca.
- Todos los colores se definen una sola vez como tokens en el tema de Styled
  Components (`apps/frontend/src/shared/`). Prohibido hardcodear hex en
  componentes; siempre referenciar el token.
- Verificar contraste accesible (WCAG AA) para texto sobre estos colores.
- En dark mode (extra opcional), la paleta de marca se mantiene; solo cambian
  los neutros de fondo y texto.

---

## 5. Convencion de nombres (obligatoria)

Aplica a frontend, backend e infraestructura sin excepcion.

- Variables, funciones, metodos, clases, tipos, interfaces: ingles.
  Ej.: `cryptoPrice`, `getTopCoins`, `MarketStats`.
- Atributos de dominio y campos de DTO/schema: ingles.
  Ej.: `marketCap`, `changePercent24h`, no `capitalizacion` ni `variacion`.
- Valores de enums y union types internos: ingles.
  Ej.: `"active"`, `"inactive"`, `"price_up"`. Los labels visibles en UI siguen
  en espaniol; el valor interno del tipo, no.
- Nombres de archivos y directorios: ingles. `kebab-case` para archivos sueltos,
  `PascalCase` para componentes React.
- Recursos de infraestructura (modulos Terraform, variables, outputs): ingles,
  `snake_case`.
- Columnas y tablas de base de datos: ingles, `snake_case`.
- Excepcion permitida: texto visible al usuario (labels, placeholders, mensajes
  de error en UI) permanece en espaniol. Nada mas.

---

## 6. Idiomas

- Codigo, identificadores, nombres de archivo: ingles.
- Comentarios, documentacion, README, mensajes de commit: espaniol.
- Comunicacion con el usuario en el chat: espaniol.

---

## 7. Conventional Commits

Tipos permitidos: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `build`,
`ci`, `perf`, `style`, `revert`. Mensaje en espaniol. Formato:
`tipo(scope): descripcion breve en minuscula`.
Ejemplo: `feat(dashboard): agregar grafica de variacion del top 10`.

---

## 8. Seguridad

- Ningun secreto real en el repositorio. Variables de entorno documentadas con
  valores de ejemplo en `.env.example` (frontend y backend por separado).
- El `service_role` key de Supabase y la clave de CoinGecko (si se usa plan con
  clave) viven solo en el backend, nunca en el bundle del frontend.
- El frontend solo conoce la `anon` key de Supabase y la URL del backend.
- Toda ruta privada del backend valida el JWT antes de responder.
- Row Level Security activo en tablas con datos por usuario.
- Validar y sanear toda entrada del cliente con Zod en la capa `interfaces/`.
- Manejo de errores centralizado: middleware de error en Express que nunca
  filtra stack traces ni detalles internos al cliente en produccion.
- Credenciales del pipeline: GitHub Actions se autentica contra Google Cloud
  mediante Workload Identity Federation (preferido) o una cuenta de servicio
  con clave guardada como secreto de GitHub Actions. Los secretos de la
  aplicacion (claves de Supabase, CoinGecko) se inyectan en Cloud Run como
  variables de entorno gestionadas por Terraform desde Secret Manager, nunca
  hardcodeadas en el repositorio ni en las imagenes Docker.

### Variables de entorno esperadas
Backend (`apps/backend/.env`):
```
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
COINGECKO_API_BASE=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=optional-demo-key
CORS_ORIGIN=http://localhost:5173
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-me-strong-password
LOG_LEVEL=info
OTEL_SERVICE_NAME=monabit-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```
Frontend (`apps/frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 9. Modelo de datos (resumen)

Tablas en Supabase (PostgreSQL), nombres en `snake_case`:

- `profiles`: `id` (uuid, FK a `auth.users`), `email`, `display_name`,
  `role` (`"admin" | "user"`, DEFAULT `"user"`), `is_active` (bool),
  `created_at`, `updated_at`.
- `user_preferences`: `user_id` (FK), `theme` (`"light" | "dark"`),
  `favorite_coins` (text[]), `updated_at`.
- (Opcional, extra) `price_alerts`: `id`, `user_id`, `coin_id`,
  `target_price`, `direction` (`"above" | "below"`), `is_active`.

`auth.users` la gestiona Supabase Auth. `profiles` se crea por trigger al
registrarse un usuario, siempre con `role = "user"`. La columna `role` tiene
DEFAULT `"user"` a nivel de base de datos como defensa en profundidad. RLS: cada
usuario solo lee/escribe sus propias filas; el rol `admin` puede gestionar todos
los `profiles`. Una policy de RLS impide que un usuario no-admin modifique su
propio campo `role`.

El primer usuario `admin` se crea por seed en la migracion inicial (ver
`CLAUDE.md` seccion 4.6), a partir de `SEED_ADMIN_EMAIL` y
`SEED_ADMIN_PASSWORD`. El seed es idempotente.

---

## 10. Estilo de respuesta esperado

- Tono tecnico, directo, sin rodeos. Profundidad de arquitecto senior.
- Trade-offs explicitos cuando hay alternativas validas.
- Una sola recomendacion principal cuando se pide una decision, sin diluirla en
  alternativas, salvo que se pida comparacion explicita.
- Codigo completo y funcional, sin marcadores `...` ni "implementa el resto aqui".
- Listas y bloques de codigo solo cuando aporten claridad real; preferir prosa.

---

## 11. Estructura del repositorio

```
monabit-dashboard/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── auth/        (domain, application, ports, infrastructure, ui)
│   │   │   │   ├── users/
│   │   │   │   └── dashboard/
│   │   │   ├── shared/          (tokens de estilo, componentes comunes, lib)
│   │   │   ├── app/             (router, providers, store Redux)
│   │   │   └── main.tsx
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── .env.example
│   └── backend/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/        (domain, application, infrastructure, interfaces)
│       │   │   ├── users/
│       │   │   └── market/
│       │   ├── shared/          (config, errores, middleware)
│       │   └── server.ts
│       ├── Dockerfile
│       └── .env.example
├── infrastructure/
│   ├── (Terraform: main.tf, variables, modulos, outputs)
│   └── observability/           (grafana-dashboard.json, config del stack)
├── .github/
│   └── workflows/               (GitHub Actions: CI y despliegue)
├── docs/                        (modelo de datos, observabilidad, despliegue, IA)
├── docker-compose.yml           (entorno local completo, sin campo version:)
├── PLAN-DE-TRABAJO.md
├── CLAUDE.md
└── README.md
```

---

## 12. Entregables del reto (checklist)

- Repositorio con codigo fuente.
- Aplicacion desplegada y funcional en Cloud Run (URL publica frontend + backend).
- README con instrucciones de ejecucion local por las dos vias: con Docker
  Compose y sin Docker Compose.
- README con explicacion general de arquitectura.
- Documentacion de variables de entorno (`.env.example`).
- Explicacion del proveedor cripto elegido (CoinGecko) y por que.
- Explicacion breve del modelo de datos.
- Explicacion breve de autenticacion y seguridad.
- Observabilidad: logs estructurados, `GET /health`, `GET /metrics`, trazas y
  el dashboard de Grafana versionado (`grafana-dashboard.json`).
- Resumen del uso de herramientas de IA durante el desarrollo.
- Lista de limitaciones conocidas y mejoras futuras.
