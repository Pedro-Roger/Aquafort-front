import { useState } from 'react';
import { useBiometrics, useCreateBiometric, useDeleteBiometric } from '../../hooks/useBiometrics';

interface Props {
  cycleId: string;
}

export function BiometricSection({ cycleId }: Props) {
  const { data: biometrics = [], isLoading } = useBiometrics(cycleId);
  const createBio = useCreateBiometric();
  const deleteBio = useDeleteBiometric();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ measuredAt: '', sampleCount: '', averageWeightG: '', survivalRatePct: '' });

  const handleSubmit = async () => {
    if (!form.measuredAt || !form.sampleCount || !form.averageWeightG) return;
    await createBio.mutateAsync({
      cycleId,
      measuredAt: form.measuredAt,
      sampleCount: Number(form.sampleCount),
      averageWeightG: Number(form.averageWeightG),
      survivalRatePct: form.survivalRatePct ? Number(form.survivalRatePct) : undefined,
    });
    setForm({ measuredAt: '', sampleCount: '', averageWeightG: '', survivalRatePct: '' });
    setShowForm(false);
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 8px', color: 'var(--text-primary)', fontSize: 12,
    outline: 'none', minWidth: 0,
  };

  if (isLoading) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando biometrias...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{biometrics.length} registro{biometrics.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}
        >
          {showForm ? 'Cancelar' : '+ Registrar'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>DATA</div>
              <input type="date" style={inputStyle} value={form.measuredAt} onChange={e => setForm(f => ({ ...f, measuredAt: e.target.value }))} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>AMOSTRAS</div>
              <input type="number" style={inputStyle} value={form.sampleCount} onChange={e => setForm(f => ({ ...f, sampleCount: e.target.value }))} placeholder="30" />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>PESO MÉDIO (g)</div>
              <input type="number" step="0.01" style={inputStyle} value={form.averageWeightG} onChange={e => setForm(f => ({ ...f, averageWeightG: e.target.value }))} placeholder="5.5" />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>SOBREV. (%)</div>
              <input type="number" style={inputStyle} value={form.survivalRatePct} onChange={e => setForm(f => ({ ...f, survivalRatePct: e.target.value }))} placeholder="85" />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={createBio.isPending}
            style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 0', cursor: 'pointer', fontSize: 13 }}
          >
            {createBio.isPending ? 'Salvando...' : 'Salvar biometria'}
          </button>
        </div>
      )}

      {biometrics.map(b => (
        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'var(--bg-card)', borderRadius: 6, marginBottom: 4, fontSize: 12, border: '1px solid var(--border)' }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{Number(b.averageWeightG).toFixed(2)}g</div>
            <div style={{ color: 'var(--text-muted)' }}>{new Date(b.measuredAt).toLocaleDateString('pt-BR')} · {b.sampleCount} amostras</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {b.survivalRatePct && <span style={{ color: '#0ea5e9' }}>{Number(b.survivalRatePct).toFixed(1)}% sobrev.</span>}
            <button
              onClick={() => deleteBio.mutate({ id: b.id, cycleId })}
              style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontSize: 16 }}
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {biometrics.length === 0 && !showForm && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
          Nenhuma biometria registrada.
        </div>
      )}
    </div>
  );
}
