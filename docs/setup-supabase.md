# Setup de Supabase - Ambiente Local y Producción

## Ambiente Local (sin Docker)

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

Verifica la instalación:
```bash
supabase --version
```

### 2. Iniciar base de datos local

```bash
supabase start
```

Esto levanta:
- **Postgres**: puerto 5432
- **Supabase Auth**: puerto 9999
- **Supabase Studio** (UI): http://localhost:54323

La primera vez tarda algunos segundos. Espera a que veas:
```
Started supabase local development server.
...
API URL: http://localhost:54321
anon key: ...
service_role key: ...
```

### 3. Aplicar migraciones

```bash
supabase db reset
```

Esto corre todas las migraciones en `infrastructure/supabase/migrations/` y ejecuta el seed.

### 4. Obtener credenciales

Las credenciales se muestran cuando `supabase start` termina:
- `SUPABASE_URL`: Mostrada en output, normalmente `http://localhost:54321`
- `anon key`: Pública, usar en frontend
- `service_role key`: Privada, usar solo en backend

Copia estas al archivo `.env` de backend y frontend.

### 5. Ver datos en Supabase Studio

Abre http://localhost:54323 en el navegador para explorar las tablas, editar datos y ver logs.

## Ambiente de Producción

### 1. Crear proyecto en Supabase Cloud

1. Ir a https://supabase.com
2. Sign up o login
3. Crear nuevo proyecto
4. Seleccionar región más cercana
5. Esperar a que se provisione (5-10 min)

### 2. Obtener credenciales de producción

En el dashboard de Supabase:
1. Project Settings → API
2. Copiar `Project URL` (es el `SUPABASE_URL`)
3. Copiar `anon` key
4. Copiar `service_role` key (guardar con mucho cuidado)

### 3. Aplicar migraciones a producción

**Opción A: Usar Supabase CLI**
```bash
supabase db push --project-ref <your-project-ref>
```

**Opción B: Ejecutar migraciones manualmente**
```bash
# Conectar a DB de producción
psql postgresql://<user>:<password>@<host>:5432/<database>

# Copiar y pegar contenido de infrastructure/supabase/migrations/001_initial_schema.sql
```

### 4. Configurar Google OAuth (opcional)

1. En Google Cloud Console, crear credenciales OAuth 2.0
2. En Supabase dashboard → Authentication → Providers → Google
3. Pegar Client ID y Client Secret
4. Agregar URLs autorizadas:
   - Desarrollo: `http://localhost:5173`
   - Producción: `https://tu-dominio.com`

### 5. Actualizar variables de entorno

En tu proveedor de cloud (Google Cloud Secret Manager), agregar:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
```

## Comandos útiles

```bash
# Ver status de servicios locales
supabase status

# Ver logs de postgres local
supabase logs --tail -1000

# Parar servicios locales
supabase stop

# Parar y limpiar (perder datos)
supabase stop --no-backup

# Push migraciones locales a un proyecto remoto
supabase db push --project-ref <ref>

# Pull migraciones remotas a local
supabase db pull

# Ver diferencias entre local y remoto
supabase db diff
```

## Troubleshooting

### Puerto 5432 en uso
```bash
# Ver qué está usando el puerto
lsof -i :5432

# Matarlo
kill -9 <PID>

# O cambiar puerto en supabase start:
supabase start --port 5433
```

### Supabase Studio no accesible
```bash
# El puerto del Studio es aleatorio, verlo en output de supabase start
# O forzar un puerto:
supabase start --studio-port 3000
```

### Migraciones no aplicadas
```bash
# Reset fuerza la aplicación de todas las migraciones
supabase db reset --dry-run  # Ver qué haría

# Luego ejecutar
supabase db reset
```

### JWT inválido
- Verificar que el JWT viene en header `Authorization: Bearer <token>`
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` es la correcta en backend
- En local, las keys de Supabase CLI son diferentes a producción
