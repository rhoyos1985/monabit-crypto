import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '../../auth/application/hooks.js';
import { useMarketOverview } from '../application/hooks.js';
import { usePreferences } from '../../preferences/application/hooks.js';
import type { CryptoData } from '../domain/types.js';
import UserMenu from '../../../shared/ui/UserMenu.js';
import CryptoTable from './CryptoTable.js';
import CoinDetail from './CoinDetail.js';
import MarketKPIs from './MarketKPIs.js';
import PriceChangeChart from './PriceChangeChart.js';

const Container = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.surface.background};
  padding: 12px;

  ${(props) => props.theme.media.md} {
    padding: 20px;
  }
`;

const Header = styled.header`
  background: ${(props) => props.theme.surface.surface};
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

  ${(props) => props.theme.media.md} {
    padding: 20px;
    margin-bottom: 20px;
  }
`;

const Title = styled.h1`
  margin: 0;
  color: ${(props) => props.theme.surface.textPrimary};
  cursor: pointer;
  font-size: 18px;

  ${(props) => props.theme.media.md} {
    font-size: 22px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  ${(props) => props.theme.media.md} {
    gap: 16px;
  }
`;

const NavLink = styled(Link)`
  color: ${(props) => props.theme.brandPrimary};
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;

  &:hover {
    background: ${(props) => props.theme.brandPrimary}10;
  }
`;

const Content = styled.main`
  padding: 0;
`;

const LoadingContainer = styled.div`
  background: ${(props) => props.theme.surface.surface};
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  color: ${(props) => props.theme.brandPrimary};
`;

const ErrorContainer = styled.div`
  background: ${(props) => props.theme.surface.surface};
  padding: 40px;
  border-radius: 8px;
  color: #ef4444;
  border-left: 4px solid #ef4444;
`;

const LastUpdated = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.surface.textMuted};
  margin-top: 10px;
`;

const SectionTitle = styled.h2`
  color: ${(props) => props.theme.surface.textPrimary};
  margin: 24px 0 16px 0;
  font-size: 16px;

  ${(props) => props.theme.media.md} {
    margin: 30px 0 20px 0;
    font-size: 18px;
  }
`;

interface DashboardPageProps {}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: marketData, isLoading, error } = useMarketOverview();
  const { data: preferences } = usePreferences();
  const [selectedCoin, setSelectedCoin] = useState<CryptoData | null>(null);

  const favoriteCryptos = useMemo(() => {
    if (!marketData || !preferences || preferences.favoriteCoins.length === 0) {
      return [];
    }
    return marketData.topCryptos.filter((c) => preferences.favoriteCoins.includes(c.id));
  }, [marketData, preferences]);

  return (
    <Container>
      <Header>
        <Title onClick={() => void navigate({ to: '/dashboard' })}>MonaBit Dashboard</Title>
        <UserInfo>
          {user?.role === 'admin' && <NavLink to="/users">Usuarios</NavLink>}
          <UserMenu />
        </UserInfo>
      </Header>

      <Content>
        {isLoading && <LoadingContainer>Cargando datos del mercado...</LoadingContainer>}

        {error && (
          <ErrorContainer>
            Error al cargar datos del mercado: {error.message}
          </ErrorContainer>
        )}

        {marketData && (
          <>
            <SectionTitle>Indicadores del mercado</SectionTitle>
            <MarketKPIs kpis={marketData.marketKpis} />

            {selectedCoin && (
              <CoinDetail coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
            )}

            {favoriteCryptos.length > 0 && (
              <>
                <SectionTitle>Tus favoritas ★</SectionTitle>
                <CryptoTable cryptos={favoriteCryptos} onSelect={setSelectedCoin} />
              </>
            )}

            <SectionTitle>Variación 24h</SectionTitle>
            <PriceChangeChart cryptos={marketData.topCryptos} />

            <SectionTitle>Top 10 criptomonedas</SectionTitle>
            <CryptoTable cryptos={marketData.topCryptos} searchable onSelect={setSelectedCoin} />
            <LastUpdated>
              Última actualización: {new Date(marketData.lastFetched).toLocaleString('es-CO')}
            </LastUpdated>
          </>
        )}
      </Content>
    </Container>
  );
};

export default DashboardPage;
