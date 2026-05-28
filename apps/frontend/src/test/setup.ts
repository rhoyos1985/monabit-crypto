import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.stubEnv('VITE_ENCRYPTION_ENABLED', 'false');

afterEach(() => {
  cleanup();
});
