import React, { useState, useMemo, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useCities } from '../application/hooks.js';
import type { CityLocation } from '../domain/types.js';

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const InputField = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 12px;
  border: 1px solid ${(props) => (props.$hasError ? '#c33' : '#ccc')};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  background: white;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.brandPrimary};
    box-shadow: 0 0 0 3px ${(props) => props.theme.brandPrimary}20;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Dropdown = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin: 0;
  padding: 4px 0;
  list-style: none;
  z-index: 50;
`;

const Option = styled.li<{ $highlighted?: boolean }>`
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  background: ${(props) => (props.$highlighted ? props.theme.brandAccent + '20' : 'transparent')};

  &:hover {
    background: ${(props) => props.theme.brandAccent}20;
  }
`;

const EmptyState = styled.div`
  padding: 12px;
  font-size: 13px;
  color: #999;
  text-align: center;
`;

const HelperText = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #999;
`;

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

interface CitySelectProps {
  value: CityLocation | null;
  onChange: (location: CityLocation | null) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  id?: string;
}

const CitySelect: React.FC<CitySelectProps> = ({
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = 'Busca tu ciudad...',
  id,
}) => {
  const { data: cities, isLoading } = useCities();
  const [query, setQuery] = useState<string>(value?.label ?? '');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.label ?? '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (value) {
          setQuery(value.label);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredCities = useMemo<CityLocation[]>(() => {
    if (!cities) return [];
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return cities.slice(0, 100);
    return cities.filter((c) => normalize(c.label).includes(normalizedQuery)).slice(0, 100);
  }, [cities, query]);

  const handleSelect = (city: CityLocation): void => {
    onChange(city);
    setQuery(city.label);
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
    setIsOpen(true);
    if (value && value.label !== e.target.value) {
      onChange(null);
    }
  };

  return (
    <Wrapper ref={wrapperRef}>
      <InputField
        id={id}
        name={id}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        placeholder={isLoading ? 'Cargando ciudades...' : placeholder}
        disabled={disabled || isLoading}
        $hasError={hasError}
        autoComplete="address-level2"
      />
      {isOpen && !isLoading && (
        <Dropdown>
          {filteredCities.length === 0 ? (
            <EmptyState>No se encontraron ciudades</EmptyState>
          ) : (
            filteredCities.map((city) => (
              <Option
                key={`${city.city}-${city.state}`}
                onClick={() => handleSelect(city)}
                $highlighted={value?.label === city.label}
              >
                {city.label}
              </Option>
            ))
          )}
        </Dropdown>
      )}
      {!value && query && !isOpen && (
        <HelperText>Selecciona una ciudad del listado</HelperText>
      )}
    </Wrapper>
  );
};

export default CitySelect;
