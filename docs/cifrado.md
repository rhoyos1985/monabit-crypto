# Cifrado de extremo a extremo (auth y usuarios)

Como capa adicional de seguridad sobre HTTPS, las peticiones y respuestas de los
endpoints sensibles (`/auth/*` y `/users/*`) viajan cifradas a nivel de
aplicación con un esquema híbrido (envelope), estandarizado por JWE.

## Formato del mensaje

El cuerpo HTTP de las rutas cifradas tiene esta forma:

```json
{
  "message": {
    "payload": "<datos cifrados con una clave AES (A256GCM)>",
    "signed": "<esa clave AES envuelta con RSA-OAEP-256>"
  }
}
```

- `payload`: los datos (request o response) cifrados con una clave simétrica AES
  aleatoria por mensaje.
- `signed`: esa clave simétrica, envuelta (cifrada) con la llave pública RSA del
  receptor. Solo quien tenga la privada correspondiente puede recuperarla y
  descifrar el `payload`.

Se implementa con la librería `jose` (JWE: `RSA-OAEP-256` para envolver la clave +
`A256GCM` para el contenido).

## Flujo (handshake asimétrico)

```
1. Frontend  GET /crypto/public-key            -> obtiene la llave pública del backend
2. Frontend  genera su propio par de llaves (por sesión, en memoria)
3. Frontend  POST /auth/login                  -> body cifrado con la pública del backend
             header X-Client-Public-Key: <SPKI del cliente en base64>
4. Backend   descifra el body con su privada, procesa, y cifra la respuesta
             con la pública del cliente (la del header)
5. Frontend  descifra la respuesta con su privada
```

- La llave **privada del backend** nunca sale del servidor.
- La llave **privada del cliente** se genera en el navegador y vive solo en
  memoria durante la sesión.
- El backend es retrocompatible: si una petición llega sin cabecera ni `message`,
  el middleware no cifra ni descifra (pasa en claro).

## Variables de entorno

Backend (`apps/backend/.env`):

- `CRYPTO_PRIVATE_KEY`: llave privada RSA en PEM (PKCS8).
- `CRYPTO_PUBLIC_KEY`: llave pública RSA en PEM (SPKI).

En desarrollo, si no se definen, el backend genera un par efímero al arrancar.
En producción son obligatorias (y deben ser estables y compartidas entre
instancias de Cloud Run; por eso se gestionan como secreto, no efímeras).

Frontend (`apps/frontend/.env`):

- `VITE_ENCRYPTION_ENABLED`: `true` por defecto. Poner `false` para desactivar el
  cifrado del lado del cliente (útil en pruebas o despliegues sin llaves aún
  provisionadas).

## Generar el par de llaves

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl rsa -in private.pem -pubout -out public.pem
```

`private.pem` → `CRYPTO_PRIVATE_KEY`; `public.pem` → `CRYPTO_PUBLIC_KEY`. Las
variables aceptan el PEM en una sola línea usando `\n` como salto.

## Provisión en producción

1. Generar el par de llaves (arriba).
2. Agregar en GitHub (environment `production`) los secrets `CRYPTO_PRIVATE_KEY`
   y `CRYPTO_PUBLIC_KEY`.
3. Aplicar Terraform: la privada se guarda en Secret Manager y se inyecta al
   backend de Cloud Run como `CRYPTO_PRIVATE_KEY`; la pública va como variable de
   entorno `CRYPTO_PUBLIC_KEY`.
4. Redesplegar el backend para tomar la nueva revisión.

Importante: provisiona las llaves **antes** de servir el frontend con cifrado
activado; de lo contrario el handshake fallará (el backend no podría descifrar).

## Alcance

Solo se cifran `/auth/*` y `/users/*`. Los datos de mercado (`/market`) y demás
endpoints públicos viajan en claro (siguen protegidos por HTTPS). Esta capa es
defensa en profundidad: no reemplaza TLS, lo complementa.
