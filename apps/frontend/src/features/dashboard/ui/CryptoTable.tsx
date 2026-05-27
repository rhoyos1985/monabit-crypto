import React from 'react';
import styled from 'styled-components';
import type { CryptoData } from '../domain/types.js';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const HeaderCell = styled.th`
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid ${(props) => props.theme.brandPrimary};
  color: ${(props) => props.theme.brandDark};
`;

const BodyCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
  color: #333;
`;

const BodyRow = styled.tr`
  &:hover {
    background: #f9f9f9;
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

const PriceChange = styled.span<{ $isPositive: boolean }>`
  color: ${(props) => (props.$isPositive ? '#10B981' : '#EF4444')};
  font-weight: 600;
`;

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
}

const CryptoTable: React.FC<CryptoTableProps> = ({ cryptos }) => {
  return (
    <Table>
      <thead>
        <tr>
          <HeaderCell>Rank</HeaderCell>
          <HeaderCell>Name</HeaderCell>
          <HeaderCell>Price</HeaderCell>
          <HeaderCell>24h Change</HeaderCell>
          <HeaderCell>Market Cap</HeaderCell>
          <HeaderCell>Volume</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {cryptos.map((crypto, index) => (
          <BodyRow key={crypto.id}>
            <BodyCell>{crypto.marketCapRank || index + 1}</BodyCell>
            <BodyCell>
              <CryptoInfo>
                <CryptoImage src={crypto.image} alt={crypto.name} />
                <div>
                  <div style={{ fontWeight: 600 }}>{crypto.name}</div>
                  <div style={{ color: '#999', fontSize: '12px' }}>{crypto.symbol.toUpperCase()}</div>
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
        ))}
      </tbody>
    </Table>
  );
};

export default CryptoTable;
