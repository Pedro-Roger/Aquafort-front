import { useState } from 'react';
import { useCreatePond } from '../../hooks/usePonds';
import type { PondType } from '../../types';
import { POND_TYPE_LABELS, pondCodeTypeMismatch } from '../../lib/pondLabels';
import { formatAreaHa } from '../../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: Array<{ value: PondType; hint: string }> = [
  { value: 'ENGORDA', hint: 'Viveiro de produção principal' },
  { value: 'BERCARIO', hint: 'Fase inicial de crescimento' },
  { value: 'PRE_BERCARIO', hint: 'Recepção e adaptação' },
  { value: 'REPRODUTOR', hint: 'Matriz e manejo reprodutivo' },
];

export function PondFormModal({ open, onClose }: Props) {
  const createPond = useCreatePond();
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'ENGORDA' as PondType,
    areaHa: '',
  });
  const [error, setError] = useState<string | null>(null);

  const normalizedCode = form.code.trim().toUpperCase();
  const suggestedName = form.name.trim() || (normalizedCode ? `Viveiro ${normalizedCode}` : 'Novo viveiro');
  const codeTypeWarning = normalizedCode ? pondCodeTypeMismatch(normalizedCode, form.type) : null;

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizedCode || !form.areaHa) {
      setError('Código e área são obrigatórios.');
      return;
    }

    const mismatch = pondCodeTypeMismatch(normalizedCode, form.type);
    if (mismatch) {
      setError(mismatch);
      return;
    }

    try {
      await createPond.mutateAsync({
        code: normalizedCode,
        name: suggestedName,
        type: form.type,
        areaHa: Number(form.areaHa),
      });
      setForm({ code: '', name: '', type: 'ENGORDA', areaHa: '' });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao criar viveiro.');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: 14,
    padding: '12px 14px',
    color: 'var(--text-primary)',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.42)' }} onClick={onClose} />
      <div
        style={{
          position: 'relative',
          width: 880,
          maxWidth: '100%',
          borderRadius: 28,
          overflow: 'hidden',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: '0 40px 120px rgba(15, 23, 42, 0.24)',
          background: 'linear-gradient(135deg, rgba(10,20,32,0.96), rgba(7,89,133,0.96))',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(320px, 0.95fr)' }}>
          <div style={{ padding: 30, color: '#f8fafc' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.68 }}>Cadastro de viveiro</div>

            <div
              style={{
                marginTop: 16,
                borderRadius: 24,
                padding: 20,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(14px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prévia do viveiro</div>
                  <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800 }}>{normalizedCode || '—'}</div>
                  <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>{suggestedName}</div>
                </div>
                <div style={{ padding: '7px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700 }}>
                  {POND_TYPE_LABELS[form.type]}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 18 }}>
                <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.08)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.68 }}>Área produtiva</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{form.areaHa ? `${formatAreaHa(form.areaHa)} ha` : '-'}</div>
                </div>
                <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.08)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.68 }}>Status inicial</div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>Vazio</div>
                </div>
              </div>

              {codeTypeWarning && (
                <div
                  style={{
                    marginTop: 14,
                    borderRadius: 14,
                    padding: '10px 12px',
                    background: 'rgba(248, 113, 113, 0.14)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    color: '#fecaca',
                    fontSize: 12,
                  }}
                >
                  {codeTypeWarning}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(245,250,255,0.96))', padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Novo viveiro</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 24, marginTop: 4 }}>Dados mínimos</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 24 }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Código *</div>
                <input style={inputStyle} value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))} placeholder="VE231" />
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Nome de exibição</div>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Opcional. Se vazio, usamos o código."
                />
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Área (ha) *</div>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.0001"
                  value={form.areaHa}
                  onChange={(e) => setForm((current) => ({ ...current, areaHa: e.target.value }))}
                  placeholder="1.20"
                />
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Tipo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  {TYPE_OPTIONS.map((option) => {
                    const active = form.type === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, type: option.value }))}
                        style={{
                          textAlign: 'left',
                          padding: '14px 14px',
                          borderRadius: 16,
                          border: `1px solid ${active ? 'rgba(2,132,199,0.24)' : 'rgba(148, 163, 184, 0.18)'}`,
                          background: active ? 'linear-gradient(135deg, rgba(2,132,199,0.12), rgba(255,255,255,0.94))' : '#fff',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{POND_TYPE_LABELS[option.value]}</div>
                        <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>{option.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#fff',
                    border: '1px solid rgba(148, 163, 184, 0.24)',
                    borderRadius: 14,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createPond.isPending}
                  style={{
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #0f172a, #0f5c81)',
                    border: 'none',
                    borderRadius: 14,
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    boxShadow: '0 18px 34px rgba(15, 23, 42, 0.16)',
                  }}
                >
                  {createPond.isPending ? 'Criando...' : 'Criar viveiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
