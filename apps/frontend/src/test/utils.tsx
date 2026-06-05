import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import sessionReducer, { SessionState } from '../app/slices/session.js';
import { lightTheme } from '../shared/theme.js';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedSession?: Partial<SessionState>;
}

export const buildTestStore = (preloadedSession?: Partial<SessionState>) =>
  configureStore({
    reducer: { session: sessionReducer },
    preloadedState: preloadedSession
      ? {
          session: {
            user: null,
            isLoading: false,
            error: null,
            bootstrapped: false,
            ...preloadedSession,
          },
        }
      : undefined,
  });

export const buildTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

type RenderWithProvidersResult = RenderResult & {
  store: ReturnType<typeof buildTestStore>;
  queryClient: ReturnType<typeof buildTestQueryClient>;
};

export const renderWithProviders = (
  ui: ReactElement,
  { preloadedSession, ...options }: RenderWithProvidersOptions = {}
): RenderWithProvidersResult => {
  const store = buildTestStore(preloadedSession);
  const queryClient = buildTestQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
};
