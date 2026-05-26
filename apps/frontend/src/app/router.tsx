import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/ui/LoginPage.js';
import RegisterPage from '../features/auth/ui/RegisterPage.js';
import ProtectedRoute from '../features/auth/ui/ProtectedRoute.js';
import DashboardPage from '../features/dashboard/ui/DashboardPage.js';

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
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
