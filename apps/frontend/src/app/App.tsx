import { ThemeProvider } from 'styled-components';
import { theme } from '@/shared/theme';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <div>
        <h1>MonaBit Dashboard - Coming soon</h1>
      </div>
    </ThemeProvider>
  );
};

export default App;
