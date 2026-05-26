# Modelo de Datos - MonaBit Dashboard

## Visión General

El modelo de datos de MonaBit está construido sobre **Supabase** (PostgreSQL + Auth).
Usa **Row Level Security (RLS)** para garantizar que cada usuario acceda solo a sus datos.

## Tablas Principales

### 1. `auth.users` (Supabase Auth)
Tabla gestionada por Supabase. Contiene credenciales de autenticación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `email` | TEXT | Email único del usuario |
| `encrypted_password` | BYTEA | Contraseña encriptada |
| `email_confirmed_at` | TIMESTAMP | Confirmación de email |
| `created_at` | TIMESTAMP | Timestamp de creación |
| `updated_at` | TIMESTAMP | Timestamp de última actualización |

### 2. `profiles` (Datos del usuario)
Extiende `auth.users` con datos de perfil y rol.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK, FK → auth.users | Identificador (mismo del usuario Auth) |
| `email` | TEXT | UNIQUE | Email duplicado de auth.users (desnormalizado para queries) |
| `display_name` | TEXT | NULLABLE | Nombre para mostrar |
| `role` | TEXT | DEFAULT 'user', CHECK ('admin', 'user') | Rol del usuario |
| `is_active` | BOOLEAN | DEFAULT TRUE | Usuario activo/desactivado |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Última actualización |

**RLS Policies:**
- Los usuarios leen/escriben su propio perfil
- Los admins leen todos los perfiles
- Los usuarios no-admin no pueden cambiar su propio `role`

**Trigger:**
- Al crear un usuario en `auth.users`, se inserta automáticamente en `profiles` con `role = 'user'`

### 3. `user_preferences` (Preferencias del usuario)
Configuraciones y preferencias por usuario.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `user_id` | UUID | FK, UNIQUE → profiles | Relación con perfil |
| `theme` | TEXT | DEFAULT 'light', CHECK ('light', 'dark') | Tema de UI |
| `favorite_coins` | TEXT[] | DEFAULT ARRAY[] | Criptomonedas favoritas (símbolos) |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Última actualización |

**RLS Policies:**
- Cada usuario accede solo a sus propias preferencias

### 4. `price_alerts` (Alertas de precio) - *Opcional*
Alertas configurables por precio de cripto.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `user_id` | UUID | FK → profiles | Dueño de la alerta |
| `coin_id` | TEXT | INDEXED | ID de la cripto (ej. 'bitcoin') |
| `target_price` | DECIMAL(20, 8) | - | Precio objetivo |
| `direction` | TEXT | CHECK ('above', 'below') | Alerta si sube o baja |
| `is_active` | BOOLEAN | DEFAULT TRUE | Alerta activa/inactiva |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Última actualización |

**RLS Policies:**
- Cada usuario accede solo a sus propias alertas

## Flujos de Datos

### Registro de usuario (email + password)
1. Usuario completa formulario de registro
2. Frontend llama a `POST /auth/register`
3. Backend valida con Zod, crea usuario en `auth.users` via Supabase
4. Supabase Auth emite JWT
5. Trigger automático crea fila en `profiles` con `role = 'user'`
6. Trigger automático crea fila en `user_preferences`
7. Backend retorna JWT y datos de usuario

### Login con Google (OAuth)
1. Frontend inicia flujo OAuth con Supabase
2. Usuario autoriza en pantalla de consentimiento de Google
3. Supabase intercambia code por JWT
4. Si es primer login, Supabase crea usuario en `auth.users`
5. Trigger automático crea perfiles
6. Frontend almacena JWT en sesión

### Lectura de datos privados (ej. perfil)
1. Frontend envía `GET /users/me` con JWT en header `Authorization`
2. Middleware `requireAuth` valida JWT contra Supabase
3. Backend adjunta `user_id` al request
4. RLS asegura que solo se retorne el perfil del usuario

### Cambio de rol de usuario (solo admin)
1. Admin llama `POST /users/:id/promote`
2. Middleware valida que llamante es admin
3. Backend valida que usuario destino es user (no duplicar admin)
4. Backend actualiza `role = 'admin'` en `profiles`
5. RLS impide que usuario no-admin modifique su propio `role`

## Índices

Para optimizar queries comunes:
- `idx_profiles_email`: Búsqueda por email
- `idx_profiles_role`: Filtrado por rol (admin, user)
- `idx_user_preferences_user_id`: Relación 1:1
- `idx_price_alerts_user_id`: Alertas del usuario
- `idx_price_alerts_coin_id`: Alertas por cripto

## Seguridad

### Row Level Security (RLS)
Cada tabla tiene policies que garantizan:
- Un usuario solo ve sus propios datos (excepto admin)
- Un admin ve todos los datos
- No hay forma para que un usuario se haga admin a sí mismo

### Encriptación de Datos
- Contraseñas: encriptadas por Supabase Auth (bcrypt)
- JWTs: firmados por Supabase (HS256 o RS256 según configuración)
- Variables de entorno sensibles: nunca en repositorio

## Migraciones y Seed

### Correr migraciones
```bash
# Vía Supabase CLI
supabase db reset  # Corre migraciones + seed

# O manualmente
psql -h localhost -d postgres -U postgres -f infrastructure/supabase/migrations/001_initial_schema.sql
```

### Seed del admin inicial
El usuario admin se crea mediante el endpoint `POST /auth/register` con credenciales especiales,
o a través de un script en `apps/backend/src/shared/seed-admin.ts` que se ejecuta al iniciar el backend.

Variables de entorno requeridas:
- `SEED_ADMIN_EMAIL`: Email del admin (ej. `admin@example.com`)
- `SEED_ADMIN_PASSWORD`: Contraseña fuerte (mínimo 12 caracteres, mayúsculas, números, símbolos)

## Futuros Cambios

- Auditoría: agregar tabla `audit_log` con triggers para rastrear cambios
- Soft delete: agregar columna `deleted_at` para borrado lógico
- Versionamiento: guardar histórico de cambios en datos críticos
