import { createFileRoute } from '@tanstack/react-router';
import AuthCallback from '../features/auth/ui/AuthCallback.js';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});
