import React from 'react';
import styled from 'styled-components';
import { useAuth, useLogout } from '../../auth/application/hooks.js';
import { useNavigate } from 'react-router-dom';
import { useMarketOverview } from '../application/hooks.js';
import CryptoTable from './CryptoTable.js';
import MarketKPIs from './MarketKPIs.js';
import PriceChangeChart from './PriceChangeChart.js';

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
  padding: 0;
`;

const UserText = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
`;

const LoadingContainer = styled.div`
  background: white;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  color: ${(props) => props.theme.brandPrimary};
`;

const ErrorContainer = styled.div`
  background: white;
  padding: 40px;
  border-radius: 8px;
  color: #ef4444;
  border-left: 4px solid #ef4444;
`;

const LastUpdated = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 10px;
`;

const SectionTitle = styled.h2`
  color: ${(props) => props.theme.brandDark};
  margin: 30px 0 20px 0;
  font-size: 18px;
`;

interface DashboardPageProps {}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logout = useLogout();
  const { data: marketData, isLoading, error } = useMarketOverview();

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
        {isLoading && <LoadingContainer>Loading market data...</LoadingContainer>}

        {error && (
          <ErrorContainer>
            Error loading market data: {error.message}
          </ErrorContainer>
        )}

        {marketData && (
          <>
            <SectionTitle>Market Overview</SectionTitle>
            <MarketKPIs kpis={marketData.marketKpis} />

            <SectionTitle>Price Changes</SectionTitle>
            <PriceChangeChart cryptos={marketData.topCryptos} />

            <SectionTitle>Top 10 Cryptocurrencies</SectionTitle>
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
              <CryptoTable cryptos={marketData.topCryptos} />
              <LastUpdated style={{ padding: '10px 20px' }}>
                Last updated: {new Date(marketData.lastFetched).toLocaleString()}
              </LastUpdated>
            </div>
          </>
        )}
      </Content>
    </Container>
  );
};

export default DashboardPage;
