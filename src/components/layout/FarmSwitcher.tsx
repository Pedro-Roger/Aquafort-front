import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Search } from 'lucide-react';
import { useFarm } from '../../hooks/useFarm';
import { radius, space } from '../ui/surfaces';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  TECNICO: 'Técnico',
  OPERADOR: 'Operador',
};

/**
 * Seletor de fazenda no header (RF-05). Dropdown com busca incremental —
 * necessário pro caso de usuário com muitas fazendas vinculadas (plan.md,
 * seção 8, "Riscos & Mitigações"). O papel exibido ao lado de cada fazenda
 * é o papel efetivo NAQUELA fazenda (RN-03), não o role global do JWT.
 */
export function FarmSwitcher() {
  const { farms, farmsLoading, activeFarmId, activeFarmName, activeFarmRole, isSwitchingFarm, switchFarm } = useFarm();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return farms;
    return farms.filter((farm) => farm.farmName.toLowerCase().includes(q));
  }, [farms, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Nada pra trocar: uma fazenda só, ou ainda carregando.
  if (!farmsLoading && farms.length <= 1) {
    if (!activeFarmName) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
        <Building2 size={15} color="#0284c7" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeFarmName}</span>
          {activeFarmRole && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ROLE_LABEL[activeFarmRole] ?? activeFarmRole}</span>
          )}
        </div>
      </div>
    );
  }

  function openDropdown() {
    setOpen(true);
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleSelect(farmId: string) {
    if (farmId === activeFarmId) {
      setOpen(false);
      setQuery('');
      return;
    }
    setOpen(false);
    setQuery('');
    await switchFarm(farmId);
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        disabled={isSwitchingFarm || farmsLoading}
        title="Trocar de fazenda"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: radius.pill,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-elevated)',
          cursor: isSwitchingFarm || farmsLoading ? 'wait' : 'pointer',
          opacity: isSwitchingFarm ? 0.7 : 1,
        }}
      >
        <Building2 size={15} color="#0284c7" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, textAlign: 'left' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {farmsLoading ? 'Carregando…' : activeFarmName ?? 'Selecionar fazenda'}
          </span>
          {activeFarmRole && !farmsLoading && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ROLE_LABEL[activeFarmRole] ?? activeFarmRole}</span>
          )}
        </div>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            zIndex: 60,
            width: 260,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: radius.control,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', borderBottom: '1px solid var(--border)' }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar fazenda..."
              style={{
                flex: 1,
                border: 'none',
                height: 38,
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: 13,
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', padding: space.inline / 2 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma fazenda encontrada.</div>
            )}
            {filtered.map((farm) => {
              const active = farm.farmId === activeFarmId;
              return (
                <button
                  key={farm.farmId}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-testid={`farm-option-${farm.farmId}`}
                  onClick={() => handleSelect(farm.farmId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: radius.tile,
                    border: 'none',
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {farm.farmName}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {ROLE_LABEL[farm.role] ?? farm.role}
                      {farm.status === 'INACTIVE' ? ' · inativa' : ''}
                    </span>
                  </span>
                  {active && <Check size={14} color="var(--accent-dark)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
