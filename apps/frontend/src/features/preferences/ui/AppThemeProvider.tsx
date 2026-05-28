import React, { useMemo } from 'react';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../../../shared/theme.js';
import { GlobalStyle } from '../../../shared/global-style.js';
import { usePreferences } from '../application/hooks.js';

interface AppThemeProviderProps {
  children: React.ReactNode;
}

const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const { data: preferences } = usePreferences();

  const activeTheme = useMemo(
    () => (preferences?.theme === 'dark' ? darkTheme : lightTheme),
    [preferences?.theme]
  );

  return (
    <ThemeProvider theme={activeTheme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
