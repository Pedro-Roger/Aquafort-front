import React, { useId } from 'react';
import { controlHeight, radius, space } from './surfaces';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, id, ...props }, ref) => {
    const reactId = useId();
    const inputId = id ?? reactId;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em' }}>
            {label}
          </label>
        )}
        <input
          id={inputId}
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
            transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
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
        />
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--danger)', paddingLeft: '2px' }}>{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
