import React from 'react';
import styled from 'styled-components';
import type { User, UserRole } from '../domain/types.js';

const TableWrapper = styled.div`
  width: 100%;
  background: ${(props) => props.theme.surface.surface};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 720px;
`;

const HeaderCell = styled.th`
  background: ${(props) => props.theme.surface.background};
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid ${(props) => props.theme.brandPrimary};
  color: ${(props) => props.theme.surface.textPrimary};
  white-space: nowrap;
`;

const BodyCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${(props) => props.theme.surface.border};
  color: ${(props) => props.theme.surface.textPrimary};
`;

const BodyRow = styled.tr`
  &:hover {
    background: ${(props) => props.theme.surface.background};
  }
`;

const RoleBadge = styled.span<{ $role: UserRole }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => (props.$role === 'admin' ? '#fee5e7' : '#e3f2fd')};
  color: ${(props) => (props.$role === 'admin' ? '#c3185b' : '#1565c0')};
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => (props.$isActive ? '#e8f5e9' : '#ffebee')};
  color: ${(props) => (props.$isActive ? '#2e7d32' : '#c62828')};
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: ${(props) => props.theme.brandPrimary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;

  &:hover {
    background: ${(props) => props.theme.brandAccent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(ActionButton)`
  background: #ef4444;

  &:hover {
    background: #dc2626;
  }
`;

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDeactivate: (userId: string) => void;
  isDeactivating: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, onEdit, onDeactivate, isDeactivating }) => {
  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <HeaderCell>Email</HeaderCell>
            <HeaderCell>Nombre</HeaderCell>
            <HeaderCell>Ciudad</HeaderCell>
            <HeaderCell>Rol</HeaderCell>
            <HeaderCell>Estado</HeaderCell>
            <HeaderCell>Creado</HeaderCell>
            <HeaderCell>Acciones</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <BodyRow key={user.id}>
              <BodyCell>{user.email}</BodyCell>
              <BodyCell>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</BodyCell>
              <BodyCell>{user.city ? `${user.city}, ${user.state ?? ''}` : '-'}</BodyCell>
              <BodyCell>
                <RoleBadge $role={user.role}>{user.role.toUpperCase()}</RoleBadge>
              </BodyCell>
              <BodyCell>
                <StatusBadge $isActive={user.isActive}>
                  {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                </StatusBadge>
              </BodyCell>
              <BodyCell>{new Date(user.createdAt).toLocaleDateString('es-CO')}</BodyCell>
              <BodyCell>
                <ActionButton onClick={() => onEdit(user)}>Editar</ActionButton>
                {user.isActive && (
                  <DangerButton
                    onClick={() => onDeactivate(user.id)}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? 'Desactivando...' : 'Desactivar'}
                  </DangerButton>
                )}
              </BodyCell>
            </BodyRow>
          ))}
        </tbody>
      </Table>
    </TableWrapper>
  );
};

export default UsersTable;
