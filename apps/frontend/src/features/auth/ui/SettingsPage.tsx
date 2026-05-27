import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth, useUpdateProfile } from '../application/hooks.js';
import CitySelect from '../../locations/ui/CitySelect.js';
import UserMenu from '../../../shared/ui/UserMenu.js';
import type { CityLocation } from '../../locations/domain/types.js';

const Container = styled.div`
  min-height: 100vh;
  background: #f5f7fa;
`;

const Header = styled.header`
  background: ${(props) => props.theme.brandPrimary};
  color: white;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const HeaderTitle = styled.h1`
  font-size: 20px;
  margin: 0;
  font-weight: 600;
  cursor: pointer;
`;

const Content = styled.main`
  max-width: 720px;
  margin: 32px auto;
  padding: 0 24px;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const PageTitle = styled.h2`
  font-size: 22px;
  color: ${(props) => props.theme.brandDark};
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
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
  color: ${(props) => props.theme.brandDark};
`;

const ReadOnlyHint = styled.span`
  font-size: 11px;
  color: #999;
  font-weight: 400;
  margin-left: 8px;
`;

const Input = styled.input<{ $readOnly?: boolean }>`
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  width: 100%;
  background: ${(props) => (props.$readOnly ? '#f5f5f5' : 'white')};
  color: ${(props) => (props.$readOnly ? '#666' : 'inherit')};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.brandPrimary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.brandPrimary}20;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  background: ${(props) => (props.$variant === 'secondary' ? 'white' : props.theme.brandPrimary)};
  color: ${(props) => (props.$variant === 'secondary' ? props.theme.brandDark : 'white')};
  border: 1px solid ${(props) => (props.$variant === 'secondary' ? '#ccc' : props.theme.brandPrimary)};
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => (props.$variant === 'secondary' ? '#f5f5f5' : props.theme.brandAccent)};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  padding: 12px;
  background: #efe;
  color: #2a7;
  border-radius: 4px;
  font-size: 14px;
`;

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [location, setLocation] = useState<CityLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('El nombre y apellido son requeridos');
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
      setSuccess('Perfil actualizado exitosamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Header>
        <HeaderTitle onClick={() => navigate('/dashboard')}>MonaBit Dashboard</HeaderTitle>
        <UserMenu />
      </Header>
      <Content>
        <Card>
          <PageTitle>Configuración del perfil</PageTitle>
          <Subtitle>Actualiza tu información personal. El email no se puede cambiar.</Subtitle>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="email">
                Email <ReadOnlyHint>(no editable)</ReadOnlyHint>
              </Label>
              <Input id="email" type="email" value={user.email} readOnly $readOnly />
            </FormGroup>
            <Row>
              <FormGroup>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isSubmitting}
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
      </Content>
    </Container>
  );
};

export default SettingsPage;
