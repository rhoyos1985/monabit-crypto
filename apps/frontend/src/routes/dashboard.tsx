import { createFileRoute } from '@tanstack/react-router';
import ProtectedRoute from '../features/auth/ui/ProtectedRoute.js';
import DashboardPage from '../features/dashboard/ui/DashboardPage.js';

const DashboardRoute = (): React.ReactElement => (
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
);

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoute,
});
