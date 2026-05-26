import React from 'react';
import styled from 'styled-components';
import type { MarketKPIs } from '../domain/types.js';

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const Card = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid ${(props) => props.theme.brandPrimary};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Label = styled.div`
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-weight: 600;
`;

const Value = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.brandDark};
`;

const formatLargeNumber = (num: number): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toFixed(0)}`;
};

interface MarketKPIsProps {
  kpis: MarketKPIs;
}

const MarketKPIsComponent: React.FC<MarketKPIsProps> = ({ kpis }) => {
  return (
    <Container>
      <Card>
        <Label>Total Market Cap</Label>
        <Value>{formatLargeNumber(kpis.totalMarketCap)}</Value>
      </Card>
      <Card>
        <Label>Total 24h Volume</Label>
        <Value>{formatLargeNumber(kpis.totalVolume)}</Value>
      </Card>
      <Card>
        <Label>Bitcoin Dominance</Label>
        <Value>{kpis.btcDominance.toFixed(2)}%</Value>
      </Card>
      <Card>
        <Label>Ethereum Dominance</Label>
        <Value>{kpis.ethereumDominance.toFixed(2)}%</Value>
      </Card>
    </Container>
  );
};

export default MarketKPIsComponent;
