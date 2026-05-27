import React from 'react';
import styled, { useTheme } from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CryptoData } from '../domain/types.js';

const Container = styled.div`
  background: ${(props) => props.theme.surface.surface};
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;

  ${(props) => props.theme.media.md} {
    padding: 20px;
    margin-bottom: 30px;
  }
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  color: ${(props) => props.theme.surface.textPrimary};
  font-size: 16px;
`;

interface PriceChangeChartProps {
  cryptos: CryptoData[];
}

const PriceChangeChart: React.FC<PriceChangeChartProps> = ({ cryptos }) => {
  const theme = useTheme();
  const data = cryptos.map((crypto) => ({
    symbol: crypto.symbol.toUpperCase(),
    change: crypto.changePercent24h ?? 0,
  }));

  return (
    <Container>
      <Title>Variación 24h (%)</Title>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.surface.border} />
          <XAxis dataKey="symbol" stroke={theme.surface.textSecondary} />
          <YAxis stroke={theme.surface.textSecondary} />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(2)}%`}
            contentStyle={{
              backgroundColor: theme.surface.surfaceElevated,
              border: `1px solid ${theme.surface.border}`,
              color: theme.surface.textPrimary,
            }}
            labelStyle={{ color: theme.surface.textPrimary }}
          />
          <Legend wrapperStyle={{ color: theme.surface.textSecondary }} />
          <Bar
            dataKey="change"
            fill={theme.brandPrimary}
            radius={[4, 4, 0, 0]}
            name="Variación %"
          />
        </BarChart>
      </ResponsiveContainer>
    </Container>
  );
};

export default PriceChangeChart;
