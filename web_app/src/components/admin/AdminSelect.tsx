import React from 'react';
import Select, { StylesConfig } from 'react-select';

export interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  options: AdminSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
  className?: string;
  isDisabled?: boolean;
}

export const AdminSelect: React.FC<AdminSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isSearchable = false,
  className = '',
  isDisabled = false,
}) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const customStyles: StylesConfig<AdminSelectOption, false> = {
    control: (base, state) => ({
      ...base,
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(8px)',
      borderColor: state.isFocused ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)',
      '&:hover': {
        borderColor: state.isFocused ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.2)',
      },
      borderRadius: '12px',
      color: '#fff',
      boxShadow: 'none',
      minHeight: '38px',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.6 : 1,
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 12px',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#fff',
      fontSize: '14px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '14px',
    }),
    input: (base) => ({
      ...base,
      color: '#fff',
      fontSize: '14px',
    }),
    menu: (base) => ({
      ...base,
      background: '#0f172a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      background: '#0f172a',
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected 
        ? 'rgba(34, 197, 94, 0.3)' 
        : state.isFocused 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'transparent',
      color: state.isSelected ? '#4ade80' : '#d1d5db',
      cursor: 'pointer',
      fontSize: '14px',
      borderRadius: '8px',
      padding: '8px 12px',
      '&:active': {
        background: 'rgba(34, 197, 94, 0.4)',
      },
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#94a3b8',
      '&:hover': {
        color: '#fff',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  };

  return (
    <div className={className}>
      <Select<AdminSelectOption, false>
        options={options}
        value={selectedOption}
        onChange={(newValue) => {
          if (newValue) {
            onChange(newValue.value);
          } else {
            onChange('');
          }
        }}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        styles={customStyles}
      />
    </div>
  );
};

export default AdminSelect;
