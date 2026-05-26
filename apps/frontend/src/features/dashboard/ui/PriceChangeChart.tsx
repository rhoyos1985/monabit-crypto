import React from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CryptoData } from '../domain/types.js';

const Container = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
`;

const Title = styled.h3`
  margin: 0 0 20px 0;
  color: ${(props) => props.theme.brandDark};
  font-size: 16px;
`;

interface PriceChangeChartProps {
  cryptos: CryptoData[];
}

const PriceChangeChart: React.FC<PriceChangeChartProps> = ({ cryptos }) => {
  const data = cryptos.map((crypto) => ({
    symbol: crypto.symbol.toUpperCase(),
    change: crypto.changePercent24h ?? 0,
  }));

  return (
    <Container>
      <Title>24h Price Change (%)</Title>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="symbol" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(2)}%`}
            contentStyle={{ backgroundColor: '#fff', border: `1px solid ${document.documentElement.style.getPropertyValue('--brand-primary') || '#0098BF'}` }}
          />
          <Legend />
          <Bar
            dataKey="change"
            fill="#0098BF"
            radius={[4, 4, 0, 0]}
            name="Change %"
          />
        </BarChart>
      </ResponsiveContainer>
    </Container>
  );
};

export default PriceChangeChart;
