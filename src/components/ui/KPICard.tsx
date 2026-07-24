import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  color?: string;
  style?: React.CSSProperties;
}

export function KPICard({ label, value, unit, icon, trend, color = '#0ea5e9', style }: KPICardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        boxShadow: '0 14px 30px rgba(15, 23, 42, 0.05)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: 0,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</span>
        )}
      </div>
      {trend !== undefined && (
        <div style={{ fontSize: '12px', color: trend.value >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          {trend.label && <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
