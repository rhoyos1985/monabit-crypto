import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/ui/LoginPage.js';
import RegisterPage from '../features/auth/ui/RegisterPage.js';
import ProtectedRoute from '../features/auth/ui/ProtectedRoute.js';
import AdminRoute from '../features/auth/ui/AdminRoute.js';
import DashboardPage from '../features/dashboard/ui/DashboardPage.js';
import UsersPage from '../features/users/ui/UsersPage.js';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <AdminRoute>
          <UsersPage />
        </AdminRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
