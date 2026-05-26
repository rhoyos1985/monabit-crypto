import React, { useState } from 'react';
import styled from 'styled-components';
import type { User } from '../domain/types.js';
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '../application/hooks.js';
import UsersTable from './UsersTable.js';
import UserForm from './UserForm.js';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${(props) => props.theme.brandDark};
  font-size: 24px;
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

const ErrorMessage = styled.div`
  padding: 16px;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  margin-bottom: 24px;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  padding: 16px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  margin-bottom: 24px;
  font-size: 14px;
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
  successMessage: string | null;
}

const UsersPage: React.FC = () => {
  const [state, setState] = useState<UsersPageState>({
    showForm: false,
    editingUser: null,
    successMessage: null,
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();
  const { mutate: createUser, isPending: createPending, error: createError } = useCreateUser();
  const { mutate: updateUser, isPending: updatePending, error: updateError } = useUpdateUser();
  const { mutate: deactivateUser, isPending: deactivatePending, error: deactivateError } = useDeactivateUser();

  const handleAddUserClick = (): void => {
    setState({
      showForm: true,
      editingUser: null,
      successMessage: null,
    });
  };

  const handleEditUser = (user: User): void => {
    setState({
      showForm: true,
      editingUser: user,
      successMessage: null,
    });
  };

  const handleFormCancel = (): void => {
    setState({
      showForm: false,
      editingUser: null,
      successMessage: null,
    });
  };

  const handleFormSubmit = async (input: { email: string; displayName: string; password: string; role: 'admin' | 'user' }): Promise<void> => {
    if (state.editingUser) {
      updateUser(
        {
          id: state.editingUser.id,
          input: {
            displayName: input.displayName,
            role: input.role,
          },
        },
        {
          onSuccess: () => {
            setState({
              showForm: false,
              editingUser: null,
              successMessage: `Usuario ${input.displayName || input.email} actualizado exitosamente`,
            });
            setTimeout(() => {
              setState((prev) => ({ ...prev, successMessage: null }));
            }, 3000);
          },
        }
      );
    } else {
      createUser(input, {
        onSuccess: () => {
          setState({
            showForm: false,
            editingUser: null,
            successMessage: `Usuario ${input.displayName || input.email} creado exitosamente`,
          });
          setTimeout(() => {
            setState((prev) => ({ ...prev, successMessage: null }));
          }, 3000);
        },
      });
    }
  };

  const handleDeactivateUser = (userId: string): void => {
    deactivateUser(userId, {
      onSuccess: () => {
        setState((prev) => ({
          ...prev,
          successMessage: 'Usuario desactivado exitosamente',
        }));
        setTimeout(() => {
          setState((prev) => ({ ...prev, successMessage: null }));
        }, 3000);
      },
    });
  };

  const isFormLoading = createPending || updatePending;
  const formError = createError || updateError || deactivateError;
  const isDeactivating = deactivatePending;

  return (
    <PageContainer>
      <Header>
        <Title>Gestión de Usuarios</Title>
        {!state.showForm && (
          <AddUserButton onClick={handleAddUserClick} disabled={usersLoading}>
            + Crear Usuario
          </AddUserButton>
        )}
      </Header>

      {state.successMessage && <SuccessMessage>{state.successMessage}</SuccessMessage>}
      {(usersError || formError) && (
        <ErrorMessage>
          {usersError?.message || formError?.message || 'Error al procesar la solicitud'}
        </ErrorMessage>
      )}

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
  );
};

export default UsersPage;
