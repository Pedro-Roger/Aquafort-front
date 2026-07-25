import type { CSSProperties } from 'react';

/**
 * Shared surfaces for the page headers.
 *
 * These blocks used to be heavy dark-blue gradients, which fought the rest of
 * the app — every card below them is white on a near-white background — and
 * forced per-element contrast overrides on labels and ghost buttons. They are
 * light now: the accent carries meaning instead of covering a whole slab.
 */

export const workspaceSurface: CSSProperties = {
  borderRadius: 24,
  padding: 22,
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border)',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  color: 'var(--text-primary)',
};

/** A tile inside a header: metric, stat or KPI. */
export const workspaceTile: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
};

export const workspaceEyebrow: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--accent-dark)',
  fontWeight: 700,
};

export const workspaceTileLabel: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  fontWeight: 600,
};

export const workspaceTileValue: CSSProperties = {
  marginTop: 6,
  fontSize: 20,
  fontWeight: 800,
  lineHeight: 1.15,
  color: 'var(--text-primary)',
};

export const workspaceTileDetail: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--text-muted)',
};

/** Pill used for the secondary navigation links in a header. */
export const workspaceLink: CSSProperties = {
  padding: '7px 12px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600,
};
