import type { CSSProperties } from 'react';

/**
 * Shared surface tokens.
 *
 * Every card, tile, control and section in the app is built from the values in
 * this file. Before this existed each page invented its own radius (6 → 30),
 * its own shadow (28 distinct strings) and its own label size, so two screens
 * side by side never looked like the same product. Import from here instead of
 * writing a new literal — and if you need a new repeated pattern, add it here.
 */

/** Corner radii. Cards and tiles nest, so the tile radius is deliberately smaller. */
export const radius = {
  /** Page sections, panels, tables, modals. */
  card: 16,
  /** Anything nested inside a card: metric tiles, list rows, info lines. */
  tile: 12,
  /** Inputs, selects, textareas and square buttons. */
  control: 10,
  /** Pills: badges, chips, nav links, primary buttons. */
  pill: 999,
} as const;

/** Two elevations only. Cards use `card`; things that float use `raised`. */
export const shadow = {
  card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 24px rgba(15, 23, 42, 0.05)',
  raised: '0 4px 12px rgba(15, 23, 42, 0.06), 0 24px 56px rgba(15, 23, 42, 0.12)',
} as const;

/** Vertical/horizontal rhythm. Sections are 16 apart, tiles inside them 12. */
export const space = {
  /** Gap between top-level sections of a page. */
  page: 16,
  /** Gap between blocks inside a section. */
  section: 16,
  /** Gap between tiles in a metric/card grid. */
  tile: 12,
  /** Gap between an icon and its label, a field and its hint, etc. */
  inline: 8,
} as const;

/** Shared height for inputs, selects and md buttons so a filter row lines up. */
export const controlHeight = 38;

/** Top-level page wrapper: a single column of sections with a consistent gap. */
export const pageStack: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: space.page,
};

/** The base card. Header surfaces and content sections share it so the radius
 *  and elevation never drift between screens. */
export const workspaceSurface: CSSProperties = {
  borderRadius: radius.card,
  padding: 20,
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border)',
  boxShadow: shadow.card,
  color: 'var(--text-primary)',
};

/** A content section below the header. Same skin as the header, plus an
 *  internal column layout, since almost every section wants one. */
export const workspaceCard: CSSProperties = {
  ...workspaceSurface,
  display: 'flex',
  flexDirection: 'column',
  gap: space.section,
};

/** A tile inside a card: metric, stat or KPI. */
export const workspaceTile: CSSProperties = {
  padding: '12px 14px',
  borderRadius: radius.tile,
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
};

/** The small accent line above a page or section title. */
export const workspaceEyebrow: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--accent-dark)',
  fontWeight: 700,
};

/** Section heading. One size for every "h2"-level title in the app. */
export const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 700,
  lineHeight: 1.3,
  color: 'var(--text-primary)',
};

/** The explanatory line under a section title. */
export const sectionSubtitle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.45,
  color: 'var(--text-secondary)',
};

/** Small uppercase label above a value. */
export const workspaceTileLabel: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  fontWeight: 600,
};

/** Numeric value inside a tile. */
export const workspaceTileValue: CSSProperties = {
  marginTop: 6,
  fontSize: 20,
  fontWeight: 800,
  lineHeight: 1.15,
  color: 'var(--text-primary)',
  fontVariantNumeric: 'tabular-nums',
};

/** The headline number of a KPI card — one step above a tile value. */
export const workspaceMetricValue: CSSProperties = {
  ...workspaceTileValue,
  fontSize: 26,
  lineHeight: 1.1,
};

export const workspaceTileDetail: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--text-muted)',
};

/** Muted supporting text (captions, hints, "sem dados" inline notes). */
export const workspaceMuted: CSSProperties = {
  fontSize: 13,
  color: 'var(--text-muted)',
};

/** Pill used for the secondary navigation links in a header. */
export const workspaceLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 12px',
  borderRadius: radius.pill,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600,
};

/** Full-width link that reads as a secondary button (card footers). */
export const workspaceCardAction: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: controlHeight,
  borderRadius: radius.control,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600,
};

/** Grid of metric tiles that reflows instead of squashing at 4 columns. */
export const metricGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: space.tile,
};
