import { useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import {
  workspaceEyebrow,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
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
  }

  async function handleAssign() {
    if (!assigning) return;
    await assignPonds.mutateAsync({ feederId: assigning.id, pondIds: selectedPondIds });
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
      render: (row: FeederRanking) => (row.averageWeightG == null ? '—' : `${fmt(row.averageWeightG, 2)} g`),
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

  const leader = ranking.find((row) => row.weeklyGrowthG != null) ?? null;
  const assignedPondCount = feeders.reduce((total, feeder) => total + feeder.ponds.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Arraçoadores</div>
            <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 13, maxWidth: 620 }}>
              Quem trata cada viveiro, e como o camarão cresce sob cada um.
            </div>
          </div>
          <Button size="lg" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Cadastrar arraçoador
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
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

      <section style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Ranking de crescimento</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
          Ganho de peso por semana, medido entre a primeira e a última biometria do ciclo ativo de cada viveiro.
        </div>
        <Table
          columns={rankingColumns}
          data={ranking}
          rowKey={(row) => row.feederId}
          emptyMessage="Cadastre um arraçoador e atribua viveiros para ver o ranking"
        />
      </section>

      <section style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Cadastro e viveiros</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {feeders.map((feeder) => (
            <div key={feeder.id} style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 14, backgroundColor: 'var(--bg-elevated)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{feeder.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {feeder.ponds.length ? feeder.ponds.map((pond) => pond.code).join(', ') : 'Nenhum viveiro atribuído'}
              </div>
              <Button variant="secondary" size="sm" style={{ marginTop: 12 }} onClick={() => openAssign(feeder)}>
                Atribuir viveiros
              </Button>
            </div>
          ))}
          {!feeders.length && !isLoading && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum arraçoador cadastrado ainda.</div>
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
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Marque os viveiros sob responsabilidade dessa pessoa. Desmarcar libera o viveiro.
          </div>
          <div style={{ display: 'grid', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
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
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    backgroundColor: checked ? 'var(--accent-soft)' : 'var(--bg-card)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
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
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>hoje com {owner}</span>
                  )}
                </label>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setAssigning(null)}>Cancelar</Button>
            <Button loading={assignPonds.isPending} onClick={handleAssign}>Salvar atribuição</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
