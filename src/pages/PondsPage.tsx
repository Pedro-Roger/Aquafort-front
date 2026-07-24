import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PondListView } from '../components/ponds/PondListView';
import { PondFormModal } from '../components/ponds/PondFormModal';
import { PondDrawer } from '../components/ponds/PondDrawer';
import { FarmCanvas } from '../components/canvas/FarmCanvas';
import type { Aerator, PondWithCanvas } from '../types';
import { useUpdateCanvasLayout } from '../hooks/usePonds';

export function PondsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') ?? localStorage.getItem('ponds_view') ?? 'list';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPond, setSelectedPond] = useState<PondWithCanvas | null>(null);
  const updateLayout = useUpdateCanvasLayout();

  const setView = useCallback((v: string) => {
    localStorage.setItem('ponds_view', v);
    setSearchParams({ view: v });
  }, [setSearchParams]);

  const handleAeratorsChange = useCallback((pondId: string, aerators: Aerator[]) => {
    updateLayout.mutate({ pondId, layout: { aerators } as any });
    if (selectedPond?.id === pondId) {
      setSelectedPond(prev => prev ? {
        ...prev,
        canvasLayout: prev.canvasLayout ? { ...prev.canvasLayout, aerators } : null,
      } : null);
    }
  }, [selectedPond, updateLayout]);

  const viewBtn = (v: string, label: string) => (
    <button
      key={v}
      onClick={() => setView(v)}
      style={{
        padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
        backgroundColor: view === v ? 'var(--accent)' : 'transparent',
        border: '1px solid transparent',
        color: view === v ? '#fff' : 'var(--text-secondary)', fontSize: 14,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, margin: 0 }}>Viveiros</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            {viewBtn('list', '≡ Lista')}
            {viewBtn('canvas', '⊡ Canvas')}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '8px 16px', backgroundColor: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 14, boxShadow: '0 8px 18px rgba(14, 165, 233, 0.18)' }}
          >
            + Novo viveiro
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {view === 'list' && (
          <div style={{ height: '100%', minHeight: 0, overflowY: 'auto' }}>
            <PondListView onOpenCanvas={() => setView('canvas')} />
          </div>
        )}
        {view === 'canvas' && (
          <div style={{ height: '100%', minHeight: 560 }}>
            <FarmCanvas onPondSelect={setSelectedPond} selectedPondId={selectedPond?.id ?? null} />
          </div>
        )}
      </div>

      <PondDrawer pond={selectedPond} onClose={() => setSelectedPond(null)} onAeratorsChange={handleAeratorsChange} />
      <PondFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
