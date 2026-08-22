import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table, type Column } from '../components/ui/Table';
import {
  metricGrid,
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
import { useCreateFarm, useFarms, useUpdateFarm, type Farm, type FarmStatus } from '../hooks/useFarms';

const STATUS_OPTIONS: { value: FarmStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'INACTIVE', label: 'Inativa (só leitura)' },
];

const STATUS_LABEL: Record<FarmStatus, string> = { ACTIVE: 'Ativa', INACTIVE: 'Inativa' };

function fmtHa(value: number | null | undefined) {
  if (value == null) return '—';
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ha`;
}

const emptyCreateForm = { name: '', legalName: '', cnpj: '', location: '', totalHa: '', timezone: 'America/Fortaleza' };

function extractMessage(err: unknown, fallback: string) {
  const withResponse = err as { response?: { data?: { message?: string } }; message?: string };
  return withResponse?.response?.data?.message ?? withResponse?.message ?? fallback;
}

/**
 * RN-04/RF-01: CRUD de fazendas, exclusivo do admin global — a rota só é
 * alcançável através de `RequireAdmin` (ver App.tsx). `cnpj`/`legalName` só
 * aparecem no formulário de criação: `PATCH /v1/farms/:id` não os aceita
 * (decisão do backend, dado cadastral fixo após o cadastro).
 */
export function FarmsAdminPage() {
  const { data: farms = [], isLoading } = useFarms();
  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Farm | null>(null);
  const [editForm, setEditForm] = useState({ name: '', location: '', totalHa: '', timezone: '', status: 'ACTIVE' as FarmStatus });
  const [editError, setEditError] = useState<string | null>(null);

  const activeCount = farms.filter((farm) => farm.status === 'ACTIVE').length;

  function openEdit(farm: Farm) {
    setEditing(farm);
    setEditForm({
      name: farm.name,
      location: farm.location ?? '',
      totalHa: farm.totalHa != null ? String(farm.totalHa) : '',
      timezone: farm.timezone,
      status: farm.status,
    });
    setEditError(null);
  }

  async function handleCreate() {
    setCreateError(null);
    if (createForm.name.trim().length < 2) {
      setCreateError('Informe o nome da fazenda.');
      return;
    }
    if (createForm.cnpj && !/^\d{14}$/.test(createForm.cnpj.trim())) {
      setCreateError('CNPJ deve conter 14 dígitos numéricos.');
      return;
    }
    try {
      await createFarm.mutateAsync({
        name: createForm.name.trim(),
        legalName: createForm.legalName.trim() || undefined,
        cnpj: createForm.cnpj.trim() || undefined,
        location: createForm.location.trim() || undefined,
        totalHa: createForm.totalHa ? Number(createForm.totalHa) : undefined,
        timezone: createForm.timezone.trim() || undefined,
      });
    } catch (err) {
      setCreateError(extractMessage(err, 'Não foi possível cadastrar a fazenda. Confira os dados e tente novamente.'));
      return;
    }
    setCreateForm(emptyCreateForm);
    setCreateOpen(false);
  }

  async function handleUpdate() {
    if (!editing) return;
    setEditError(null);
    if (editForm.name.trim().length < 2) {
      setEditError('Informe o nome da fazenda.');
      return;
    }
    try {
      await updateFarm.mutateAsync({
        id: editing.id,
        data: {
          name: editForm.name.trim(),
          location: editForm.location.trim() || undefined,
          totalHa: editForm.totalHa ? Number(editForm.totalHa) : undefined,
          timezone: editForm.timezone.trim() || undefined,
          status: editForm.status,
        },
      });
    } catch (err) {
      setEditError(extractMessage(err, 'Não foi possível salvar as alterações.'));
      return;
    }
    setEditing(null);
  }

  const columns: Column<Farm>[] = [
    {
      key: 'name',
      header: 'Fazenda',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.location || '—'}</div>
        </div>
      ),
    },
    { key: 'cnpj', header: 'CNPJ', render: (row) => row.cnpj ?? '—' },
    { key: 'totalHa', header: 'Área total', align: 'right', render: (row) => fmtHa(row.totalHa) },
    { key: 'timezone', header: 'Fuso horário' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            backgroundColor: row.status === 'ACTIVE' ? 'var(--accent-soft)' : 'rgba(220, 38, 38, 0.08)',
            color: row.status === 'ACTIVE' ? 'var(--accent-dark)' : 'var(--danger)',
          }}
        >
          {STATUS_LABEL[row.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Administração</div>
            <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 620 }}>
              Cadastre e edite as fazendas da plataforma. Inativar uma fazenda bloqueia escrita, mas preserva o histórico para leitura (RN-05).
            </div>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Cadastrar fazenda
          </Button>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Fazendas</div>
            <div style={workspaceTileValue}>{isLoading ? '—' : farms.length}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Ativas</div>
            <div style={workspaceTileValue}>{isLoading ? '—' : activeCount}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Inativas</div>
            <div style={workspaceTileValue}>{isLoading ? '—' : farms.length - activeCount}</div>
          </div>
        </div>
      </div>

      <section style={workspaceCard}>
        <h2 style={sectionTitle}>Fazendas cadastradas</h2>
        <Table
          columns={columns}
          data={farms}
          rowKey={(row) => row.id}
          loading={isLoading}
          emptyMessage="Nenhuma fazenda cadastrada ainda"
          emptyDescription="Cadastre a primeira fazenda para liberar o acesso operacional dela."
        />
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova fazenda" width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Nome" value={createForm.name} onChange={(e) => setCreateForm((c) => ({ ...c, name: e.target.value }))} placeholder="Ex.: Fazenda Norte" />
          </div>
          <Input label="Razão social (opcional)" value={createForm.legalName} onChange={(e) => setCreateForm((c) => ({ ...c, legalName: e.target.value }))} />
          <Input
            label="CNPJ (opcional)"
            value={createForm.cnpj}
            onChange={(e) => setCreateForm((c) => ({ ...c, cnpj: e.target.value.replace(/\D/g, '') }))}
            placeholder="Somente números"
            maxLength={14}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Localização (opcional)" value={createForm.location} onChange={(e) => setCreateForm((c) => ({ ...c, location: e.target.value }))} />
          </div>
          <Input
            label="Área total (ha, opcional)"
            type="number"
            step="0.0001"
            min="0.0001"
            value={createForm.totalHa}
            onChange={(e) => setCreateForm((c) => ({ ...c, totalHa: e.target.value }))}
          />
          <Input label="Fuso horário" value={createForm.timezone} onChange={(e) => setCreateForm((c) => ({ ...c, timezone: e.target.value }))} />
          {createError && <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: 13 }}>{createError}</div>}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button loading={createFarm.isPending} onClick={handleCreate}>Salvar fazenda</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar — ${editing?.name ?? ''}`} width={520}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Nome" value={editForm.name} onChange={(e) => setEditForm((c) => ({ ...c, name: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Localização" value={editForm.location} onChange={(e) => setEditForm((c) => ({ ...c, location: e.target.value }))} />
          </div>
          <Input
            label="Área total (ha)"
            type="number"
            step="0.0001"
            min="0.0001"
            value={editForm.totalHa}
            onChange={(e) => setEditForm((c) => ({ ...c, totalHa: e.target.value }))}
          />
          <Input label="Fuso horário" value={editForm.timezone} onChange={(e) => setEditForm((c) => ({ ...c, timezone: e.target.value }))} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={editForm.status}
              onChange={(e) => setEditForm((c) => ({ ...c, status: e.target.value as FarmStatus }))}
            />
          </div>
          {editing && (
            <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-muted)' }}>
              CNPJ: {editing.cnpj ?? '—'} · Razão social: {editing.legalName ?? '—'} (não editáveis por aqui)
            </div>
          )}
          {editError && <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: 13 }}>{editError}</div>}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button loading={updateFarm.isPending} onClick={handleUpdate}>Salvar alterações</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
