-- Migración 002: extender campos del perfil de usuario
-- Reemplaza display_name por first_name + last_name y agrega ubicación + avatar

-- Agregar nuevos campos a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'google'));

-- Migrar display_name a first_name (split por primer espacio)
UPDATE public.profiles
SET
  first_name = COALESCE(first_name, SPLIT_PART(display_name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(SUBSTRING(display_name FROM POSITION(' ' IN display_name || ' ') + 1), ''))
WHERE display_name IS NOT NULL;

-- Quitar columna display_name (la reemplazamos)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;

-- Reemplazar el trigger para capturar metadatos de OAuth (Google)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider TEXT;
  meta_first_name TEXT;
  meta_last_name TEXT;
  meta_full_name TEXT;
  meta_avatar TEXT;
BEGIN
  -- Detectar el provider (email vs google)
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- Extraer metadata según el provider
  IF provider = 'google' THEN
    meta_first_name := NEW.raw_user_meta_data->>'given_name';
    meta_last_name := NEW.raw_user_meta_data->>'family_name';
    meta_full_name := NEW.raw_user_meta_data->>'full_name';
    meta_avatar := NEW.raw_user_meta_data->>'avatar_url';

    -- Fallback: si no vienen first/last separados, partir el nombre completo
    IF meta_first_name IS NULL AND meta_full_name IS NOT NULL THEN
      meta_first_name := SPLIT_PART(meta_full_name, ' ', 1);
      meta_last_name := NULLIF(SUBSTRING(meta_full_name FROM POSITION(' ' IN meta_full_name || ' ') + 1), '');
    END IF;
  ELSE
    -- Para registro por email tomamos los campos enviados en metadata si existen
    meta_first_name := NEW.raw_user_meta_data->>'first_name';
    meta_last_name := NEW.raw_user_meta_data->>'last_name';
    meta_avatar := NULL;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    city,
    state,
    country,
    avatar_url,
    auth_provider,
    role,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    meta_first_name,
    meta_last_name,
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'country',
    meta_avatar,
    provider,
    'user',
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE UPDATE: bloquea cambios de email y role para usuarios no admin
-- Mantiene la policy de UPDATE simple (sin recursión) y aplica las reglas a nivel de fila
CREATE OR REPLACE FUNCTION public.enforce_profile_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Los admins pueden modificar cualquier campo
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Para usuarios no admin: email y role no se pueden cambiar
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

DROP TRIGGER IF EXISTS enforce_profile_immutable_fields_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_immutable_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_immutable_fields();
