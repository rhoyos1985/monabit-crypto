import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { User, CreateUserInput } from '../domain/types.js';

const FormContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #eee;
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: ${(props) => props.theme.brandDark};
  font-size: 16px;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-column: 1 / -1;

  &:nth-child(1),
  &:nth-child(2),
  &:nth-child(3) {
    grid-column: auto;
  }
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.brandDark};
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.brandPrimary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.brandPrimary}20;
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.brandPrimary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.brandPrimary}20;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  grid-column: 1 / -1;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: ${(props) => props.theme.brandPrimary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.brandAccent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #999;

  &:hover:not(:disabled) {
    background: #777;
  }
`;

const ErrorMessage = styled.div`
  padding: 10px;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  font-size: 14px;
  grid-column: 1 / -1;
`;

interface UserFormProps {
  isLoading: boolean;
  error: Error | null;
  onSubmit: (input: CreateUserInput) => Promise<void>;
  onCancel: () => void;
  initialUser?: User;
}

const UserForm: React.FC<UserFormProps> = ({
  isLoading,
  error,
  onSubmit,
  onCancel,
  initialUser,
}) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setEmail(initialUser.email);
      setDisplayName(initialUser.displayName || '');
      setRole(initialUser.role);
    }
  }, [initialUser]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ email, displayName, password, role });
      setEmail('');
      setDisplayName('');
      setPassword('');
      setRole('user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer>
      <Title>{initialUser ? 'Edit User' : 'Create New User'}</Title>
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || isSubmitting || !!initialUser}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading || isSubmitting}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="role">Role</Label>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
            disabled={isLoading || isSubmitting}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </FormGroup>

        {!initialUser && (
          <FormGroup>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || isSubmitting}
            />
          </FormGroup>
        )}

        <ButtonGroup>
          <Button type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting ? 'Saving...' : initialUser ? 'Update' : 'Create'}
          </Button>
          <CancelButton type="button" onClick={onCancel} disabled={isLoading || isSubmitting}>
            Cancel
          </CancelButton>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default UserForm;
