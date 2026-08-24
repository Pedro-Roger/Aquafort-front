import { BarChart3, Plus } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { radius, workspaceTileLabel, workspaceTileValue } from '../ui/surfaces';
import { formatDateOnly } from '../../lib/format';
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
              borderRadius: radius.tile,
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
      <EmptyState
        icon={<BarChart3 size={22} />}
        title="Nenhum viveiro ativo. Inicie um ciclo para ver os dados."
        style={{ border: '1px dashed var(--border)' }}
      />
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
              borderRadius: radius.tile,
              padding: 16,
              // `--primary` never existed, so the old hover border was a no-op.
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background-color 0.15s, transform 0.15s',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minHeight: 140,
              position: 'relative',
              overflow: 'hidden',
              font: 'inherit',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'var(--accent)';
              el.style.background = 'var(--bg-card-hover)';
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
                <div style={workspaceTileLabel}>
                  Viveiro
                </div>
                <div style={{ ...workspaceTileValue, fontSize: 18, marginTop: 4 }}>
                  {pond.code || pond.name || '—'}
                </div>
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.control,
                  background: hasData ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: hasData ? 'var(--accent-dark)' : 'var(--text-muted)',
                }}
              >
                {hasData ? <BarChart3 size={16} /> : <Plus size={16} />}
              </div>
            </div>

            {hasData ? (
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Última leitura:{' '}
                  {formatDateOnly(latest.measuredAt)}
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
