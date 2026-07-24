import React from 'react';

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
    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 12px 22px rgba(2, 132, 199, 0.18)',
  },
  secondary: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
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

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '12px', borderRadius: '999px' },
  md: { padding: '8px 16px', fontSize: '14px', borderRadius: '999px' },
  lg: { padding: '11px 20px', fontSize: '15px', borderRadius: '999px' },
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
