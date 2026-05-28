import { createFileRoute } from '@tanstack/react-router';
import ProtectedRoute from '../features/auth/ui/ProtectedRoute.js';
import SettingsPage from '../features/auth/ui/SettingsPage.js';

const SettingsRoute = (): React.ReactElement => (
  <ProtectedRoute>
    <SettingsPage />
  </ProtectedRoute>
);

export const Route = createFileRoute('/settings')({
  component: SettingsRoute,
});
