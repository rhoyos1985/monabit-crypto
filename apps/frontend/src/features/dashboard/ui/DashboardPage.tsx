import React from 'react';
import styled from 'styled-components';
import { useAuth, useLogout } from '../../auth/application/hooks.js';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
`;

const Header = styled.header`
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin: 0;
  color: ${(props) => props.theme.brandDark};
`;

const UserInfo = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const LogoutButton = styled.button`
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
`;

const Content = styled.main`
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const UserText = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
`;

interface DashboardPageProps {}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Container>
      <Header>
        <Title>MonaBit Dashboard</Title>
        <UserInfo>
          <UserText>
            {user?.displayName || user?.email}
            {user?.role === 'admin' && ' (Admin)'}
          </UserText>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserInfo>
      </Header>
      <Content>
        <h2>Welcome to the Dashboard</h2>
        <p>Crypto market data coming soon...</p>
      </Content>
    </Container>
  );
};

export default DashboardPage;
