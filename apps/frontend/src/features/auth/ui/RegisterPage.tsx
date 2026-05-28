import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRegister, useGoogleLogin } from '../application/hooks.js';
import CitySelect from '../../locations/ui/CitySelect.js';
import type { CityLocation } from '../../locations/domain/types.js';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
  background: linear-gradient(135deg, ${(props) => props.theme.brandPrimary} 0%, ${(props) => props.theme.brandAccent} 100%);
`;

const Card = styled.div`
  background: ${(props) => props.theme.surface.surface};
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 460px;

  ${(props) => props.theme.media.sm} {
    padding: 40px;
  }
`;

const Title = styled.h1`
  margin: 0 0 20px 0;
  font-size: 22px;
  color: ${(props) => props.theme.surface.textPrimary};
  text-align: center;

  ${(props) => props.theme.media.sm} {
    font-size: 26px;
    margin: 0 0 24px 0;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  ${(props) => props.theme.media.sm} {
    flex-direction: row;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.surface.textPrimary};
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid ${(props) => props.theme.surface.border};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  width: 100%;
  background: ${(props) => props.theme.surface.inputBackground};
  color: ${(props) => props.theme.surface.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.brandPrimary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.brandPrimary}20;
  }
`;

const Button = styled.button`
  padding: 12px;
  background: ${(props) => props.theme.brandPrimary};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.brandAccent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 0;
  color: ${(props) => props.theme.surface.textMuted};
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${(props) => props.theme.surface.border};
  }

  &::before {
    margin-right: 12px;
  }

  &::after {
    margin-left: 12px;
  }
`;

const GoogleButton = styled.button`
  padding: 12px;
  background: ${(props) => props.theme.surface.surface};
  color: ${(props) => props.theme.surface.textPrimary};
  border: 1px solid ${(props) => props.theme.surface.border};
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  transition: background 0.2s, box-shadow 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.surface.background};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const ErrorMessage = styled.div`
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  font-size: 14px;
`;

const LinkText = styled.p`
  text-align: center;
  margin: 18px 0 0 0;
  font-size: 14px;
  color: ${(props) => props.theme.surface.textSecondary};

  a {
    color: ${(props) => props.theme.brandPrimary};
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

interface RegisterPageProps {}

const RegisterPage: React.FC<RegisterPageProps> = () => {
  const navigate = useNavigate();
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState<CityLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError('Por favor selecciona una ciudad de la lista');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        city: location.city,
        state: location.state,
        country: location.country,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await googleLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>Crear cuenta</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={(e) => void handleSubmit(e)}>
          <Row>
            <FormGroup>
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="given-name"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="family-name"
              />
            </FormGroup>
          </Row>
          <FormGroup>
            <Label htmlFor="city">Ciudad</Label>
            <CitySelect
              id="city"
              value={location}
              onChange={setLocation}
              disabled={isLoading}
              placeholder="Ej. Cartagena - Bolivar - Colombia"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </FormGroup>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Crear cuenta'}
          </Button>
        </Form>
        <Divider>O</Divider>
        <GoogleButton type="button" onClick={() => void handleGoogleLogin()} disabled={isLoading}>
          <GoogleIcon />
          Continuar con Google
        </GoogleButton>
        <LinkText>
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </LinkText>
      </Card>
    </Container>
  );
};

export default RegisterPage;
