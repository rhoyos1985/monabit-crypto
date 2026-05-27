-- Migración 003: permitir que service_role bypass el trigger de campos inmutables.
-- El seed del admin se ejecuta desde el backend con service_role key y necesita
-- promover usuarios a admin. Sin este bypass, el primer admin nunca puede crearse.

CREATE OR REPLACE FUNCTION public.enforce_profile_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Bypass para service_role (operaciones administrativas del backend / seeds)
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Bypass cuando no hay sesión autenticada (conexión directa desde el backend)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Los admins pueden modificar cualquier campo
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Usuarios normales: email, role e id son inmutables
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar tu email';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar tu rol';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar tu ID';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
