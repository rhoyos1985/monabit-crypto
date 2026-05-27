import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/utils.js';
import CryptoTable from './CryptoTable.js';
import type { CryptoData } from '../domain/types.js';

vi.mock('../../preferences/application/hooks.js', () => ({
  usePreferences: vi.fn(),
  useToggleFavorite: vi.fn(),
}));

import {
  usePreferences,
  useToggleFavorite,
} from '../../preferences/application/hooks.js';

const buildCrypto = (overrides: Partial<CryptoData> = {}): CryptoData => ({
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'btc.png',
  currentPrice: 50000,
  marketCap: 1_000_000_000,
  marketCapRank: 1,
  totalVolume: 50_000_000,
  changePercent24h: 2.5,
  lastUpdated: '2026-05-27T00:00:00Z',
  ...overrides,
});

describe('CryptoTable', () => {
  const toggleFavoriteMock = vi.fn();

  beforeEach(() => {
    toggleFavoriteMock.mockReset();
    vi.mocked(usePreferences).mockReturnValue({
      data: { userId: 'u-1', theme: 'light', favoriteCoins: ['bitcoin'], updatedAt: '' },
      isLoading: false,
      error: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.mocked(useToggleFavorite).mockReturnValue({
      mutate: toggleFavoriteMock,
      isPending: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renderiza las criptos con su nombre y precio formateado', () => {
    renderWithProviders(<CryptoTable cryptos={[buildCrypto()]} />);

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
  });

  it('muestra la variación 24h con signo y porcentaje', () => {
    renderWithProviders(<CryptoTable cryptos={[buildCrypto({ changePercent24h: -3.14 })]} />);
    expect(screen.getByText('-3.14%')).toBeInTheDocument();
  });

  it('marca como favorita la cripto que está en la lista de favoritos del usuario', () => {
    renderWithProviders(<CryptoTable cryptos={[buildCrypto()]} />);
    const favButton = screen.getByLabelText('Quitar de favoritos');
    expect(favButton).toBeInTheDocument();
  });

  it('llama a toggleFavorite con el id de la cripto al hacer click en la estrella', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CryptoTable cryptos={[buildCrypto()]} />);

    await user.click(screen.getByLabelText('Quitar de favoritos'));

    expect(toggleFavoriteMock).toHaveBeenCalledWith('bitcoin');
  });

  it('no muestra la columna de favoritos cuando showFavoriteToggle es false', () => {
    renderWithProviders(<CryptoTable cryptos={[buildCrypto()]} showFavoriteToggle={false} />);
    expect(screen.queryByLabelText('Quitar de favoritos')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Agregar a favoritos')).not.toBeInTheDocument();
  });
});
