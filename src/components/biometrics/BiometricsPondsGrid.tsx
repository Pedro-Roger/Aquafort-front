import { BarChart3, Plus } from 'lucide-react';
import type { Pond } from '../../types';

interface BiometricsPondsGridProps {
  ponds: Pond[];
  loading?: boolean;
  onPondClick: (pond: Pond) => void;
  latestBiometricsByPond?: Record<string, { measuredAt: string; pesoMedioG: number }>;
}

export function BiometricsPondsGrid({
  ponds,
  loading = false,
  onPondClick,
  latestBiometricsByPond = {},
}: BiometricsPondsGridProps) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 16,
              padding: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              height: 140,
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    );
  }

  if (!ponds.length) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          borderRadius: 16,
          border: '2px dashed var(--border)',
        }}
      >
        <BarChart3 size={32} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
        <p>Nenhum viveiro ativo. Inicie um ciclo para ver os dados.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      }}
    >
      {ponds.map((pond) => {
        const latest = latestBiometricsByPond?.[pond.id];
        const hasData = !!latest;

        return (
          <button
            key={pond.id}
            onClick={() => onPondClick(pond)}
            style={{
              borderRadius: 16,
              padding: 16,
              background: 'var(--bg-card)',
              border: '2px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minHeight: 140,
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--primary)';
              el.style.background = 'linear-gradient(135deg, var(--bg-card), rgba(14, 165, 233, 0.05))';
              el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--border)';
              el.style.background = 'var(--bg-card)';
              el.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Viveiro
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                  {pond.code || pond.name || '—'}
                </div>
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: hasData ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: hasData ? '#22c55e' : 'var(--text-muted)',
                }}
              >
                {hasData ? <BarChart3 size={16} /> : <Plus size={16} />}
              </div>
            </div>

            {hasData ? (
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Última leitura:{' '}
                  {new Date(latest.measuredAt).toLocaleDateString('pt-BR')}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Peso: {(latest.pesoMedioG ?? 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  g
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nenhuma leitura registrada. Clique para iniciar.
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
