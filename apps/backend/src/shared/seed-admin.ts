import { SupabaseClient } from '@supabase/supabase-js';
import logger from './logger.js';

interface ExistingProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Seed del usuario admin inicial. Idempotente:
 * - Si ya existe con rol admin: no hace nada.
 * - Si existe con rol user: lo promueve a admin.
 * - Si no existe: lo crea (auth.users + promoción del profile a admin).
 *
 * Requiere que `supabase` esté inicializado con la service_role key.
 */
const seedAdmin = async (
  supabase: SupabaseClient,
  adminEmail: string,
  adminPassword: string
): Promise<void> => {
  if (!adminEmail || !adminPassword) {
    logger.warn('[SEED] SEED_ADMIN_EMAIL o SEED_ADMIN_PASSWORD no están definidos, se omite seed');
    return;
  }

  try {
    const existingResult = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', adminEmail)
      .maybeSingle<ExistingProfile>();

    const existingProfile = existingResult.data;

    if (existingProfile) {
      if (existingProfile.role === 'admin') {
        logger.info('[SEED] Usuario admin ya existe, omitiendo creación', { email: adminEmail });
        return;
      }

      const { error: promoteError } = await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', existingProfile.id);

      if (promoteError) {
        logger.error('[SEED] No se pudo promover usuario existente a admin', {
          email: adminEmail,
          error: promoteError.message,
        });
        return;
      }

      logger.info('[SEED] Usuario existente promovido a admin', { email: adminEmail });
      return;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Administrador',
        last_name: 'MonaBit',
      },
    });

    if (createError || !created.user) {
      logger.error('[SEED] No se pudo crear el usuario admin', {
        email: adminEmail,
        error: createError?.message ?? 'usuario nulo',
      });
      return;
    }

    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .eq('id', created.user.id);

    if (roleError) {
      logger.error('[SEED] Usuario admin creado pero no se pudo asignar rol admin', {
        email: adminEmail,
        userId: created.user.id,
        error: roleError.message,
      });
      return;
    }

    logger.info('[SEED] Usuario admin creado exitosamente', {
      email: adminEmail,
      userId: created.user.id,
    });
  } catch (error) {
    logger.error('[SEED] Error inesperado al ejecutar seed del admin', {
      email: adminEmail,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default seedAdmin;
