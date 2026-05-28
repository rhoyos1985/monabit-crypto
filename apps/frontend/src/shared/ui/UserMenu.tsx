import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import styled from 'styled-components';
import { useAuth, useLogout } from '../../features/auth/application/hooks.js';
import { usePreferences, useUpdatePreferences } from '../../features/preferences/application/hooks.js';
import { useToast } from './Toast/ToastProvider.js';

const Wrapper = styled.div`
  position: relative;
`;

const AvatarButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${(props) => props.theme.surface.surface};
  background: ${(props) => props.theme.brandAccent};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    outline: 2px solid ${(props) => props.theme.brandPrimary};
    outline-offset: 2px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: ${(props) => props.theme.surface.surfaceElevated};
  border: 1px solid ${(props) => props.theme.surface.border};
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  min-width: 240px;
  padding: 8px 0;
  z-index: 100;
  overflow: hidden;
`;

const UserBlock = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${(props) => props.theme.surface.border};
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.surface.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserEmail = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.surface.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => props.theme.surface.textMuted};
  padding: 10px 16px 4px;
`;

const ThemeRow = styled.div`
  display: flex;
  gap: 6px;
  padding: 4px 12px 8px;
`;

const ThemeOption = styled.button<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  background: ${(props) =>
    props.$active ? props.theme.brandPrimary : 'transparent'};
  color: ${(props) =>
    props.$active ? '#fff' : props.theme.surface.textPrimary};
  border: 1px solid
    ${(props) =>
      props.$active ? props.theme.brandPrimary : props.theme.surface.border};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$active ? props.theme.brandPrimary : props.theme.surface.surface};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${(props) => props.theme.surface.border};
  margin: 4px 0;
`;

const MenuItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  color: ${(props) => props.theme.surface.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;

  &:hover {
    background: ${(props) => props.theme.surface.background};
  }
`;

const MenuItemDestructive = styled(MenuItem)`
  color: #c33;
`;

const SunIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
  const first = firstName?.[0]?.toUpperCase() ?? '';
  const last = lastName?.[0]?.toUpperCase() ?? '';
  if (first || last) return `${first}${last}`;
  return email?.[0]?.toUpperCase() ?? '?';
};

interface UserMenuProps {}

const UserMenu: React.FC<UserMenuProps> = () => {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: preferences } = usePreferences();
  const { mutate: updatePreferences, isPending: isUpdatingTheme } = useUpdatePreferences();
  const { showError } = useToast();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [avatarFailed, setAvatarFailed] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  const handleSettings = (): void => {
    setIsOpen(false);
    void navigate({ to: '/settings' });
  };

  const handleLogout = async (): Promise<void> => {
    setIsOpen(false);
    await logout();
    void navigate({ to: '/login' });
  };

  const handleThemeChange = (theme: 'light' | 'dark'): void => {
    if (preferences?.theme === theme) return;
    updatePreferences(
      { theme },
      {
        onError: (err) => showError(err.message || 'No se pudo cambiar el tema'),
      }
    );
  };

  const initials = useMemo(
    () => getInitials(user?.firstName, user?.lastName, user?.email),
    [user?.firstName, user?.lastName, user?.email]
  );

  const fullName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '',
    [user?.firstName, user?.lastName, user?.email]
  );

  if (!user) return null;

  const showAvatar = user.avatarUrl && !avatarFailed;
  const currentTheme = preferences?.theme ?? 'light';

  return (
    <Wrapper ref={wrapperRef}>
      <AvatarButton
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menú de usuario"
        title={fullName}
      >
        {showAvatar ? (
          <img
            src={user.avatarUrl}
            alt={fullName}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          initials
        )}
      </AvatarButton>
      {isOpen && (
        <Menu>
          <UserBlock>
            <UserName>{fullName}</UserName>
            <UserEmail>{user.email}</UserEmail>
          </UserBlock>
          <SectionLabel>Tema</SectionLabel>
          <ThemeRow>
            <ThemeOption
              type="button"
              $active={currentTheme === 'light'}
              onClick={() => handleThemeChange('light')}
              disabled={isUpdatingTheme}
            >
              <SunIcon />
              Claro
            </ThemeOption>
            <ThemeOption
              type="button"
              $active={currentTheme === 'dark'}
              onClick={() => handleThemeChange('dark')}
              disabled={isUpdatingTheme}
            >
              <MoonIcon />
              Oscuro
            </ThemeOption>
          </ThemeRow>
          <Divider />
          <MenuItem type="button" onClick={handleSettings}>
            Configuración
          </MenuItem>
          <MenuItemDestructive type="button" onClick={() => void handleLogout()}>
            Cerrar sesión
          </MenuItemDestructive>
        </Menu>
      )}
    </Wrapper>
  );
};

export default UserMenu;
