import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import type { User, UserRole } from '../domain/types.js';
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '../application/hooks.js';
import UsersTable from './UsersTable.js';
import UserForm from './UserForm.js';
import UserMenu from '../../../shared/ui/UserMenu.js';
import { useToast } from '../../../shared/ui/Toast/ToastProvider.js';

const Container = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.surface.background};
`;

const Header = styled.header`
  background: ${(props) => props.theme.surface.surface};
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  ${(props) => props.theme.media.md} {
    padding: 16px 24px;
  }
`;

const HeaderTitle = styled.h1`
  margin: 0;
  color: ${(props) => props.theme.surface.textPrimary};
  font-size: 18px;
  cursor: pointer;

  ${(props) => props.theme.media.md} {
    font-size: 20px;
  }
`;

const PageContainer = styled.div`
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;

  ${(props) => props.theme.media.md} {
    padding: 24px;
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
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

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;

  ${(props) => props.theme.media.sm} {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: ${(props) => props.theme.surface.textPrimary};
  font-size: 20px;

  ${(props) => props.theme.media.md} {
    font-size: 22px;
  }
`;

const AddUserButton = styled.button`
  padding: 10px 20px;
  background: ${(props) => props.theme.brandPrimary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: ${(props) => props.theme.brandAccent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  padding: 24px;
  text-align: center;
  color: ${(props) => props.theme.brandPrimary};
  font-size: 14px;
`;

interface UsersPageState {
  showForm: boolean;
  editingUser: User | null;
}

interface UserFormInput {
  email: string;
  firstName: string;
  lastName: string;
  city?: string;
  state?: string;
  country?: string;
  password: string;
  role: UserRole;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [state, setState] = useState<UsersPageState>({
    showForm: false,
    editingUser: null,
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();
  const { mutate: createUser, isPending: createPending, error: createError } = useCreateUser();
  const { mutate: updateUser, isPending: updatePending, error: updateError } = useUpdateUser();
  const { mutate: deactivateUser, isPending: deactivatePending, error: deactivateError } = useDeactivateUser();

  useEffect(() => {
    if (usersError) showError(usersError.message);
  }, [usersError, showError]);

  useEffect(() => {
    const err = createError || updateError || deactivateError;
    if (err) showError(err.message);
  }, [createError, updateError, deactivateError, showError]);

  const handleAddUserClick = (): void => {
    setState({ showForm: true, editingUser: null });
  };

  const handleEditUser = (user: User): void => {
    setState({ showForm: true, editingUser: user });
  };

  const handleFormCancel = (): void => {
    setState({ showForm: false, editingUser: null });
  };

  const buildUserLabel = (input: UserFormInput): string => {
    const fullName = [input.firstName, input.lastName].filter(Boolean).join(' ').trim();
    return fullName || input.email;
  };

  const handleFormSubmit = (input: UserFormInput): void => {
    if (state.editingUser) {
      updateUser(
        {
          id: state.editingUser.id,
          input: {
            firstName: input.firstName,
            lastName: input.lastName,
            city: input.city,
            state: input.state,
            country: input.country,
            role: input.role,
          },
        },
        {
          onSuccess: () => {
            setState({ showForm: false, editingUser: null });
            showSuccess(`Usuario ${buildUserLabel(input)} actualizado exitosamente`);
          },
        }
      );
    } else {
      createUser(input, {
        onSuccess: () => {
          setState({ showForm: false, editingUser: null });
          showSuccess(`Usuario ${buildUserLabel(input)} creado exitosamente`);
        },
      });
    }
  };

  const handleDeactivateUser = (userId: string): void => {
    deactivateUser(userId, {
      onSuccess: () => {
        showSuccess('Usuario desactivado exitosamente');
      },
    });
  };

  const isFormLoading = createPending || updatePending;
  const formError = createError || updateError || deactivateError;
  const isDeactivating = deactivatePending;

  return (
    <Container>
      <Header>
        <HeaderTitle onClick={() => void navigate({ to: '/dashboard' })}>MonaBit Dashboard</HeaderTitle>
        <UserMenu />
      </Header>
      <PageContainer>
        <BackButton type="button" onClick={() => void navigate({ to: '/dashboard' })}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Volver al dashboard
        </BackButton>
        <PageHeader>
          <Title>Gestión de Usuarios</Title>
          {!state.showForm && (
            <AddUserButton onClick={handleAddUserClick} disabled={usersLoading}>
              + Crear Usuario
            </AddUserButton>
          )}
        </PageHeader>

        {state.showForm && (
          <UserForm
            isLoading={isFormLoading}
            error={formError}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            initialUser={state.editingUser || undefined}
          />
        )}

        {usersLoading ? (
          <LoadingSpinner>Cargando usuarios...</LoadingSpinner>
        ) : users && users.length > 0 ? (
          <UsersTable
            users={users}
            onEdit={handleEditUser}
            onDeactivate={handleDeactivateUser}
            isDeactivating={isDeactivating}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
            No hay usuarios. {!state.showForm && 'Crea el primero.'}
          </div>
        )}
      </PageContainer>
    </Container>
  );
};

export default UsersPage;
