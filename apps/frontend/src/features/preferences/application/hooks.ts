import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store.js';
import type { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';
import { createPreferencesRepository } from '../infrastructure/api-client.js';

const preferencesRepository = createPreferencesRepository();

const PREFERENCES_KEY = ['preferences', 'me'];

export const usePreferences = () => {
  const token = useSelector((state: RootState) => state.session.token);
  return useQuery<UserPreferences, Error>({
    queryKey: PREFERENCES_KEY,
    queryFn: () => preferencesRepository.getMyPreferences(token!),
    enabled: !!token,
    staleTime: 60_000,
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  const token = useSelector((state: RootState) => state.session.token);

  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => {
      if (!token) throw new Error('No hay sesión activa');
      return preferencesRepository.updateMyPreferences(input, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCES_KEY, data);
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const token = useSelector((state: RootState) => state.session.token);

  return useMutation({
    mutationFn: (coinId: string) => {
      if (!token) throw new Error('No hay sesión activa');
      return preferencesRepository.toggleFavorite(coinId, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCES_KEY, data);
    },
  });
};
