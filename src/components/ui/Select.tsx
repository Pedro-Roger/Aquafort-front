import React, { useId } from 'react';
import { controlHeight, radius, space } from './surfaces';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  /** Override the label color when the select sits on a dark surface. */
  labelStyle?: React.CSSProperties;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, style, labelStyle, id, ...props }, ref) => {
    const reactId = useId();
    const selectId = id ?? reactId;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label htmlFor={selectId} style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em', ...labelStyle }}>
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          style={{
            backgroundColor: 'var(--bg-input)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: radius.control,
            height: controlHeight,
            padding: `0 ${space.inline + 4}px`,
            color: 'var(--text-primary)',
            outline: 'none',
            width: '100%',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230284c7' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '32px',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border-focus)';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 4px rgba(220, 38, 38, 0.10)'
              : '0 0 0 4px rgba(2, 132, 199, 0.10)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(15, 23, 42, 0.03)';
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--danger)', paddingLeft: '2px' }}>{error}</span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
