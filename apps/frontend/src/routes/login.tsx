import { createFileRoute } from '@tanstack/react-router';
import LoginPage from '../features/auth/ui/LoginPage.js';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});
