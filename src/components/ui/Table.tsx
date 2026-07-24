import React from 'react';

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
}

export function Table<T>({ columns, data, rowKey, onRowClick, loading, emptyMessage = 'Nenhum registro encontrado' }: TableProps<T>) {
  const thStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--bg-elevated)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '100%', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
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
              <td colSpan={columns.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                Carregando...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.12s',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--bg-card-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ ...tdStyle, textAlign: col.align ?? 'left' }}
                  >
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
