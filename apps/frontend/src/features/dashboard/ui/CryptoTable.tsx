import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { CryptoData } from '../domain/types.js';
import { usePreferences, useToggleFavorite } from '../../preferences/application/hooks.js';
import { formatPrice, formatLargeNumber } from '../../../shared/format.js';

const Wrapper = styled.div`
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 320px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid ${(props) => props.theme.surface.border};
  border-radius: 6px;
  background: ${(props) => props.theme.surface.surface};
  color: ${(props) => props.theme.surface.textPrimary};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.brandPrimary};
  }
`;

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

const SortableHeader = styled(HeaderCell)`
  cursor: pointer;
  user-select: none;

  &:hover {
    color: ${(props) => props.theme.brandPrimary};
  }
`;

const BodyCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${(props) => props.theme.surface.border};
  color: ${(props) => props.theme.surface.textPrimary};
  white-space: nowrap;
`;

const BodyRow = styled.tr<{ $clickable: boolean }>`
  cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};

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

const EmptyRow = styled.td`
  padding: 24px 12px;
  text-align: center;
  color: ${(props) => props.theme.surface.textMuted};
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

type SortKey = 'rank' | 'name' | 'price' | 'change' | 'marketCap' | 'volume';
type SortDir = 'asc' | 'desc';

const getSortValue = (crypto: CryptoData, key: SortKey): number | string => {
  switch (key) {
    case 'name':
      return crypto.name.toLowerCase();
    case 'price':
      return crypto.currentPrice;
    case 'change':
      return crypto.changePercent24h ?? 0;
    case 'marketCap':
      return crypto.marketCap ?? 0;
    case 'volume':
      return crypto.totalVolume ?? 0;
    case 'rank':
    default:
      return crypto.marketCapRank ?? Number.MAX_SAFE_INTEGER;
  }
};

interface CryptoTableProps {
  cryptos: CryptoData[];
  showFavoriteToggle?: boolean;
  searchable?: boolean;
  onSelect?: (crypto: CryptoData) => void;
}

const CryptoTable: React.FC<CryptoTableProps> = ({
  cryptos,
  showFavoriteToggle = true,
  searchable = false,
  onSelect,
}) => {
  const { data: preferences } = usePreferences();
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const favorites = preferences?.favoriteCoins ?? [];
  const columnCount = showFavoriteToggle ? 7 : 6;

  const visibleCryptos = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? cryptos.filter(
          (c) => c.name.toLowerCase().includes(term) || c.symbol.toLowerCase().includes(term)
        )
      : cryptos;

    return [...filtered].sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = (aValue as number) - (bValue as number);
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [cryptos, search, sortKey, sortDir]);

  const handleSort = (key: SortKey): void => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key: SortKey): string => {
    if (key !== sortKey) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <Wrapper>
      {searchable && (
        <SearchInput
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o símbolo..."
          aria-label="Buscar criptomoneda"
        />
      )}
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              {showFavoriteToggle && <HeaderCell> </HeaderCell>}
              <SortableHeader onClick={() => handleSort('rank')}>#{sortIndicator('rank')}</SortableHeader>
              <SortableHeader onClick={() => handleSort('name')}>Nombre{sortIndicator('name')}</SortableHeader>
              <SortableHeader onClick={() => handleSort('price')}>Precio{sortIndicator('price')}</SortableHeader>
              <SortableHeader onClick={() => handleSort('change')}>24h{sortIndicator('change')}</SortableHeader>
              <SortableHeader onClick={() => handleSort('marketCap')}>Market Cap{sortIndicator('marketCap')}</SortableHeader>
              <SortableHeader onClick={() => handleSort('volume')}>Volumen{sortIndicator('volume')}</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {visibleCryptos.length === 0 && (
              <tr>
                <EmptyRow colSpan={columnCount}>No se encontraron criptomonedas.</EmptyRow>
              </tr>
            )}
            {visibleCryptos.map((crypto, index) => {
              const isFavorite = favorites.includes(crypto.id);
              return (
                <BodyRow
                  key={crypto.id}
                  $clickable={Boolean(onSelect)}
                  onClick={onSelect ? () => onSelect(crypto) : undefined}
                >
                  {showFavoriteToggle && (
                    <BodyCell>
                      <FavoriteButton
                        type="button"
                        $active={isFavorite}
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(crypto.id);
                        }}
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
    </Wrapper>
  );
};

export default CryptoTable;
