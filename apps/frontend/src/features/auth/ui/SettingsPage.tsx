import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth, useUpdateProfile, useChangePassword } from '../application/hooks.js';
import CitySelect from '../../locations/ui/CitySelect.js';
import UserMenu from '../../../shared/ui/UserMenu.js';
import { useToast } from '../../../shared/ui/Toast/ToastProvider.js';
import type { CityLocation } from '../../locations/domain/types.js';

const Container = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.surface.background};
`;

const Header = styled.header`
  background: ${(props) => props.theme.brandPrimary};
  color: white;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  ${(props) => props.theme.media.md} {
    padding: 16px 32px;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  margin: 0;
  font-weight: 600;
  cursor: pointer;

  ${(props) => props.theme.media.md} {
    font-size: 20px;
  }
`;

const Content = styled.main`
  max-width: 720px;
  margin: 16px auto;
  padding: 0 12px;

  ${(props) => props.theme.media.md} {
    margin: 32px auto;
    padding: 0 24px;
  }
`;

const Card = styled.div`
  background: ${(props) => props.theme.surface.surface};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  ${(props) => props.theme.media.md} {
    padding: 32px;
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 8px 0;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.brandPrimary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: ${(props) => props.theme.brandAccent};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PageTitle = styled.h2`
  font-size: 20px;
  color: ${(props) => props.theme.surface.textPrimary};
  margin: 0 0 8px 0;

  ${(props) => props.theme.media.md} {
    font-size: 22px;
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.surface.textSecondary};
  margin: 0 0 24px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const ReadOnlyHint = styled.span`
  font-size: 11px;
  color: ${(props) => props.theme.surface.textMuted};
  font-weight: 400;
  margin-left: 8px;
`;

const Input = styled.input<{ $readOnly?: boolean }>`
  padding: 12px;
  border: 1px solid ${(props) => props.theme.surface.border};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  width: 100%;
  background: ${(props) =>
    props.$readOnly ? props.theme.surface.background : props.theme.surface.inputBackground};
  color: ${(props) =>
    props.$readOnly ? props.theme.surface.textMuted : props.theme.surface.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.brandPrimary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.brandPrimary}20;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
  margin-top: 8px;

  ${(props) => props.theme.media.sm} {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  background: ${(props) =>
    props.$variant === 'secondary' ? props.theme.surface.surface : props.theme.brandPrimary};
  color: ${(props) =>
    props.$variant === 'secondary' ? props.theme.surface.textPrimary : 'white'};
  border: 1px solid
    ${(props) =>
      props.$variant === 'secondary' ? props.theme.surface.border : props.theme.brandPrimary};
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$variant === 'secondary' ? props.theme.surface.background : props.theme.brandAccent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { showSuccess, showError } = useToast();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [location, setLocation] = useState<CityLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      if (user.city && user.state && user.country) {
        setLocation({
          city: user.city,
          state: user.state,
          country: user.country,
          label: `${user.city} - ${user.state} - ${user.country}`,
        });
      }
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      showError('El nombre y apellido son requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: location?.city,
        state: location?.state,
        country: location?.country,
      });
      showSuccess('Perfil actualizado exitosamente');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('La confirmación no coincide con la nueva contraseña');
      return;
    }

    if (currentPassword === newPassword) {
      showError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Contraseña actualizada exitosamente');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const canChangePassword = user.authProvider === 'email';

  return (
    <Container>
      <Header>
        <HeaderTitle onClick={() => navigate('/dashboard')}>MonaBit Dashboard</HeaderTitle>
        <UserMenu />
      </Header>
      <Content>
        <BackButton type="button" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Volver al dashboard
        </BackButton>
        <Card>
          <PageTitle>Configuración del perfil</PageTitle>
          <Subtitle>Actualiza tu información personal. El email no se puede cambiar.</Subtitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="email">
                Email <ReadOnlyHint>(no editable)</ReadOnlyHint>
              </Label>
              <Input id="email" name="email" type="email" value={user.email} readOnly $readOnly autoComplete="email" />
            </FormGroup>
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </FormGroup>
            <ButtonRow>
              <Button type="button" $variant="secondary" onClick={() => navigate('/dashboard')} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </ButtonRow>
          </Form>
        </Card>

        {canChangePassword && (
          <Card style={{ marginTop: 24 }}>
            <PageTitle>Cambiar contraseña</PageTitle>
            <Subtitle>
              Ingresa tu contraseña actual y luego la nueva. Mínimo 8 caracteres.
            </Subtitle>
            <Form onSubmit={handleChangePassword}>
              <FormGroup>
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                  autoComplete="current-password"
                />
              </FormGroup>
              <Row>
                <FormGroup>
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                </FormGroup>
              </Row>
              <ButtonRow>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
                </Button>
              </ButtonRow>
            </Form>
          </Card>
        )}
      </Content>
    </Container>
  );
};

export default SettingsPage;
