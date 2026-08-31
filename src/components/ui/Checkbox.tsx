import { forwardRef, type InputHTMLAttributes } from 'react';

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ checked, disabled, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      style={{
        width: 18,
        height: 18,
        accentColor: 'var(--accent)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
      }}
      {...props}
    />
  ),
);

Checkbox.displayName = 'Checkbox';