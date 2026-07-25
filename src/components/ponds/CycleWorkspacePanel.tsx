import { useId } from 'react';
import { AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import {
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceEyebrow,
  workspaceTile,
  workspaceTileDetail,
  workspaceTileLabel,
  workspaceTileValue,
} from '../ui/surfaces';

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
    <div style={{ minWidth: 0, display: 'grid', gap: space.section }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.section, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div style={workspaceEyebrow}>{eyebrow}</div>
          <h2 style={{ ...sectionTitle, marginTop: 6 }}>{title}</h2>
          <p style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 620 }}>{description}</p>
        </div>
        <div style={{ minWidth: 260, flex: '0 1 320px' }}>
          <Select
            id={id}
            label="Ciclo ativo"
            options={cycleOptions}
            value={selectedCycleId}
            onChange={(event) => onCycleChange(event.target.value)}
            placeholder="Selecione um ciclo"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: space.tile }}>
        {status && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 12,
              borderRadius: radius.tile,
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--accent-soft-strong)',
              color: 'var(--accent-dark)',
            }}
          >
            {status.tone === 'success' ? <CheckCircle2 size={16} style={{ marginTop: 1 }} /> : <AlertCircle size={16} style={{ marginTop: 1 }} />}
            <div style={{ minWidth: 0, fontSize: 13, lineHeight: 1.4 }}>{status.text}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: space.tile }}>
          {metrics.map((metric) => (
            <div key={metric.label} style={workspaceTile}>
              <div style={workspaceTileLabel}>{metric.label}</div>
              <div style={workspaceTileValue}>{metric.value}</div>
              {metric.detail && <div style={workspaceTileDetail}>{metric.detail}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.inline, justifyContent: 'flex-end' }}>
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.kind === 'primary' ? 'primary' : action.kind === 'secondary' ? 'secondary' : 'ghost'}
              loading={action.loading}
              disabled={action.disabled}
              icon={action.loading ? <RefreshCcw size={14} /> : undefined}
              onClick={action.onClick}
              style={action.kind === 'ghost' ? { border: '1px solid var(--border)' } : undefined}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
