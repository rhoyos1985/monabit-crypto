import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store.js';
import { ToastProvider } from '../shared/ui/Toast/ToastProvider.js';
import AppThemeProvider from '../features/preferences/ui/AppThemeProvider.js';
import { useSessionBootstrap } from '../features/auth/application/hooks.js';
import { routeTree } from '../routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Rehidrata la sesion desde la cookie httpOnly (GET /auth/me) al montar la app,
// antes de renderizar las rutas. Debe vivir dentro del Provider de Redux.
const SessionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSessionBootstrap();
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <ToastProvider>
            <SessionGate>
              <RouterProvider router={router} />
            </SessionGate>
          </ToastProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
