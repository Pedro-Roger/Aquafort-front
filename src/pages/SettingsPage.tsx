import { useMemo, useState, type ReactNode } from 'react';
import { Save, RotateCcw, Gauge, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useFarmBiometricsReference } from '../hooks/useFarmBiometricsReference';
import { BIOMETRIA_CONSUMPTION_REFERENCE } from './biometrias';
import type { ConsumptionReferenceRow } from '../lib/biometricsReference';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: '100%' }}>
      <section
        style={{
          borderRadius: 28,
          padding: 24,
          color: '#f8fafc',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,132,199,0.94))',
          boxShadow: '0 28px 80px rgba(15, 23, 42, 0.14)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>Configurações da fazenda</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.05em' }}>Tabela de consumo por peso da biometria.</h1>
            <p style={{ marginTop: 10, color: 'rgba(248,250,252,0.78)', maxWidth: 820 }}>
              O gerente cadastra a referência de consumo da fazenda. Essa tabela alimenta a estimativa de biomassa atual e a sobrevivência calculada na biometria.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 260 }}>
              <div style={{ color: 'rgba(248,250,252,0.72)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Responsável</div>
              <div style={{ padding: '11px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontWeight: 800 }}>{user?.name ?? 'Sem usuário'}</div>
                <div style={{ color: 'rgba(248,250,252,0.72)', fontSize: 12 }}>{canEdit ? 'Gerente com permissão de edição' : 'Somente leitura'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
          <MiniStat icon={<Gauge size={16} />} label="Faixa cadastrada" value="1g até 18g" />
          <MiniStat icon={<Shield size={16} />} label="Edição" value={canEdit ? 'Liberada ao gerente' : 'Bloqueada'} />
          <MiniStat icon={<Save size={16} />} label="Estado" value={changed ? 'Há alterações' : 'Sincronizado'} />
        </div>
      </section>

      <section
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: 18,
          boxShadow: '0 14px 32px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tabela operacional</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 22, color: 'var(--text-primary)' }}>Percentual de consumo por peso médio</h2>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Regra padrão da fazenda disponível como referência:
            {' '}
            {BIOMETRIA_CONSUMPTION_REFERENCE.length}
            {' '}
            linhas
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) minmax(180px, 220px)', gap: 10, padding: '0 4px', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <div>Peso</div>
            <div>Descrição</div>
            <div style={{ textAlign: 'right' }}>Consumo (%)</div>
          </div>

          {draft.map((row) => (
            <div
              key={row.weightG}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px minmax(0, 1fr) minmax(180px, 220px)',
                gap: 10,
                alignItems: 'center',
                padding: 12,
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(237,245,251,0.92))',
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(row.weightG, 0)} g</div>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ color: feedback ? 'var(--accent-dark)' : 'var(--text-muted)', fontSize: 13 }}>{feedback ?? 'Os valores entram no cálculo da biometria assim que forem salvos.'}</div>
          <div style={{ display: 'flex', gap: 10 }}>
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
    <div style={{ borderRadius: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(248,250,252,0.78)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {icon}
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
