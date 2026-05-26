import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../app/store.js';
import { setLoading, setError, setSession, clearSession, setUser } from '../../../app/slices/session.js';
import { createAuthRepository } from '../infrastructure/api-client.js';
import type { LoginInput, RegisterInput } from '../domain/types.js';

const authRepository = createAuthRepository();

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(
    async (input: LoginInput) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const result = await authRepository.login(input);
        dispatch(
          setSession({
            user: result.user,
            token: result.token.access_token,
          })
        );
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Login failed';
        dispatch(setError(errorMsg));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );
};

export const useRegister = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(
    async (input: RegisterInput) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const result = await authRepository.register(input);
        dispatch(
          setSession({
            user: result.user,
            token: result.token.access_token,
          })
        );
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Registration failed';
        dispatch(setError(errorMsg));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );
};

export const useLogout = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(async () => {
    dispatch(setLoading(true));
    try {
      await authRepository.logout();
      dispatch(clearSession());
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(clearSession());
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);
};

export const useCurrentUser = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.session);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (token && !user) {
        try {
          dispatch(setLoading(true));
          const currentUser = await authRepository.getCurrentUser(token);
          dispatch(setUser(currentUser));
        } catch (error) {
          console.error('Failed to load current user:', error);
          dispatch(clearSession());
        } finally {
          dispatch(setLoading(false));
        }
      }
    };

    loadCurrentUser();
  }, [token, user, dispatch]);

  return user;
};

export const useAuth = () => {
  const { user, token, isLoading, error } = useSelector((state: RootState) => state.session);

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!token && !!user,
  };
};
