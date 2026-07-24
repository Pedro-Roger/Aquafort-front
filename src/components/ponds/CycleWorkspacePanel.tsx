import { useId } from 'react';
import { AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

export type CycleWorkspaceMetric = {
  label: string;
  value: string;
  detail?: string;
};

export type CycleWorkspaceAction = {
  label: string;
  kind: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export type CycleWorkspaceStatus = {
  tone: 'info' | 'success' | 'warning';
  text: string;
};

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  cycleOptions: { value: string; label: string }[];
  selectedCycleId: string;
  onCycleChange: (value: string) => void;
  metrics: CycleWorkspaceMetric[];
  actions: CycleWorkspaceAction[];
  status?: CycleWorkspaceStatus | null;
}

export function CycleWorkspacePanel({
  eyebrow,
  title,
  description,
  cycleOptions,
  selectedCycleId,
  onCycleChange,
  metrics,
  actions,
  status,
}: Props) {
  const id = useId();

  return (
    <div style={{ minWidth: 0, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.72 }}>{eyebrow}</div>
          <h2 style={{ margin: '6px 0 0', fontSize: 20, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{title}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(238,243,255,0.72)', maxWidth: 620 }}>{description}</p>
        </div>
        <div style={{ minWidth: 260, flex: '0 1 320px' }}>
          <Select
            id={id}
            label="Ciclo ativo"
            labelStyle={{ color: 'rgba(238,243,255,0.82)' }}
            options={cycleOptions}
            value={selectedCycleId}
            onChange={(event) => onCycleChange(event.target.value)}
            placeholder="Selecione um ciclo"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {status && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 12,
              borderRadius: 16,
              backgroundColor:
                status.tone === 'success'
                  ? 'rgba(59,130,246,0.12)'
                  : status.tone === 'warning'
                    ? 'rgba(125,211,252,0.12)'
                    : 'rgba(14,165,233,0.12)',
              border:
                status.tone === 'success'
                  ? '1px solid rgba(59,130,246,0.28)'
                  : status.tone === 'warning'
                    ? '1px solid rgba(125,211,252,0.28)'
                    : '1px solid rgba(14,165,233,0.28)',
              color: '#eefbf8',
            }}
          >
            {status.tone === 'success' ? <CheckCircle2 size={16} style={{ marginTop: 1 }} /> : <AlertCircle size={16} style={{ marginTop: 1 }} />}
            <div style={{ minWidth: 0, fontSize: 13, lineHeight: 1.4 }}>{status.text}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {metrics.map((metric) => (
            <div key={metric.label} style={{ padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.72 }}>{metric.label}</div>
              <div style={{ marginTop: 6, fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>{metric.value}</div>
              {metric.detail && (
                <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(238,251,248,0.7)' }}>{metric.detail}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.kind === 'primary' ? 'primary' : action.kind === 'secondary' ? 'secondary' : 'ghost'}
              loading={action.loading}
              disabled={action.disabled}
              icon={action.loading ? <RefreshCcw size={14} /> : undefined}
              onClick={action.onClick}
              style={
                action.kind === 'ghost'
                  ? { color: 'rgba(238,251,248,0.92)', border: '1px solid rgba(255,255,255,0.22)' }
                  : undefined
              }
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
