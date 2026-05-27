import React from 'react';
import styled from 'styled-components';
import type { MarketKPIs } from '../domain/types.js';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 20px;

  ${(props) => props.theme.media.sm} {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  ${(props) => props.theme.media.lg} {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }
`;

const Card = styled.div`
  background: ${(props) => props.theme.surface.surface};
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${(props) => props.theme.brandPrimary};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  ${(props) => props.theme.media.md} {
    padding: 20px;
  }
`;

const Label = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.surface.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-weight: 600;
`;

const Value = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${(props) => props.theme.surface.textPrimary};

  ${(props) => props.theme.media.md} {
    font-size: 24px;
  }
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
        <Label>Capitalización total</Label>
        <Value>{formatLargeNumber(kpis.totalMarketCap)}</Value>
      </Card>
      <Card>
        <Label>Volumen 24h</Label>
        <Value>{formatLargeNumber(kpis.totalVolume)}</Value>
      </Card>
      <Card>
        <Label>Dominancia BTC</Label>
        <Value>{kpis.btcDominance.toFixed(2)}%</Value>
      </Card>
      <Card>
        <Label>Dominancia ETH</Label>
        <Value>{kpis.ethereumDominance.toFixed(2)}%</Value>
      </Card>
    </Container>
  );
};

export default MarketKPIsComponent;
