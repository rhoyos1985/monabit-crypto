import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../app/store.js';
import { setSession, clearSession, setUser } from '../../../app/slices/session.js';
import { createAuthRepository } from '../infrastructure/api-client.js';
import type { LoginInput, RegisterInput, UpdateProfileInput } from '../domain/types.js';
import type { ChangePasswordInput } from '../ports/index.js';

const authRepository = createAuthRepository();

// Clave del cache de react-query para la sesion actual (GET /auth/me).
export const AUTH_ME_KEY = ['auth', 'me'] as const;

// Patron hibrido: react-query gestiona el ciclo de las llamadas al servidor
// (mutations y query de /auth/me), y el resultado se materializa en el slice de
// sesion de Redux, que es lo que lee la UI (useAuth). El cache de react-query se
// mantiene sincronizado para reusar la sesion y deduplicar peticiones.

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: LoginInput) => authRepository.login(input),
    onSuccess: (result) => {
      queryClient.setQueryData(AUTH_ME_KEY, result.user);
      dispatch(setSession({ user: result.user }));
    },
  });

  return mutation.mutateAsync;
};

export const useRegister = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: RegisterInput) => authRepository.register(input),
    onSuccess: (result) => {
      queryClient.setQueryData(AUTH_ME_KEY, result.user);
      dispatch(setSession({ user: result.user }));
    },
  });

  return mutation.mutateAsync;
};

export const useLogout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authRepository.logout(),
    // La sesion se limpia siempre, aunque el endpoint falle, para no dejar al
    // usuario en un estado autenticado inconsistente en el cliente.
    onSettled: () => {
      queryClient.setQueryData(AUTH_ME_KEY, null);
      dispatch(clearSession());
    },
  });

  // El logout nunca propaga error al consumidor: la sesion local ya quedo
  // limpia en onSettled, asi que cerrar sesion siempre "tiene exito" en el cliente.
  const logout = async (): Promise<void> => {
    try {
      await mutation.mutateAsync();
    } catch {
      // Ignorado a proposito: la sesion ya se limpio.
    }
  };

  return logout;
};

export const useUpdateProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => authRepository.updateMe(input),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(AUTH_ME_KEY, updatedUser);
      dispatch(setUser(updatedUser));
    },
  });

  return mutation.mutateAsync;
};

export const useChangePassword = () => {
  const mutation = useMutation({
    mutationFn: (input: ChangePasswordInput) => authRepository.changePassword(input),
  });

  return mutation.mutateAsync;
};

export const useGoogleLogin = () => {
  const mutation = useMutation({
    mutationFn: () => authRepository.signInWithGoogle(),
  });

  return mutation.mutateAsync;
};

// Rehidrata la sesion al cargar la app: react-query consulta GET /auth/me (el JS
// no puede leer la cookie httpOnly) y el resultado se vuelca al slice de sesion.
// Se deshabilita una vez rehidratada para no repetir la consulta.
export const useSessionBootstrap = (): void => {
  const dispatch = useDispatch<AppDispatch>();
  const bootstrapped = useSelector((state: RootState) => state.session.bootstrapped);

  const { data, isSuccess, isError } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: () => authRepository.getCurrentUser(),
    enabled: !bootstrapped,
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setSession({ user: data }));
    } else if (isError) {
      dispatch(clearSession());
    }
  }, [isSuccess, isError, data, dispatch]);
};

export const useAuth = () => {
  const { user, isLoading, error, bootstrapped } = useSelector((state: RootState) => state.session);

  return {
    user,
    isLoading,
    error,
    bootstrapped,
    isAuthenticated: !!user,
  };
};
