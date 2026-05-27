import { User, AuthToken, AuthCredentials } from '../domain/types.js';

/**
 * Puerto de salida: Servicio de autenticación y gestión de usuarios.
 * Implementado por el adaptador Supabase.
 */
export interface IAuthService {
  /**
   * Registrar un nuevo usuario.
   * El rol siempre será 'user', independientemente de lo que envíe el cliente.
   */
  registerUser(credentials: AuthCredentials): Promise<{ user: User; token: AuthToken }>;

  /**
   * Verificar credenciales y emitir token JWT.
   */
  loginUser(credentials: AuthCredentials): Promise<{ user: User; token: AuthToken }>;

  /**
   * Obtener usuario a partir de un JWT.
   * Lanza error si el token es inválido o expirado.
   */
  getCurrentUser(token: string): Promise<User>;

  /**
   * Cerrar sesión del usuario (por ahora es no-op, pero queda disponible).
   */
  logoutUser(): Promise<void>;

  /**
   * Cambiar la contraseña del usuario autenticado.
   * Solo permitido si el authProvider del usuario es 'email'.
   * Requiere validar la contraseña actual antes del cambio.
   */
  changePassword(userId: string, email: string, currentPassword: string, newPassword: string): Promise<void>;
}
