import { useEffect, useState } from 'react';
import { GrowthChart } from './GrowthChart';
import { BiometricSection } from './BiometricSection';
import { PondPerformancePanel } from './PondPerformancePanel';
import { useUpdatePond } from '../../hooks/usePonds';
import { useUpdateGrowthTarget } from '../../hooks/useCycles';
import type { Aerator, PondType, PondWithCanvas } from '../../types';
import { POND_TYPE_LABELS, pondCodeTypeMismatch } from '../../lib/pondLabels';

const STATUS_LABELS: Record<string, string> = {
  VAZIO: 'Vazio', PREPARANDO: 'Preparando', POVOADO: 'Povoado', DESPESCANDO: 'Despescando', INATIVO: 'Inativo',
};

interface Props {
  pond: PondWithCanvas | null;
  onClose: () => void;
  onAeratorsChange: (pondId: string, aerators: Aerator[]) => void;
}

export function PondDrawer({ pond, onClose, onAeratorsChange }: Props) {
  const updatePond = useUpdatePond();
  const updateGrowth = useUpdateGrowthTarget();
  const [editedPond, setEditedPond] = useState<Partial<PondWithCanvas>>({});
  const [growthTarget, setGrowthTarget] = useState({ initialWeightG: '', targetWeightG: '', weeklyGrowthGTarget: '' });
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!pond) return;
    setEditedPond({});
    setIsDirty(false);
    setSaveError(null);
    const cycle = pond.cycles?.[0];
    setGrowthTarget({
      initialWeightG: cycle?.initialWeightG?.toString() ?? '',
      targetWeightG: cycle?.targetWeightG?.toString() ?? '',
      weeklyGrowthGTarget: cycle?.weeklyGrowthGTarget?.toString() ?? '',
    });
  }, [pond?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!pond) return null;

  const activeCycle = pond.cycles?.[0] ?? null;
  const aerators = pond.canvasLayout?.aerators ?? [];

  const savePond = async () => {
    if (!isDirty) return;

    const code = editedPond.code ?? pond.code;
    const type = ((editedPond as Partial<PondWithCanvas>).type ?? pond.type) as PondType;
    const mismatch = pondCodeTypeMismatch(code, type);
    if (mismatch) {
      setSaveError(mismatch);
      return;
    }

    setSaveError(null);
    await updatePond.mutateAsync({ id: pond.id, data: editedPond });
    setIsDirty(false);
  };

  const saveGrowthTarget = async () => {
    if (!activeCycle) return;
    await updateGrowth.mutateAsync({
      cycleId: activeCycle.id,
      target: {
        initialWeightG: growthTarget.initialWeightG ? Number(growthTarget.initialWeightG) : undefined,
        targetWeightG: growthTarget.targetWeightG ? Number(growthTarget.targetWeightG) : undefined,
        weeklyGrowthGTarget: growthTarget.weeklyGrowthGTarget ? Number(growthTarget.weeklyGrowthGTarget) : undefined,
      },
    });
  };

  const addAerator = () => {
    const newId = Date.now();
    onAeratorsChange(pond.id, [...aerators, { id: newId, xPct: 0.5, yPct: 0.5 }]);
  };

  const removeAerator = (id: number) => {
    onAeratorsChange(pond.id, aerators.filter(a => a.id !== id));
  };

  const iw = Number(growthTarget.initialWeightG) || 0;
  const tw = Number(growthTarget.targetWeightG) || 0;
  const rate = Number(growthTarget.weeklyGrowthGTarget) || 0;
  const weeks = iw && tw && rate ? ((tw - iw) / rate).toFixed(1) : null;

  const inputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  };

  const labelEl = (text: string) => (
    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</div>
  );

  const fieldEl = (label: string, value: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      {labelEl(label)}
      {value}
    </div>
  );

  const sectionEl = (title: string, children: React.ReactNode) => (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
        zIndex: 101, overflowY: 'auto', padding: 20, boxShadow: '-12px 0 30px rgba(15, 23, 42, 0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{pond.code}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{pond.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {fieldEl('Código',
          <input style={inputStyle} value={editedPond.code ?? pond.code}
            onChange={e => { setEditedPond(p => ({ ...p, code: e.target.value })); setIsDirty(true); }} />
        )}
        {fieldEl('Nome',
          <input style={inputStyle} value={editedPond.name ?? pond.name}
            onChange={e => { setEditedPond(p => ({ ...p, name: e.target.value })); setIsDirty(true); }} />
        )}
        {fieldEl('Tipo',
          <select style={{ ...inputStyle }} value={(editedPond as any).type ?? pond.type}
            onChange={e => { setEditedPond(p => ({ ...p, type: e.target.value as any })); setIsDirty(true); }}>
            {Object.entries(POND_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
        {saveError && (
          <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: -6, marginBottom: 12 }}>{saveError}</div>
        )}
        {fieldEl('Status',
          <select style={{ ...inputStyle }} value={(editedPond as any).status ?? pond.status}
            onChange={e => { setEditedPond(p => ({ ...p, status: e.target.value as any })); setIsDirty(true); }}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
        {fieldEl('Área (ha)',
          <input style={inputStyle} type="number" value={(editedPond as any).areaHa?.toString() ?? pond.areaHa.toString()}
            onChange={e => { setEditedPond(p => ({ ...p, areaHa: Number(e.target.value) })); setIsDirty(true); }} />
        )}
        {isDirty && (
          <button onClick={savePond}
            style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 13, marginBottom: 8 }}>
            Salvar alterações
          </button>
        )}

        {sectionEl('Lote de larva', activeCycle ? (
          <div>
            {fieldEl('Fornecedor', <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{activeCycle.larvaeSupplier ?? '—'}</div>)}
            {fieldEl('Código do lote', <div style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace' }}>{activeCycle.larvaeLotCode ?? '—'}</div>)}
            {fieldEl('Estágio PL', <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{activeCycle.larvaeStage ?? '—'}</div>)}
            {fieldEl('Quantidade', <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{activeCycle.plCount.toLocaleString('pt-BR')} PLs <span style={{ color: 'var(--text-muted)' }}>({Number(activeCycle.density).toFixed(1)} PL/m²)</span></div>)}
            {fieldEl('Povoamento', <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{new Date(activeCycle.stockDate).toLocaleDateString('pt-BR')}</div>)}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem ciclo ativo.</div>
        ))}

        {sectionEl('Aeradores',
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{aerators.length} aerador{aerators.length !== 1 ? 'es' : ''}</span>
              <button onClick={addAerator} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                + Adicionar
              </button>
            </div>
            {aerators.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 4, border: '1px solid var(--border)' }}>
                <span style={{ color: '#0ea5e9', fontSize: 13 }}>⊕ Aerador {i + 1}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({Math.round(a.xPct * 100)}%, {Math.round(a.yPct * 100)}%)</span>
                <button onClick={() => removeAerator(a.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}>−</button>
              </div>
            ))}
          </div>
        )}

        {sectionEl('Meta de crescimento', activeCycle ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>PESO INICIAL (g)</div>
                <input type="number" value={growthTarget.initialWeightG}
                  onChange={e => setGrowthTarget(g => ({ ...g, initialWeightG: e.target.value }))}
                  placeholder="0.1"
                  style={{ ...inputStyle, fontSize: 12, padding: '6px 8px' }} />
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>PESO ALVO (g)</div>
                <input type="number" value={growthTarget.targetWeightG}
                  onChange={e => setGrowthTarget(g => ({ ...g, targetWeightG: e.target.value }))}
                  placeholder="12"
                  style={{ ...inputStyle, fontSize: 12, padding: '6px 8px' }} />
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>g/SEMANA</div>
                <input type="number" value={growthTarget.weeklyGrowthGTarget}
                  onChange={e => setGrowthTarget(g => ({ ...g, weeklyGrowthGTarget: e.target.value }))}
                  placeholder="2"
                  style={{ ...inputStyle, fontSize: 12, padding: '6px 8px' }} />
              </div>
            </div>
            {weeks && (
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12, border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tempo estimado: </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{weeks} semanas (~{Math.round(Number(weeks) * 7)} dias)</span>
              </div>
            )}
            <button onClick={saveGrowthTarget}
              style={{ width: '100%', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 0', cursor: 'pointer', fontSize: 13 }}>
              Salvar meta
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Abra um ciclo para definir a meta.</div>
        ))}

        {activeCycle && sectionEl('Biometrias',
          <BiometricSection cycleId={activeCycle.id} />
        )}

        {activeCycle && sectionEl('Acompanhamento',
          <PondPerformancePanel cycleId={activeCycle.id} stockDate={activeCycle.stockDate} />
        )}

        {activeCycle && sectionEl('Crescimento: expectativa vs realidade',
          <GrowthChart cycleId={activeCycle.id} targetWeightG={activeCycle.targetWeightG} />
        )}
      </div>
    </>
  );
}
