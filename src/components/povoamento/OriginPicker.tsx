import { Input } from '../ui/Input';
import { radius, space, workspaceTileLabel } from '../ui/surfaces';
import { calculateOriginBalance, sumOriginQuantities, type OriginAllocation } from '../../pages/povoamento';

export interface OriginOption {
  cycleId: string;
  label: string;
  plCount: number;
  /** Already drawn by other, already-saved viveiros — from the backend. */
  allocatedElsewhere: number;
}

interface OriginPickerProps {
  options: OriginOption[];
  value: OriginAllocation[];
  onChange: (next: OriginAllocation[]) => void;
}

/**
 * Multi-select of berçário origins for a viveiro stocked by transfer. Shows
 * the saldo disponível per berçário (from the backend's already-saved
 * allocations only — NOT reduced by quantities picked for the same
 * berçário in other rows of this same unsaved form) and flags — never
 * blocks — a request above it, since real headcounts drift from what was
 * logged and the whole check is advisory, not authoritative.
 */
export function OriginPicker({ options, value, onChange }: OriginPickerProps) {
  const selectedIds = new Set(value.map((origin) => origin.sourceCycleId));
  const total = sumOriginQuantities(value);

  function toggle(option: OriginOption) {
    if (selectedIds.has(option.cycleId)) {
      onChange(value.filter((origin) => origin.sourceCycleId !== option.cycleId));
    } else {
      onChange([...value, { sourceCycleId: option.cycleId, label: option.label, quantity: 0 }]);
    }
  }

  function setQuantity(cycleId: string, quantity: number) {
    onChange(value.map((origin) => (origin.sourceCycleId === cycleId ? { ...origin, quantity } : origin)));
  }

  return (
    <div style={{ display: 'grid', gap: space.inline }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline }}>
        {options.map((option) => {
          const selected = selectedIds.has(option.cycleId);
          return (
            <button
              key={option.cycleId}
              type="button"
              onClick={() => toggle(option)}
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
              {option.label} · disponível {option.plCount - option.allocatedElsewhere}
            </button>
          );
        })}
        {options.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nenhum berçário ativo disponível.</span>
        )}
      </div>

      {value.map((origin) => {
        const option = options.find((o) => o.cycleId === origin.sourceCycleId);
        const balance = option
          ? calculateOriginBalance(option.plCount, option.allocatedElsewhere, origin.quantity)
          : null;

        return (
          <div key={origin.sourceCycleId} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: space.inline, alignItems: 'end' }}>
            <div>
              <div style={workspaceTileLabel}>{origin.label}</div>
              {balance?.isOverdrawn && (
                <div style={{ color: 'var(--warning, #b45309)', fontSize: 12, marginTop: 2 }}>
                  Acima do saldo registrado ({balance.remaining} disponível) — confira a pesagem.
                </div>
              )}
            </div>
            <Input
              label={`Quantidade — ${origin.label}`}
              type="number"
              min={0}
              step="1"
              value={origin.quantity === 0 ? '' : origin.quantity}
              onChange={(e) => setQuantity(origin.sourceCycleId, Number(e.target.value || 0))}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((o) => o.sourceCycleId !== origin.sourceCycleId))}
              aria-label={`Remover ${origin.label}`}
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                borderRadius: radius.control,
                cursor: 'pointer',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}

      {value.length > 0 && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Total das origens: <strong style={{ color: 'var(--text-primary)' }}>{total.toLocaleString('pt-BR')}</strong>
        </div>
      )}
    </div>
  );
}
