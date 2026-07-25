import React from 'react';
import { controlHeight, radius } from './surfaces';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--accent)',
    color: '#fff',
    border: '1px solid var(--accent)',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  secondary: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    backgroundColor: 'var(--danger)',
    color: '#fff',
    border: '1px solid transparent',
  },
};

// Heights are locked to the input scale so a "filtro + botão" row lines up.
const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { height: 30, padding: '0 12px', fontSize: '12px', borderRadius: radius.control },
  md: { height: controlHeight, padding: '0 16px', fontSize: '14px', borderRadius: radius.control },
  lg: { height: 44, padding: '0 20px', fontSize: '15px', borderRadius: radius.control },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.65 : 1,
        transition: 'opacity 0.15s, background-color 0.15s, transform 0.15s, box-shadow 0.15s',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      ) : icon}
      {children}
    </button>
  );
}
