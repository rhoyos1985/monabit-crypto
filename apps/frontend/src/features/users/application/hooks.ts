import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createUserRepository } from '../infrastructure/users-api-client.js';
import type { User, CreateUserInput, UpdateUserInput } from '../domain/types.js';

const userRepository = createUserRepository();

export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: () => userRepository.listUsers(),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => userRepository.createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      userRepository.updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userRepository.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
