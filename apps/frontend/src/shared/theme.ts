const brandPrimary = '#0098BF';
const brandAccent = '#00B0C7';
const brandDark = '#231F20';

const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const media = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  maxSm: `@media (max-width: ${breakpoints.sm})`,
  maxMd: `@media (max-width: ${breakpoints.md})`,
  maxLg: `@media (max-width: ${breakpoints.lg})`,
} as const;

interface ColorMode {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  overlay: string;
  inputBackground: string;
}

const lightMode: ColorMode = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: brandDark,
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  inputBackground: '#FFFFFF',
};

const darkMode: ColorMode = {
  background: '#0F1419',
  surface: '#1A1F26',
  surfaceElevated: '#242A33',
  border: '#2F3742',
  textPrimary: '#F5F7FA',
  textSecondary: '#B8C0CC',
  textMuted: '#7A8493',
  overlay: 'rgba(0, 0, 0, 0.7)',
  inputBackground: '#1A1F26',
};

const baseTheme = {
  brandPrimary,
  brandAccent,
  brandDark,
  colors: {
    brand: {
      primary: brandPrimary,
      accent: brandAccent,
      dark: brandDark,
    },
    neutral: {
      white: '#FFFFFF',
      light: '#F5F7FA',
      medium: '#D1D5DB',
      dark: '#6B7280',
      black: '#111827',
    },
    semantic: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: brandAccent,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  breakpoints,
  media,
} as const;

export type ThemeMode = 'light' | 'dark';

export const lightTheme = {
  ...baseTheme,
  mode: 'light' as ThemeMode,
  surface: lightMode,
};

export const darkTheme = {
  ...baseTheme,
  mode: 'dark' as ThemeMode,
  surface: darkMode,
};

export const theme = lightTheme;

export type Theme = typeof lightTheme;
