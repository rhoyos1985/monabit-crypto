import { createFileRoute } from '@tanstack/react-router';
import RegisterPage from '../features/auth/ui/RegisterPage.js';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});
