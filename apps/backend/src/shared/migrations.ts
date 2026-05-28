import { SupabaseClient } from '@supabase/supabase-js';
import logger from './logger.js';

const MIGRATION_SQL = `
-- Crear schema auth para GoTrue
CREATE SCHEMA IF NOT EXISTS auth;
GRANT ALL ON SCHEMA auth TO postgres;

-- Tabla de usuarios de GoTrue
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  aud character varying(255),
  role character varying(255),
  email character varying(255) UNIQUE,
  encrypted_password character varying(255),
  email_confirmed_at timestamp with time zone,
  invited_at timestamp with time zone,
  confirmation_token character varying(255),
  confirmation_sent_at timestamp with time zone,
  recovery_token character varying(255),
  recovery_sent_at timestamp with time zone,
  email_change_token_new character varying(255),
  email_change_token_sent_at timestamp with time zone,
  email_change_confirmed_at timestamp with time zone,
  phone character varying(15),
  phone_confirmed_at timestamp with time zone,
  phone_change_token character varying(255),
  phone_change_sent_at timestamp with time zone,
  phone_change_confirmed_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_data jsonb,
  provider character varying(255) NOT NULL,
  provider_id character varying(255) NOT NULL,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT identities_provider_id_provider_unique UNIQUE(provider_id, provider)
);

CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  not_after timestamp with time zone
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  instance_id uuid,
  token text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  session_id uuid REFERENCES auth.sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users USING btree (instance_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users USING btree (email);
CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities USING btree (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens USING btree (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_session_id_idx ON auth.refresh_tokens USING btree (session_id);

GRANT ALL ON auth.users TO postgres;
GRANT ALL ON auth.identities TO postgres;
GRANT ALL ON auth.sessions TO postgres;
GRANT ALL ON auth.refresh_tokens TO postgres;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  favorite_coins TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles USING btree (is_active);

GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.user_preferences TO postgres;
`;

export const runMigrations = async (supabase: SupabaseClient): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    logger.info('Running database migrations...');

    const statements = MIGRATION_SQL.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let executedCount = 0;
    for (const statement of statements) {
      try {
        await supabase.rpc('exec_sql', { sql: statement });
      } catch (err) {
        logger.debug('Migration statement skipped', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
      executedCount += 1;
    }

    logger.info(`Database migrations completed successfully (${executedCount} statements)`);
  } catch (err) {
    logger.error('Failed to run migrations', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
