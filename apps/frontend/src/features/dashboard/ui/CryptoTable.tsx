import React from 'react';
import styled from 'styled-components';
import type { CryptoData } from '../domain/types.js';
import { usePreferences, useToggleFavorite } from '../../preferences/application/hooks.js';

const TableWrapper = styled.div`
  width: 100%;
  background: ${(props) => props.theme.surface.surface};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
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
  white-space: nowrap;
`;

const BodyRow = styled.tr`
  &:hover {
    background: ${(props) => props.theme.surface.background};
  }
`;

const CryptoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CryptoImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

const CryptoSymbol = styled.div`
  color: ${(props) => props.theme.surface.textMuted};
  font-size: 12px;
`;

const PriceChange = styled.span<{ $isPositive: boolean }>`
  color: ${(props) => (props.$isPositive ? '#10B981' : '#EF4444')};
  font-weight: 600;
`;

const FavoriteButton = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: ${(props) => (props.$active ? '#F59E0B' : props.theme.surface.textMuted)};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, transform 0.15s;

  &:hover:not(:disabled) {
    transform: scale(1.15);
    color: #F59E0B;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatLargeNumber = (num: number | null): string => {
  if (num === null) return 'N/A';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(0)}`;
};

interface CryptoTableProps {
  cryptos: CryptoData[];
  showFavoriteToggle?: boolean;
}

const CryptoTable: React.FC<CryptoTableProps> = ({ cryptos, showFavoriteToggle = true }) => {
  const { data: preferences } = usePreferences();
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();

  const favorites = preferences?.favoriteCoins ?? [];

  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            {showFavoriteToggle && <HeaderCell> </HeaderCell>}
            <HeaderCell>#</HeaderCell>
            <HeaderCell>Nombre</HeaderCell>
            <HeaderCell>Precio</HeaderCell>
            <HeaderCell>24h</HeaderCell>
            <HeaderCell>Market Cap</HeaderCell>
            <HeaderCell>Volumen</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {cryptos.map((crypto, index) => {
            const isFavorite = favorites.includes(crypto.id);
            return (
              <BodyRow key={crypto.id}>
                {showFavoriteToggle && (
                  <BodyCell>
                    <FavoriteButton
                      type="button"
                      $active={isFavorite}
                      disabled={isPending}
                      onClick={() => toggleFavorite(crypto.id)}
                      aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      <StarIcon filled={isFavorite} />
                    </FavoriteButton>
                  </BodyCell>
                )}
                <BodyCell>{crypto.marketCapRank || index + 1}</BodyCell>
                <BodyCell>
                  <CryptoInfo>
                    <CryptoImage src={crypto.image} alt={crypto.name} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{crypto.name}</div>
                      <CryptoSymbol>{crypto.symbol.toUpperCase()}</CryptoSymbol>
                    </div>
                  </CryptoInfo>
                </BodyCell>
                <BodyCell>{formatPrice(crypto.currentPrice)}</BodyCell>
                <BodyCell>
                  <PriceChange $isPositive={(crypto.changePercent24h ?? 0) >= 0}>
                    {crypto.changePercent24h !== null ? `${crypto.changePercent24h.toFixed(2)}%` : 'N/A'}
                  </PriceChange>
                </BodyCell>
                <BodyCell>{formatLargeNumber(crypto.marketCap)}</BodyCell>
                <BodyCell>{formatLargeNumber(crypto.totalVolume)}</BodyCell>
              </BodyRow>
            );
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );
};

export default CryptoTable;
