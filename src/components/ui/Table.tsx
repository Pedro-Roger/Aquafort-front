import React from 'react';
import { EmptyState } from './EmptyState';
import { radius } from './surfaces';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  /** Optional second line under the empty message. */
  emptyDescription?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading,
  emptyMessage = 'Nenhum registro encontrado',
  emptyDescription,
}: TableProps<T>) {
  const thStyle: React.CSSProperties = {
    padding: '11px 16px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid var(--border-strong)',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--bg-elevated)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  const tdStyle: React.CSSProperties = {
    padding: '13px 16px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    lineHeight: 1.45,
    whiteSpace: 'nowrap',
  };

  const messageCellStyle: React.CSSProperties = {
    ...tdStyle,
    padding: 0,
    whiteSpace: 'normal',
  };

  return (
    <div
      style={{
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: '100%',
        borderRadius: radius.card,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  ...thStyle,
                  textAlign: col.align ?? 'left',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={messageCellStyle}>
                <EmptyState title="Carregando..." icon={null} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={messageCellStyle}>
                <EmptyState title={emptyMessage} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.12s',
                  backgroundColor: 'transparent',
                  // Hairline between rows only — no rule under the last one, so
                  // the table never looks cut off inside its rounded container.
                  borderTop: index === 0 ? 'none' : '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--bg-card-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col) => {
                  const align = col.align ?? 'left';
                  return (
                    <td
                      key={col.key}
                      style={{
                        ...tdStyle,
                        textAlign: align,
                        // Right-aligned columns are numeric by convention here;
                        // tabular figures keep the decimal points in a column.
                        fontVariantNumeric: align === 'right' ? 'tabular-nums' : undefined,
                      }}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
