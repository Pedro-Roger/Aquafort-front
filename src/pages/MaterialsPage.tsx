import { useMemo, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import {
  workspaceEyebrow,
  workspaceSurface,
  workspaceTile,
  workspaceTileLabel,
  workspaceTileValue,
} from '../components/ui/surfaces';
import { useCreateMaterial, useMaterialUsages, useMaterials, useRegisterUsage } from '../hooks/useMaterials';
import { usePonds } from '../hooks/usePonds';
import type { MaterialUnit, MaterialUsage, Pond } from '../types';

const UNIT_OPTIONS: { value: MaterialUnit; label: string }[] = [
  { value: 'KG', label: 'Quilo (kg)' },
  { value: 'UN', label: 'Unidade' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'SC', label: 'Saco (sc)' },
];

function fmt(value: number | null | undefined, digits = 2) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function money(value: number | null | undefined) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function currentLocalDateTime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function MaterialsPage() {
  const { data: materials = [], isLoading: materialsLoading } = useMaterials();
  const { data: ponds = [] } = usePonds();
  const { data: usages = [], isLoading: usagesLoading } = useMaterialUsages();
  const createMaterial = useCreateMaterial();
  const registerUsage = useRegisterUsage();

  const [productOpen, setProductOpen] = useState(false);
  const [usagePond, setUsagePond] = useState<Pond | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState({ name: '', unit: 'KG' as MaterialUnit, packageWeightKg: '', unitPrice: '' });
  const [usage, setUsage] = useState({ materialId: '', quantity: '', usedAt: currentLocalDateTime(), responsible: '', note: '' });

  const usageByPond = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>();
    usages.forEach((item) => {
      const current = map.get(item.pondId) ?? { count: 0, cost: 0 };
      current.count += 1;
      current.cost += item.totalCost ?? 0;
      map.set(item.pondId, current);
    });
    return map;
  }, [usages]);

  const totalCost = usages.reduce((total, item) => total + (item.totalCost ?? 0), 0);

  async function handleCreateProduct() {
    setError(null);
    if (product.name.trim().length < 2) {
      setError('Informe o nome do produto.');
      return;
    }
    try {
      await createMaterial.mutateAsync({
        name: product.name.trim(),
        unit: product.unit,
        packageWeightKg: product.packageWeightKg ? Number(product.packageWeightKg) : undefined,
        unitPrice: product.unitPrice ? Number(product.unitPrice) : undefined,
      });
    } catch {
      setError('Não foi possível salvar o produto.');
      return;
    }
    setProduct({ name: '', unit: 'KG', packageWeightKg: '', unitPrice: '' });
    setProductOpen(false);
  }

  async function handleRegisterUsage() {
    setError(null);
    if (!usagePond || !usage.materialId || !usage.quantity) {
      setError('Escolha o material e informe a quantidade.');
      return;
    }
    try {
      await registerUsage.mutateAsync({
        pondId: usagePond.id,
        materialId: usage.materialId,
        quantity: Number(usage.quantity),
        usedAt: new Date(usage.usedAt).toISOString(),
        responsible: usage.responsible.trim() || undefined,
        note: usage.note.trim() || undefined,
      });
    } catch {
      setError('Não foi possível registrar o uso.');
      return;
    }
    setUsage({ materialId: '', quantity: '', usedAt: currentLocalDateTime(), responsible: '', note: '' });
    setUsagePond(null);
  }

  const selectedMaterial = materials.find((item) => item.id === usage.materialId) ?? null;
  const estimatedCost =
    selectedMaterial?.unitPrice != null && usage.quantity
      ? Number(selectedMaterial.unitPrice) * Number(usage.quantity)
      : null;

  const usageColumns = [
    { key: 'usedAt', header: 'Data', render: (row: MaterialUsage) => new Date(row.usedAt).toLocaleString('pt-BR') },
    { key: 'pond', header: 'Viveiro', render: (row: MaterialUsage) => row.pond.code },
    { key: 'material', header: 'Material', render: (row: MaterialUsage) => row.material.name },
    {
      key: 'quantity',
      header: 'Quantidade',
      align: 'right' as const,
      render: (row: MaterialUsage) => `${fmt(Number(row.quantity), 2)} ${row.material.unit.toLowerCase()}`,
    },
    { key: 'totalCost', header: 'Custo', align: 'right' as const, render: (row: MaterialUsage) => money(row.totalCost) },
    { key: 'responsible', header: 'Responsável', render: (row: MaterialUsage) => row.responsible ?? '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Materiais</div>
            <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 13, maxWidth: 620 }}>
              Cadastre o produto e registre o que cada viveiro consumiu.
            </div>
          </div>
          <Button size="lg" icon={<Plus size={16} />} onClick={() => setProductOpen(true)}>
            Cadastrar produto
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Produtos</div>
            <div style={workspaceTileValue}>{materialsLoading ? '—' : materials.length}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Lançamentos</div>
            <div style={workspaceTileValue}>{usages.length}</div>
          </div>
          <div style={workspaceTile}>
            <div style={workspaceTileLabel}>Custo acumulado</div>
            <div style={workspaceTileValue}>{money(totalCost)}</div>
          </div>
        </div>
      </div>

      <section style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Registrar consumo</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
          Clique no viveiro para lançar o que foi utilizado.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {ponds.map((pond) => {
            const summary = usageByPond.get(pond.id);
            return (
              <button
                key={pond.id}
                onClick={() => setUsagePond(pond)}
                style={{
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 14,
                  backgroundColor: 'var(--bg-elevated)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                  <div>
                    <div style={workspaceTileLabel}>Viveiro</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', marginTop: 4 }}>{pond.code}</div>
                  </div>
                  <span style={{ width: 30, height: 30, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-dark)' }}>
                    <Package size={15} />
                  </span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  {summary
                    ? `${summary.count} lançamento(s) · ${money(summary.cost)}`
                    : 'Nenhum material lançado ainda.'}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Últimos lançamentos</div>
        <Table
          columns={usageColumns}
          data={usages}
          rowKey={(row) => row.id}
          loading={usagesLoading}
          emptyMessage="Nenhum material lançado ainda"
        />
      </section>

      <Modal open={productOpen} onClose={() => setProductOpen(false)} title="Novo produto" width={520}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Nome" value={product.name} onChange={(e) => setProduct((c) => ({ ...c, name: e.target.value }))} placeholder="Ex.: Cal virgem" />
          </div>
          <Select
            label="Unidade"
            options={UNIT_OPTIONS}
            value={product.unit}
            onChange={(e) => setProduct((c) => ({ ...c, unit: e.target.value as MaterialUnit }))}
          />
          <Input
            label="Peso da embalagem (kg)"
            type="number"
            step="0.001"
            value={product.packageWeightKg}
            onChange={(e) => setProduct((c) => ({ ...c, packageWeightKg: e.target.value }))}
            placeholder="Opcional"
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label={`Preço por ${product.unit.toLowerCase()}`}
              type="number"
              step="0.0001"
              value={product.unitPrice}
              onChange={(e) => setProduct((c) => ({ ...c, unitPrice: e.target.value }))}
              placeholder="Opcional"
            />
          </div>
          {error && <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="ghost" onClick={() => setProductOpen(false)}>Cancelar</Button>
            <Button loading={createMaterial.isPending} onClick={handleCreateProduct}>Salvar produto</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!usagePond}
        onClose={() => setUsagePond(null)}
        title={`Material utilizado — ${usagePond?.code ?? ''}`}
        width={520}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Select
              label="Material"
              options={materials.map((item) => ({ value: item.id, label: `${item.name} (${item.unit.toLowerCase()})` }))}
              value={usage.materialId}
              onChange={(e) => setUsage((c) => ({ ...c, materialId: e.target.value }))}
              placeholder="Selecione o material"
            />
          </div>
          <Input
            label={`Quantidade${selectedMaterial ? ` (${selectedMaterial.unit.toLowerCase()})` : ''}`}
            type="number"
            step="0.001"
            value={usage.quantity}
            onChange={(e) => setUsage((c) => ({ ...c, quantity: e.target.value }))}
          />
          <Input
            label="Data / hora"
            type="datetime-local"
            value={usage.usedAt}
            onChange={(e) => setUsage((c) => ({ ...c, usedAt: e.target.value }))}
          />
          <Input label="Responsável" value={usage.responsible} onChange={(e) => setUsage((c) => ({ ...c, responsible: e.target.value }))} placeholder="Quem aplicou" />
          <Input label="Observação" value={usage.note} onChange={(e) => setUsage((c) => ({ ...c, note: e.target.value }))} placeholder="Opcional" />

          {estimatedCost != null && (
            <div style={{ gridColumn: '1 / -1', padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-soft-strong)', fontSize: 13, color: 'var(--accent-dark)', fontWeight: 700 }}>
              Custo do lançamento: {money(estimatedCost)}
            </div>
          )}
          {error && <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="ghost" onClick={() => setUsagePond(null)}>Cancelar</Button>
            <Button loading={registerUsage.isPending} onClick={handleRegisterUsage}>Registrar uso</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
