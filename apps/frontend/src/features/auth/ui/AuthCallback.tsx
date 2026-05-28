import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { supabase } from '../../../shared/supabase.js';
import { setSession, setError, clearSession } from '../../../app/slices/session.js';
import { createAuthRepository } from '../infrastructure/api-client.js';
import type { AppDispatch } from '../../../app/store.js';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, ${(props) => props.theme.brandPrimary} 0%, ${(props) => props.theme.brandAccent} 100%);
  color: white;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Message = styled.p`
  font-size: 16px;
  font-weight: 500;
`;

const authRepository = createAuthRepository();

interface AuthCallbackProps {}

const AuthCallback: React.FC<AuthCallbackProps> = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const processCallback = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          throw new Error('No se pudo obtener la sesión de Google');
        }

        const token = data.session.access_token;
        const user = await authRepository.getCurrentUser(token);

        dispatch(setSession({ user, token }));
        void navigate({ to: '/dashboard' });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al procesar autenticación';
        dispatch(setError(errorMsg));
        dispatch(clearSession());
        void navigate({ to: '/login' });
      }
    };

    void processCallback();
  }, [dispatch, navigate]);

  return (
    <Container>
      <Spinner />
      <Message>Procesando autenticación...</Message>
    </Container>
  );
};

export default AuthCallback;
