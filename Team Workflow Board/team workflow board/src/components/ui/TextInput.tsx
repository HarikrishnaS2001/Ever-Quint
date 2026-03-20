import React, { forwardRef } from 'react';
import styles from './TextInput.module.css';

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search';
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  'aria-describedby'?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export const TextInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextInputProps>(
  ({
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    disabled = false,
    error,
    required = false,
    className,
    id,
    'aria-describedby': ariaDescribedBy,
    multiline = false,
    rows = 3,
    maxLength,
    onKeyDown,
    ...props
  }, ref) => {
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const describedBy = [
      ariaDescribedBy,
      error ? errorId : undefined
    ].filter(Boolean).join(' ') || undefined;

    const classNames = [
      styles.input,
      error && styles.hasError,
      disabled && styles.disabled,
      className
    ].filter(Boolean).join(' ');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const commonProps = {
      id: inputId,
      className: classNames,
      value,
      onChange: handleChange,
      placeholder,
      disabled,
      required,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : false,
      maxLength,
      onKeyDown,
      ...props
    };

    return (
      <div className={styles.container}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-label="required">*</span>}
          </label>
        )}
        
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            {...commonProps}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            {...commonProps}
          />
        )}
        
        {error && (
          <div id={errorId} className={styles.error} role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);