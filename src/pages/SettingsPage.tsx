import { useMemo, useState, type ReactNode } from 'react';
import { Save, RotateCcw, Gauge, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useFarmBiometricsReference } from '../hooks/useFarmBiometricsReference';
import { BIOMETRIA_CONSUMPTION_REFERENCE } from './biometrias';
import type { ConsumptionReferenceRow } from '../lib/biometricsReference';
import {
  pageStack,
  sectionSubtitle,
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

export function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { reference, saveReference, resetReference } = useFarmBiometricsReference();
  const [draft, setDraft] = useState<ConsumptionReferenceRow[]>(reference);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canEdit = isAdmin;
  const changed = useMemo(() => JSON.stringify(draft) !== JSON.stringify(reference), [draft, reference]);

  function updateRow(weightG: number, value: string) {
    setDraft((current) =>
      current.map((row) => (row.weightG === weightG ? { ...row, consumptionPct: Number(value || 0) } : row)),
    );
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
    setFeedback('Tabela de consumo salva para o gerente.');
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
            <p style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 820 }}>
              O gerente cadastra a referência de consumo da fazenda. Essa tabela alimenta a estimativa de biomassa atual e a sobrevivência calculada na biometria.
            </p>
          </div>
          <div style={{ display: 'flex', gap: space.inline, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 260 }}>
              <div style={{ ...workspaceTileLabel, marginBottom: 6 }}>Responsável</div>
              <div style={{ ...workspaceTile, padding: '11px 14px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name ?? 'Sem usuário'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{canEdit ? 'Gerente com permissão de edição' : 'Somente leitura'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile, marginTop: space.section }}>
          <MiniStat icon={<Gauge size={16} />} label="Faixa cadastrada" value="1g até 18g" />
          <MiniStat icon={<Shield size={16} />} label="Edição" value={canEdit ? 'Liberada ao gerente' : 'Bloqueada'} />
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
            Regra padrão da fazenda disponível como referência:
            {' '}
            {BIOMETRIA_CONSUMPTION_REFERENCE.length}
            {' '}
            linhas
          </div>
        </div>

        <div style={{ display: 'grid', gap: space.inline }}>
          <div style={{ ...workspaceTileLabel, display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) minmax(180px, 220px)', gap: space.inline, padding: '0 12px' }}>
            <div>Peso</div>
            <div>Descrição</div>
            <div style={{ textAlign: 'right' }}>Consumo (%)</div>
          </div>

          {draft.map((row) => (
            <div
              key={row.weightG}
              style={{
                ...workspaceTile,
                display: 'grid',
                gridTemplateColumns: '120px minmax(0, 1fr) minmax(180px, 220px)',
                gap: space.inline,
                alignItems: 'center',
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.weightG, 0)} g</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Peso médio de referência para consumo diário.</div>
              <Input
                label=""
                type="number"
                min={0}
                step="0.1"
                value={row.consumptionPct}
                onChange={(e) => updateRow(row.weightG, e.target.value)}
                disabled={!canEdit}
              />
            </div>
          ))}
        </div>

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
