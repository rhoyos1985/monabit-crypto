import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/utils.js';
import LoginPage from './LoginPage.js';

const loginMock = vi.fn();
const googleLoginMock = vi.fn();

vi.mock('../application/hooks.js', () => ({
  useLogin: () => loginMock,
  useGoogleLogin: () => googleLoginMock,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
    googleLoginMock.mockReset();
  });

  it('renderiza los campos email, contraseña y botones de login y Google', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
  });

  it('submit invoca useLogin con email y contraseña', async () => {
    loginMock.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/Contraseña/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    expect(loginMock).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret123' });
  });

  it('muestra mensaje de error cuando el login falla', async () => {
    loginMock.mockRejectedValueOnce(new Error('Credenciales inválidas'));
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/Contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('click en "Continuar con Google" invoca useGoogleLogin', async () => {
    googleLoginMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /Continuar con Google/i }));

    expect(googleLoginMock).toHaveBeenCalled();
  });
});
