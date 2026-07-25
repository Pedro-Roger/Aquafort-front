import React from 'react';
import { Inbox } from 'lucide-react';
import { radius } from './surfaces';

interface EmptyStateProps {
  /** Short sentence explaining that there is nothing here yet. */
  title: string;
  /** Optional second line: what the user can do about it. */
  description?: string;
  /** Defaults to a neutral inbox glyph. Pass `null` to hide it entirely. */
  icon?: React.ReactNode;
  /** Optional button/link rendered under the text. */
  action?: React.ReactNode;
  /** Tighter variant for empty slots inside an already small card. */
  compact?: boolean;
  style?: React.CSSProperties;
}

/**
 * The single treatment for "there is no data here".
 *
 * Previously every screen shipped its own loose grey sentence, at a different
 * size, alignment and padding. This centres the message, gives it an icon and
 * a consistent amount of breathing room so an empty table no longer reads as a
 * rendering bug.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  style,
}: EmptyStateProps) {
  const glyph = icon === undefined ? <Inbox size={compact ? 18 : 22} /> : icon;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: compact ? 6 : 8,
        padding: compact ? '20px 16px' : '36px 20px',
        borderRadius: radius.tile,
        color: 'var(--text-secondary)',
        ...style,
      }}
    >
      {glyph && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: radius.pill,
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent-dark)',
          }}
        >
          {glyph}
        </span>
      )}
      <span
        style={{
          fontSize: compact ? 13 : 14,
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}
      >
        {title}
      </span>
      {description && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.5 }}>
          {description}
        </span>
      )}
      {action && <span style={{ marginTop: 4 }}>{action}</span>}
    </div>
  );
}
