import { createFileRoute } from '@tanstack/react-router';
import ProtectedRoute from '../features/auth/ui/ProtectedRoute.js';
import AdminRoute from '../features/auth/ui/AdminRoute.js';
import UsersPage from '../features/users/ui/UsersPage.js';

const UsersRoute = (): React.ReactElement => (
  <ProtectedRoute>
    <AdminRoute>
      <UsersPage />
    </AdminRoute>
  </ProtectedRoute>
);

export const Route = createFileRoute('/users')({
  component: UsersRoute,
});
