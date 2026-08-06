import { useState } from 'react';
import { radius, space } from '../ui/surfaces';
import type { Pond } from '../../types';

const PAGE_SIZE = 8;

interface SelectablePondChipsProps {
  ponds: Pond[];
  selectedIds: Set<string>;
  onToggle: (pondId: string) => void;
}

/**
 * Paginated pond chips that double as a multi-select picker — click a chip
 * to add/remove it from the selection driving "Criar povoamento".
 */
export function SelectablePondChips({ ponds, selectedIds, onToggle }: SelectablePondChipsProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(ponds.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = ponds.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  if (ponds.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sem viveiros cadastrados.</span>;
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline }}>
        {visible.map((pond) => {
          const selected = selectedIds.has(pond.id);
          return (
            <button
              key={pond.id}
              type="button"
              onClick={() => onToggle(pond.id)}
              style={{
                padding: '5px 10px',
                borderRadius: radius.pill,
                backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
                border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                color: selected ? 'var(--accent-dark)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: selected ? 700 : 400,
                cursor: 'pointer',
              }}
              aria-pressed={selected}
            >
              {pond.code}
            </button>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: space.inline }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            style={{ padding: '2px 8px', borderRadius: radius.pill, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 12, cursor: currentPage === 0 ? 'default' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            Anterior
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            style={{ padding: '2px 8px', borderRadius: radius.pill, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 12, cursor: currentPage === totalPages - 1 ? 'default' : 'pointer', opacity: currentPage === totalPages - 1 ? 0.5 : 1 }}
          >
            Próxima
          </button>
        </div>
      )}
    </>
  );
}
