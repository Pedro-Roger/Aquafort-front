import { useMemo, useState, type ReactNode } from 'react';
import { Save, RotateCcw, Gauge, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useFarmBiometricsReference } from '../hooks/useFarmBiometricsReference';
import { DEFAULT_REFERENCE_WEIGHTS, type ConsumptionReferenceRow } from '../lib/biometricsReference';
import {
  pageStack,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';

function fmt(value: number, digits = 1) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtWeight(weightG: number) {
  return fmt(weightG, Number.isInteger(weightG) ? 0 : 1);
}

export function SettingsPage() {
  const { isAdmin } = useAuth();
  const { reference, saveReference, resetReference } = useFarmBiometricsReference();
  const [draft, setDraft] = useState<ConsumptionReferenceRow[]>(reference);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canEdit = isAdmin;
  const changed = useMemo(() => JSON.stringify(draft) !== JSON.stringify(reference), [draft, reference]);

  const minWeight = draft.length ? Math.min(...draft.map((row) => row.weightG)) : 0;
  const maxWeight = draft.length ? Math.max(...draft.map((row) => row.weightG)) : 0;
  const nextWeight = Math.floor(maxWeight) + 1;

  function updateRow(weightG: number, value: string) {
    setDraft((current) =>
      current.map((row) => (row.weightG === weightG ? { ...row, consumptionPct: Number(value || 0) } : row)),
    );
    setFeedback(null);
  }

  function addRow() {
    setDraft((current) => {
      // The next weight comes from the updater's own state — two fast clicks
      // must yield 23 g then 24 g, never 23 g twice.
      const last = [...current].sort((a, b) => a.weightG - b.weightG).at(-1);
      const weightG = Math.floor(last?.weightG ?? 0) + 1;
      if (current.some((row) => row.weightG === weightG)) return current;
      return [...current, { weightG, consumptionPct: last?.consumptionPct ?? 2 }];
    });
    setFeedback(null);
  }

  function removeRow(weightG: number) {
    setDraft((current) => current.filter((row) => row.weightG !== weightG));
    setFeedback(null);
  }

  function handleReset() {
    const normalized = resetReference();
    setDraft(normalized);
    setFeedback('Tabela restaurada para o padrão da fazenda.');
  }

  function handleSave() {
    const normalized = saveReference(draft);
    setDraft(normalized);
    setFeedback('Tabela de consumo salva.');
  }

  return (
    <div style={{ ...pageStack, minHeight: '100%' }}>
      <section style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={workspaceEyebrow}>Configurações da fazenda</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)' }}>
              Tabela de consumo por peso da biometria.
            </h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile, marginTop: space.section }}>
          <MiniStat icon={<Gauge size={16} />} label="Faixa cadastrada" value={`${fmtWeight(minWeight)}g até ${fmtWeight(maxWeight)}g`} />
          <MiniStat icon={<Save size={16} />} label="Estado" value={changed ? 'Há alterações' : 'Sincronizado'} />
        </div>
      </section>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <div style={workspaceTileLabel}>Tabela operacional</div>
            <h2 style={{ ...sectionTitle, marginTop: 6 }}>Percentual de consumo por peso médio</h2>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {draft.length}
            {' '}
            linhas
          </div>
        </div>

        <div style={{ display: 'grid', gap: space.inline }}>
          <div style={{ ...workspaceTileLabel, display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) minmax(180px, 220px) 40px', gap: space.inline, padding: '0 12px' }}>
            <div>Peso</div>
            <div />
            <div style={{ textAlign: 'right' }}>Consumo (%)</div>
            <div />
          </div>

          {draft.map((row) => {
            const isCustom = !DEFAULT_REFERENCE_WEIGHTS.has(row.weightG);
            return (
              <div
                key={row.weightG}
                style={{
                  ...workspaceTile,
                  display: 'grid',
                  gridTemplateColumns: '120px minmax(0, 1fr) minmax(180px, 220px) 40px',
                  gap: space.inline,
                  alignItems: 'center',
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtWeight(row.weightG)} g</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{isCustom ? 'Adicionado pela fazenda' : ''}</div>
                <Input
                  label=""
                  type="number"
                  min={0}
                  step="0.1"
                  value={row.consumptionPct}
                  onChange={(e) => updateRow(row.weightG, e.target.value)}
                  disabled={!canEdit}
                />
                {isCustom && canEdit ? (
                  <button
                    type="button"
                    onClick={() => removeRow(row.weightG)}
                    title={`Remover ${fmtWeight(row.weightG)} g`}
                    style={{
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      borderRadius: 10,
                      width: 32,
                      height: 32,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            );
          })}
        </div>

        {canEdit ? (
          <div>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={addRow}>
              {`Adicionar ${fmtWeight(nextWeight)} g`}
            </Button>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.tile, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ color: feedback ? 'var(--accent-dark)' : 'var(--text-muted)', fontSize: 13 }}>{feedback ?? 'Os valores entram no cálculo da biometria assim que forem salvos.'}</div>
          <div style={{ display: 'flex', gap: space.inline }}>
            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleReset} disabled={!canEdit}>
              Restaurar padrão
            </Button>
            <Button icon={<Save size={16} />} onClick={handleSave} disabled={!canEdit || !changed}>
              Salvar tabela
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ ...workspaceTile, padding: '14px 16px' }}>
      <div style={{ ...workspaceTileLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        {label}
      </div>
      <div style={workspaceTileValue}>{value}</div>
    </div>
  );
}
