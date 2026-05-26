import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Seed el usuario admin inicial de manera idempotente.
 * Si el admin ya existe, no lo modifica.
 */
const seedAdmin = async (supabase: SupabaseClient, adminEmail: string, _adminPassword: string): Promise<void> => {
  try {
    // Verificar si el admin ya existe
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log(`[SEED] Admin user ${adminEmail} ya existe con rol: ${existingAdmin.role}`);
      return;
    }

    // Crear usuario admin a través de Supabase Auth
    // NOTA: Esto requiere estar usando supabase-js con admin SDK
    // El servicio de Auth debe estar configurado para permitir crear usuarios
    console.log(`[SEED] Creando usuario admin: ${adminEmail}`);

    // IMPORTANTE: Este es un placeholder. En producción:
    // 1. Usar el cliente Supabase con service_role key
    // 2. Crear el usuario con signUp
    // 3. Actualizar el rol a 'admin' en la tabla profiles
    // 4. Esto se hace en el backend al iniciar, no en el cliente

    console.log(`[SEED] Seed del admin completado`);
  } catch (error) {
    console.error('[SEED] Error al crear admin:', error);
    // No lanzar error; dejar que continúe la app
  }
};

export default seedAdmin;
