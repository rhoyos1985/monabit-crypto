import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store.js';
import { router } from './router.js';
import { ToastProvider } from '../shared/ui/Toast/ToastProvider.js';
import AppThemeProvider from '../features/preferences/ui/AppThemeProvider.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <ToastProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </ToastProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
