import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CryptoData, ChartRange } from '../domain/types.js';
import { useCoinChart } from '../application/hooks.js';
import { formatPrice, formatLargeNumber } from '../../../shared/format.js';

const Container = styled.div`
  background: ${(props) => props.theme.surface.surface};
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;

  ${(props) => props.theme.media.md} {
    padding: 20px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CoinTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${(props) => props.theme.surface.textPrimary};
  font-size: 18px;
`;

const Symbol = styled.span`
  color: ${(props) => props.theme.surface.textMuted};
  font-size: 14px;
  margin-left: 6px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props) => props.theme.surface.textMuted};
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;

  &:hover {
    color: ${(props) => props.theme.brandPrimary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  ${(props) => props.theme.media.md} {
    grid-template-columns: repeat(5, 1fr);
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.surface.textMuted};
`;

const Value = styled.span<{ $positive?: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) =>
    props.$positive === undefined
      ? props.theme.surface.textPrimary
      : props.$positive
        ? '#10B981'
        : '#EF4444'};
`;

const RangeToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const RangeButton = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid ${(props) => props.theme.surface.border};
  background: ${(props) => (props.$active ? props.theme.brandPrimary : 'transparent')};
  color: ${(props) => (props.$active ? '#FFFFFF' : props.theme.surface.textPrimary)};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const Message = styled.div`
  padding: 24px;
  text-align: center;
  color: ${(props) => props.theme.surface.textMuted};
`;

interface CoinDetailProps {
  coin: CryptoData;
  onClose: () => void;
}

const CoinDetail: React.FC<CoinDetailProps> = ({ coin, onClose }) => {
  const theme = useTheme();
  const [range, setRange] = useState<ChartRange>('day');
  const { data: chart, isLoading, error } = useCoinChart(coin.id, range);

  const chartData = (chart?.points ?? []).map((point) => ({
    timestamp: point.timestamp,
    price: point.price,
  }));

  const formatTick = (timestamp: number): string => {
    const date = new Date(timestamp);
    return range === 'day'
      ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Container>
      <Header>
        <CoinTitle>
          <img src={coin.image} alt={coin.name} width={28} height={28} />
          <span>
            {coin.name}
            <Symbol>{coin.symbol.toUpperCase()}</Symbol>
          </span>
        </CoinTitle>
        <CloseButton type="button" onClick={onClose} aria-label="Cerrar detalle">
          ×
        </CloseButton>
      </Header>

      <InfoGrid>
        <InfoItem>
          <Label>Precio</Label>
          <Value>{formatPrice(coin.currentPrice)}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Variación 24h</Label>
          <Value $positive={(coin.changePercent24h ?? 0) >= 0}>
            {coin.changePercent24h !== null ? `${coin.changePercent24h.toFixed(2)}%` : 'N/A'}
          </Value>
        </InfoItem>
        <InfoItem>
          <Label>Market Cap</Label>
          <Value>{formatLargeNumber(coin.marketCap)}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Volumen 24h</Label>
          <Value>{formatLargeNumber(coin.totalVolume)}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Ranking</Label>
          <Value>{coin.marketCapRank !== null ? `#${coin.marketCapRank}` : 'N/A'}</Value>
        </InfoItem>
      </InfoGrid>

      <RangeToggle>
        <RangeButton type="button" $active={range === 'day'} onClick={() => setRange('day')}>
          Día
        </RangeButton>
        <RangeButton type="button" $active={range === 'week'} onClick={() => setRange('week')}>
          Semana
        </RangeButton>
      </RangeToggle>

      {isLoading && <Message>Cargando gráfica...</Message>}
      {error && <Message>No se pudo cargar la gráfica de precios.</Message>}
      {!isLoading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.surface.border} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTick}
              stroke={theme.surface.textSecondary}
              minTickGap={40}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke={theme.surface.textSecondary}
              tickFormatter={(value: number) => formatPrice(value)}
              width={90}
            />
            <Tooltip
              labelFormatter={(label: number) => new Date(label).toLocaleString('es-CO')}
              formatter={(value: number) => [formatPrice(value), 'Precio']}
              contentStyle={{
                backgroundColor: theme.surface.surfaceElevated,
                border: `1px solid ${theme.surface.border}`,
                color: theme.surface.textPrimary,
              }}
            />
            <Line type="monotone" dataKey="price" stroke={theme.brandPrimary} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Container>
  );
};

export default CoinDetail;
