import { SupabaseClient } from '@supabase/supabase-js';
import { IUserRepository } from '../application/ports.js';
import { UserDTO, CreateUserInput, UserRole } from '../domain/types.js';
import { HTTPBadRequest, HTTPConflict } from '../../../shared/http-error.js';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  avatar_url: string | null;
  auth_provider: 'email' | 'google';
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mapProfileToUser = (profile: Profile): UserDTO => ({
  id: profile.id,
  email: profile.email,
  firstName: profile.first_name || undefined,
  lastName: profile.last_name || undefined,
  city: profile.city || undefined,
  state: profile.state || undefined,
  country: profile.country || undefined,
  avatarUrl: profile.avatar_url || undefined,
  authProvider: profile.auth_provider || 'email',
  role: (profile.role || 'user') as UserRole,
  isActive: profile.is_active,
  createdAt: new Date(profile.created_at),
  updatedAt: new Date(profile.updated_at),
});

export const createSupabaseUserRepository = (supabase: SupabaseClient): IUserRepository => {
  const findById = async (id: string): Promise<UserDTO | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single<Profile>();

    if (error || !data) return null;

    return mapProfileToUser(data);
  };

  const findByEmail = async (email: string): Promise<UserDTO | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single<Profile>();

    if (error || !data) return null;

    return mapProfileToUser(data);
  };

  const listAll = async (): Promise<UserDTO[]> => {
    const result = await supabase.from('profiles').select('*');

    if (result.error || !result.data) return [];

    return (result.data as Profile[]).map((profile) => mapProfileToUser(profile));
  };

  const create = async (user: CreateUserInput & { id: string }): Promise<UserDTO> => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        first_name: user.firstName || null,
        last_name: user.lastName || null,
        city: user.city || null,
        state: user.state || null,
        country: user.country || null,
        auth_provider: 'email',
        role: user.role === 'admin' ? 'admin' : 'user',
        is_active: true,
      })
      .select()
      .single<Profile>();

    if (error || !data) {
      if (error?.message?.includes('duplicate')) {
        throw new HTTPConflict('Este email ya está registrado.');
      }
      throw new HTTPBadRequest(`Error al crear usuario: ${error?.message || 'Error desconocido'}`);
    }

    return mapProfileToUser(data);
  };

  const update = async (id: string, data: Partial<UserDTO>): Promise<UserDTO> => {
    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) {
      updateData.first_name = data.firstName || null;
    }
    if (data.lastName !== undefined) {
      updateData.last_name = data.lastName || null;
    }
    if (data.city !== undefined) {
      updateData.city = data.city || null;
    }
    if (data.state !== undefined) {
      updateData.state = data.state || null;
    }
    if (data.country !== undefined) {
      updateData.country = data.country || null;
    }
    if (data.avatarUrl !== undefined) {
      updateData.avatar_url = data.avatarUrl || null;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.isActive !== undefined) {
      updateData.is_active = data.isActive;
    }
    if (data.updatedAt !== undefined) {
      updateData.updated_at = data.updatedAt.toISOString();
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single<Profile>();

    if (error || !updatedProfile) {
      throw new HTTPBadRequest(`Error al actualizar usuario: ${error?.message || 'Error desconocido'}`);
    }

    return mapProfileToUser(updatedProfile);
  };

  return { findById, findByEmail, listAll, create, update };
};
