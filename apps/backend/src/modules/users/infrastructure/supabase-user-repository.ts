import { SupabaseClient } from '@supabase/supabase-js';
import { IUserRepository } from '../application/ports.js';
import { UserDTO, CreateUserInput } from '../domain/types.js';
import { HTTPBadRequest, HTTPConflict } from '../../../shared/http-error.js';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mapProfileToUser = (profile: Profile): UserDTO => ({
  id: profile.id,
  email: profile.email,
  displayName: profile.display_name || undefined,
  role: (profile.role || 'user') as 'admin' | 'user',
  isActive: profile.is_active,
  createdAt: new Date(profile.created_at),
  updatedAt: new Date(profile.updated_at),
});

export const createSupabaseUserRepository = (supabase: SupabaseClient): IUserRepository => {
  const findById = async (id: string): Promise<UserDTO | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();

    if (error || !data) return null;

    return mapProfileToUser(data as Profile);
  };

  const findByEmail = async (email: string): Promise<UserDTO | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();

    if (error || !data) return null;

    return mapProfileToUser(data as Profile);
  };

  const listAll = async (): Promise<UserDTO[]> => {
    const { data, error } = await supabase.from('profiles').select('*');

    if (error || !data) return [];

    return data.map((profile: Profile) => mapProfileToUser(profile));
  };

  const create = async (user: CreateUserInput & { id: string }): Promise<UserDTO> => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        display_name: user.displayName || null,
        role: user.role === 'admin' ? 'admin' : 'user',
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      if (error?.message?.includes('duplicate')) {
        throw new HTTPConflict('Este email ya está registrado.');
      }
      throw new HTTPBadRequest(`Error al crear usuario: ${error?.message || 'Error desconocido'}`);
    }

    return mapProfileToUser(data as Profile);
  };

  const update = async (id: string, data: Partial<UserDTO>): Promise<UserDTO> => {
    const updateData: Record<string, unknown> = {};

    if (data.displayName !== undefined) {
      updateData.display_name = data.displayName || null;
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
      .single();

    if (error || !updatedProfile) {
      throw new HTTPBadRequest(`Error al actualizar usuario: ${error?.message || 'Error desconocido'}`);
    }

    return mapProfileToUser(updatedProfile as Profile);
  };

  return { findById, findByEmail, listAll, create, update };
};
