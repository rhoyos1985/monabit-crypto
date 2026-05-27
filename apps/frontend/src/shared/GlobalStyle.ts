import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    font-family: ${(props) => props.theme.typography.fontFamily};
    background: ${(props) => props.theme.surface.background};
    color: ${(props) => props.theme.surface.textPrimary};
    transition: background 0.2s ease, color 0.2s ease;
  }

  #root {
    min-height: 100vh;
  }

  button {
    font-family: inherit;
  }

  a {
    color: ${(props) => props.theme.brandPrimary};
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme.surface.background};
  }
  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.surface.border};
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.surface.textMuted};
  }
`;
