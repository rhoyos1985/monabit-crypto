import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store.js';
import type { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';
import { createPreferencesRepository } from '../infrastructure/api-client.js';

const preferencesRepository = createPreferencesRepository();

const PREFERENCES_KEY = ['preferences', 'me'];

export const usePreferences = () => {
  // La autenticacion viaja en la cookie httpOnly; solo se condiciona la query a
  // que exista una sesion de usuario activa en el estado.
  const isAuthenticated = useSelector((state: RootState) => !!state.session.user);
  return useQuery<UserPreferences, Error>({
    queryKey: PREFERENCES_KEY,
    queryFn: () => preferencesRepository.getMyPreferences(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => preferencesRepository.updateMyPreferences(input),
    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCES_KEY, data);
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (coinId: string) => preferencesRepository.toggleFavorite(coinId),
    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCES_KEY, data);
    },
  });
};
