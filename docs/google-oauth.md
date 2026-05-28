# Login con Google (OAuth)

Esta guía explica cómo habilitar el inicio de sesión con Google en MonaBit.
La autenticación la gestiona Supabase Auth; el frontend solo dispara el flujo y
recibe la sesión al final.

## Cómo funciona el flujo

El frontend inicia el login con (`apps/frontend/src/features/auth/infrastructure/api-client.ts`):

```js
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

La secuencia es:

```
Frontend  ──►  Supabase  ──►  Google (consentimiento)  ──►  Supabase  ──►  Frontend /auth/callback
```

Punto clave: **Google nunca redirige al frontend directamente, redirige a
Supabase**. Por eso la URL del frontend NO se usa como "redirect URI" en Google;
la redirect URI de Google es siempre la de Supabase.

## Paso 1 — Crear las credenciales OAuth en Google Cloud

1. Google Cloud Console → **APIs y servicios → Pantalla de consentimiento de
   OAuth**. Configúrala (tipo "Externo", nombre de la app, correo de soporte).
   Es obligatorio antes de poder crear credenciales.
2. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de
   OAuth**.
3. **Tipo de aplicación: Aplicación web**.
4. Completa:
   - **Orígenes de JavaScript autorizados**:
     - `https://monabit-prod-frontend-mqeimenz4q-uc.a.run.app`
     - `https://TU_PROJECT_REF.supabase.co`
   - **URIs de redireccionamiento autorizados** (esto es lo crítico, es
     **Supabase**, no el frontend):
     - `https://TU_PROJECT_REF.supabase.co/auth/v1/callback`
5. Al crear, Google muestra el **Client ID** y el **Client Secret**. Cópialos:
   se usan en el Paso 2.

`TU_PROJECT_REF` es el subdominio de tu `SUPABASE_URL` (lo que va antes de
`.supabase.co`). Supabase también muestra la redirect URI exacta a copiar en
Authentication → Providers → Google.

## Paso 2 — Pegar Client ID y Client Secret en Supabase

El Client ID y el Client Secret generados por Google **van en Supabase, no en el
código ni en variables de entorno de la app**. Supabase es quien hace el
intercambio OAuth con Google; el frontend solo conoce la `anon` key y la URL de
Supabase.

1. Supabase Dashboard → **Authentication → Providers → Google**.
2. Activa el proveedor (**Enable Sign in with Google**).
3. Pega:
   - **Client ID** → campo "Client ID" (o "Client IDs").
   - **Client Secret** → campo "Client Secret".
4. Guarda.

## Paso 3 — Configurar las URLs en Supabase

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://monabit-prod-frontend-mqeimenz4q-uc.a.run.app`
- **Redirect URLs** (lista blanca; aquí sí va la ruta del frontend):
  - `https://monabit-prod-frontend-mqeimenz4q-uc.a.run.app/auth/callback`
  - opcional, para desarrollo local: `http://localhost:5173/auth/callback`

## Resumen: dónde va cada valor

| Valor | Dónde se configura |
|---|---|
| URL del frontend (`https://...run.app`) | Google → orígenes de JavaScript · Supabase → Site URL |
| `https://TU_PROJECT_REF.supabase.co/auth/v1/callback` | Google → URIs de redireccionamiento |
| `https://...run.app/auth/callback` | Supabase → Redirect URLs |
| **Client ID** (generado por Google) | Supabase → Authentication → Providers → Google |
| **Client Secret** (generado por Google) | Supabase → Authentication → Providers → Google |

## Errores comunes

- `redirect_uri_mismatch`: pusiste la URL del frontend como redirect URI en
  Google. Debe ser la de Supabase (`.../auth/v1/callback`).
- Login que vuelve al frontend pero no inicia sesión: falta la URL
  `https://.../auth/callback` en la lista **Redirect URLs** de Supabase, o el
  **Site URL** no coincide con el dominio real del frontend.
- "Acceso bloqueado / app no verificada": la pantalla de consentimiento está en
  modo prueba; agrega tu cuenta como usuario de prueba o publica la app.
