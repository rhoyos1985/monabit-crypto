import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth, useLogout } from '../../features/auth/application/hooks.js';

const Wrapper = styled.div`
  position: relative;
`;

const AvatarButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
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
  background: white;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  min-width: 220px;
  padding: 8px 0;
  z-index: 100;
  overflow: hidden;
`;

const UserBlock = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.brandDark};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserEmail = styled.div`
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
`;

const MenuItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  color: ${(props) => props.theme.brandDark};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;

  &:hover {
    background: #f5f5f5;
  }
`;

const MenuItemDestructive = styled(MenuItem)`
  color: #c33;
`;

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
    navigate('/settings');
  };

  const handleLogout = async (): Promise<void> => {
    setIsOpen(false);
    await logout();
    navigate('/login');
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
          <MenuItem type="button" onClick={handleSettings}>
            Configuración
          </MenuItem>
          <MenuItemDestructive type="button" onClick={handleLogout}>
            Cerrar sesión
          </MenuItemDestructive>
        </Menu>
      )}
    </Wrapper>
  );
};

export default UserMenu;
