-- Seed script: Crear usuario admin inicial
-- Este script es idempotente: si el admin ya existe, no lo modifica

-- NOTA: Este script debe ejecutarse después de que la BD esté lista y el usuario
-- sea creado a través de Supabase Auth. Por ahora es una plantilla que documenta
-- cómo se crearía el admin.

-- En una solución de producción, esto se ejecutaría a través de una API call
-- a Supabase Auth con las credenciales de SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD

-- Ejemplo de cómo verificar si existe el admin:
SELECT id, email, role FROM public.profiles WHERE email = '${SEED_ADMIN_EMAIL}' LIMIT 1;

-- Nota: El campo `role` tiene DEFAULT 'user' y una política de RLS impide
-- que usuarios no-admin lo cambien. El admin inicial se crea fuera de banda
-- mediante Supabase Auth console o mediante un script en backend/src/scripts/seed-admin.ts
