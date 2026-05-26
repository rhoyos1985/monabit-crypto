import { jsx as _jsx } from "react/jsx-runtime";
import { ThemeProvider } from 'styled-components';
import { theme } from '@/shared/theme';
const App = () => {
    return (_jsx(ThemeProvider, { theme: theme, children: _jsx("div", { children: _jsx("h1", { children: "MonaBit Dashboard - Coming soon" }) }) }));
};
export default App;
//# sourceMappingURL=App.js.map