import React from 'react';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  multiple?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  required = false,
  className,
  id,
  multiple = false,
  ...props
}) => {
  const selectId = id || React.useId();
  const errorId = `${selectId}-error`;

  const classNames = [
    styles.select,
    error && styles.hasError,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-label="required">*</span>}
        </label>
      )}
      
      <div className={styles.selectWrapper}>
        <select
          id={selectId}
          className={classNames}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          multiple={multiple}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className={styles.chevron} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 10.5l4-4h-8l4 4z" />
          </svg>
        </div>
      </div>
      
      {error && (
        <div id={errorId} className={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};