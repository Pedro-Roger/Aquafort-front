import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import {
  metricGrid,
  pageStack,
  radius,
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
import { EmptyState } from '../components/ui/EmptyState';
import { useAssignPonds, useCreateFeeder, useFeederRanking, useFeeders } from '../hooks/useFeeders';
import { usePonds } from '../hooks/usePonds';
import type { Feeder, FeederRanking } from '../types';

function fmt(value: number | null | undefined, digits = 1) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function FeedersPage() {
  const { data: feeders = [], isLoading } = useFeeders();
  const { data: ranking = [] } = useFeederRanking();
  const { data: ponds = [] } = usePonds();
  const createFeeder = useCreateFeeder();
  const assignPonds = useAssignPonds();

  const [createOpen, setCreateOpen] = useState(false);
  const [assigning, setAssigning] = useState<Feeder | null>(null);
  const [selectedPondIds, setSelectedPondIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  /** Ponds the user explicitly unlocked to take from another feeder. */
  const [releasing, setReleasing] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', document: '', phone: '' });
  const [error, setError] = useState<string | null>(null);

  const assignedElsewhere = new Map<string, string>();
  feeders.forEach((feeder) => {
    feeder.ponds.forEach((pond) => assignedElsewhere.set(pond.id, feeder.name));
  });

  async function handleCreate() {
    setError(null);
    if (form.name.trim().length < 2) {
      setError('Informe o nome do arraçoador.');
      return;
    }
    try {
      await createFeeder.mutateAsync({
        name: form.name.trim(),
        document: form.document.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      return;
    }
    setForm({ name: '', document: '', phone: '' });
    setCreateOpen(false);
  }

  function openAssign(feeder: Feeder) {
    setAssigning(feeder);
    setSelectedPondIds(feeder.ponds.map((pond) => pond.id));
    setReleasing([]);
    setError(null);
  }

  async function handleAssign() {
    if (!assigning) return;
    setError(null);
    try {
      await assignPonds.mutateAsync({ feederId: assigning.id, pondIds: selectedPondIds });
    } catch {
      setError('Não foi possível salvar a atribuição. Tente novamente.');
      return;
    }
    setAssigning(null);
  }

  const rankingColumns = [
    {
      key: 'position',
      header: '#',
      render: (row: FeederRanking) => (
        <span style={{ fontWeight: 800, color: row.position === 1 ? 'var(--accent-dark)' : 'var(--text-muted)' }}>
          {row.position}
        </span>
      ),
    },
    {
      key: 'feederName',
      header: 'Arraçoador',
      render: (row: FeederRanking) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.feederName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {row.pondCodes.length ? row.pondCodes.join(', ') : 'Sem viveiro atribuído'}
          </div>
        </div>
      ),
    },
    {
      key: 'weeklyGrowthG',
      header: 'Crescimento',
      align: 'right' as const,
      render: (row: FeederRanking) => (row.weeklyGrowthG == null ? '—' : `${fmt(row.weeklyGrowthG, 2)} g/sem`),
    },
    {
      key: 'averageWeightG',
      header: 'Peso atual',
      align: 'right' as const,
      // The heaviest pond, not an average — clicking opens the pond by pond view.
      render: (row: FeederRanking) => {
        if (row.averageWeightG == null) return '—';
        const open = expanded === row.feederId;
        return (
          <button
            type="button"
            onClick={() => setExpanded(open ? null : row.feederId)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--accent-dark)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
            title={`Ver os ${row.pondCount} viveiros de ${row.feederName}`}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {fmt(row.averageWeightG, 2)} g
            {row.heaviestPondCode && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>
                {row.heaviestPondCode}
              </span>
            )}
          </button>
        );
      },
    },
    {
      key: 'survivalPct',
      header: 'Sobrevivência',
      align: 'right' as const,
      render: (row: FeederRanking) => (row.survivalPct == null ? '—' : `${fmt(row.survivalPct, 1)} %`),
    },
    {
      key: 'biomassKg',
      header: 'Biomassa',
      align: 'right' as const,
      render: (row: FeederRanking) => `${fmt(row.biomassKg, 1)} kg`,
    },
  ];

  const expandedRow = ranking.find((row) => row.feederId === expanded) ?? null;
  const leader = ranking.find((row) => row.weeklyGrowthG != null) ?? null;
  const assignedPondCount = feeders.reduce((total, feeder) => total + feeder.ponds.length, 0);

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Arraçoadores</div>
            <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 620 }}>
              Quem trata cada viveiro, e como o camarão cresce sob cada um.
            </div>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Cadastrar arraçoador
          </Button>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Arraçoadores</div>
            <div style={workspaceTileValue}>{isLoading ? '—' : feeders.length}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Viveiros atribuídos</div>
            <div style={workspaceTileValue}>{assignedPondCount}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Viveiros sem responsável</div>
            <div style={workspaceTileValue}>{Math.max(0, ponds.length - assignedPondCount)}</div>
          </div>
          <div style={{ ...workspaceTile, backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-soft-strong)' }}>
            <div style={{ ...workspaceTileLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={12} /> Melhor crescimento
            </div>
            <div style={{ ...workspaceTileValue, color: 'var(--accent-dark)' }}>{leader?.feederName ?? '—'}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              {leader ? `${fmt(leader.weeklyGrowthG, 2)} g por semana` : 'Sem biometria suficiente'}
            </div>
          </div>
        </div>
      </div>

      <section style={workspaceCard}>
        <div>
          <h2 style={sectionTitle}>Ranking de crescimento</h2>
          <p style={{ ...sectionSubtitle, marginTop: 4 }}>
            Ganho de peso por semana, medido entre a primeira e a última biometria do ciclo ativo de cada viveiro.
          </p>
        </div>
        <Table
          columns={rankingColumns}
          data={ranking}
          rowKey={(row) => row.feederId}
          emptyMessage="Cadastre um arraçoador e atribua viveiros para ver o ranking"
        />

        {expandedRow && (
          <div style={{ ...workspaceTile, marginTop: space.tile }}>
            <div style={workspaceTileLabel}>Viveiros de {expandedRow.feederName}</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {expandedRow.ponds.map((pond) => (
                <div
                  key={pond.pondId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pond.pondCode}</span>
                  <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 13 }}>
                    <span><strong style={{ color: 'var(--text-primary)' }}>{fmt(pond.averageWeightG, 2)} g</strong> peso atual</span>
                    <span>{pond.survivalPct == null ? '—' : `${fmt(pond.survivalPct, 1)} %`} sobrev.</span>
                    <span>{fmt(pond.biomassKg, 1)} kg</span>
                  </span>
                </div>
              ))}
              {!expandedRow.ponds.length && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Nenhum viveiro com biometria registrada.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section style={workspaceCard}>
        <h2 style={sectionTitle}>Cadastro e viveiros</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: space.tile }}>
          {feeders.map((feeder) => (
            <div key={feeder.id} style={{ ...workspaceTile, padding: 14 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{feeder.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {feeder.ponds.length ? feeder.ponds.map((pond) => pond.code).join(', ') : 'Nenhum viveiro atribuído'}
              </div>
              <Button variant="secondary" size="sm" style={{ marginTop: space.tile }} onClick={() => openAssign(feeder)}>
                Atribuir viveiros
              </Button>
            </div>
          ))}
          {!feeders.length && !isLoading && (
            <EmptyState
              compact
              title="Nenhum arraçoador cadastrado ainda."
              description="Cadastre um arraçoador para atribuir viveiros a ele."
            />
          )}
        </div>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo arraçoador" width={460}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Input label="Nome" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Nome completo" />
          <Input label="Documento (opcional)" value={form.document} onChange={(e) => setForm((c) => ({ ...c, document: e.target.value }))} />
          <Input label="Telefone (opcional)" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
          {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button loading={createFeeder.isPending} onClick={handleCreate}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!assigning}
        onClose={() => setAssigning(null)}
        title={`Viveiros de ${assigning?.name ?? ''}`}
        width={520}
      >
        <div style={{ display: 'grid', gap: space.tile }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Marque os viveiros sob responsabilidade dessa pessoa. Desmarcar libera o viveiro.
          </div>
          <div style={{ display: 'grid', gap: space.inline, maxHeight: 320, overflowY: 'auto' }}>
            {ponds.map((pond) => {
              const checked = selectedPondIds.includes(pond.id);
              const owner = assignedElsewhere.get(pond.id);
              const takenByOther = owner && owner !== assigning?.name;
              return (
                <label
                  key={pond.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: radius.tile,
                    border: `1px solid ${checked ? 'var(--accent-soft-strong)' : 'var(--border)'}`,
                    backgroundColor: checked ? 'var(--accent-soft)' : 'var(--bg-card)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!!takenByOther && !releasing.includes(pond.id)}
                    onChange={(e) =>
                      setSelectedPondIds((current) =>
                        e.target.checked ? [...current, pond.id] : current.filter((id) => id !== pond.id),
                      )
                    }
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pond.code}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> · {pond.name}</span>
                  </span>
                  {takenByOther && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>com {owner}</span>
                      {!releasing.includes(pond.id) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(event) => {
                            event.preventDefault();
                            setReleasing((current) => [...current, pond.id]);
                          }}
                        >
                          Trocar
                        </Button>
                      )}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setAssigning(null)}>Cancelar</Button>
            <Button loading={assignPonds.isPending} onClick={handleAssign}>Salvar atribuição</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
