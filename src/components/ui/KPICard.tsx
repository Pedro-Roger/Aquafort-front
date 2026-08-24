import React from 'react';
import { radius, shadow, workspaceMetricValue, workspaceTileLabel } from './surfaces';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  color?: string;
  style?: React.CSSProperties;
}

export function KPICard({ label, value, unit, icon, trend, color = '#2563eb', style }: KPICardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: radius.card,
        boxShadow: shadow.card,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: 0,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={workspaceTileLabel}>
          {label}
        </span>
        {icon && (
          <span style={{ color }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ ...workspaceMetricValue, marginTop: 0 }}>
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
