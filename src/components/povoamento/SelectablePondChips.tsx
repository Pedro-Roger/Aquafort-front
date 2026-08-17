import { useId, useMemo, useState } from 'react';
import { controlHeight, radius, space } from '../ui/surfaces';
import type { Pond } from '../../types';

interface SelectablePondChipsProps {
  ponds: Pond[];
  selectedIds: Set<string>;
  onToggle: (pondId: string) => void;
}

/**
 * Vertical, searchable list of ponds that doubles as a multi-select picker —
 * click a row (or its checkbox) to add/remove it from the selection driving
 * "Criar povoamento". Replaces the old paginated chip grid: the full list is
 * always reachable via scroll instead of "Anterior/Próxima" clicks, and the
 * "Procurar" field filters by code (and name) as the user types.
 */
export function SelectablePondChips({ ponds, selectedIds, onToggle }: SelectablePondChipsProps) {
  const searchInputId = useId();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ponds;
    return ponds.filter(
      (pond) => pond.code.toLowerCase().includes(q) || pond.name.toLowerCase().includes(q),
    );
  }, [ponds, query]);

  if (ponds.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sem viveiros cadastrados.</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.inline }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor={searchInputId}
          style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em' }}
        >
          Procurar
        </label>
        <div style={{ position: 'relative' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            aria-hidden="true"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id={searchInputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar por código ou nome..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: controlHeight,
              borderRadius: radius.control,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              padding: `0 ${space.inline + 4}px 0 32px`,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div
        style={{
          maxHeight: 260,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: radius.control,
          backgroundColor: 'var(--bg-card)',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhum viveiro encontrado para "{query.trim()}".
          </div>
        ) : (
          filtered.map((pond) => {
            const selected = selectedIds.has(pond.id);
            return (
              <button
                key={pond.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(pond.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: space.inline,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: selected ? 'var(--accent-soft)' : 'transparent',
                  color: selected ? 'var(--accent-dark)' : 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: selected ? 700 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    backgroundColor: selected ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pond.code}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
