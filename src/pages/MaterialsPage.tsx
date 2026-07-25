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
  metricGrid,
  pageStack,
  radius,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
} from '../components/ui/surfaces';
import { EmptyState } from '../components/ui/EmptyState';
import { useAddStock, useCreateMaterial, useMaterialUsages, useMaterials, useRegisterUsage, useUpdateMaterial } from '../hooks/useMaterials';
import { usePonds } from '../hooks/usePonds';
import type { Material, MaterialUnit, MaterialUsage, Pond } from '../types';

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
  const updateMaterial = useUpdateMaterial();
  const addStock = useAddStock();
  const registerUsage = useRegisterUsage();

  const [productOpen, setProductOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [stockFor, setStockFor] = useState<Material | null>(null);
  const [stockQty, setStockQty] = useState('');
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

  async function handleSavePrice() {
    if (!editing) return;
    setError(null);
    const price = Number(editPrice.replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) {
      setError('Informe um preço válido.');
      return;
    }
    try {
      await updateMaterial.mutateAsync({ id: editing.id, data: { unitPrice: price } });
    } catch {
      setError('Não foi possível atualizar o preço.');
      return;
    }
    setEditing(null);
  }

  async function handleAddStock() {
    if (!stockFor) return;
    setError(null);
    const quantity = Number(stockQty.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Informe uma quantidade maior que zero.');
      return;
    }
    try {
      await addStock.mutateAsync({ id: stockFor.id, quantity });
    } catch {
      setError('Não foi possível lançar a entrada.');
      return;
    }
    setStockQty('');
    setStockFor(null);
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
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={workspaceEyebrow}>Materiais</div>
            <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 620 }}>
              Cadastre o produto e registre o que cada viveiro consumiu.
            </div>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setProductOpen(true)}>
            Cadastrar produto
          </Button>
        </div>

        <div style={{ ...metricGrid, marginTop: space.section }}>
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

      <section style={workspaceCard}>
        <div>
          <h2 style={sectionTitle}>Produtos e estoque</h2>
          <p style={{ ...sectionSubtitle, marginTop: 4 }}>
            O saldo cai quando um viveiro consome e sobe quando você lança uma entrada.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {materials.map((item) => {
            const stock = Number(item.stockQuantity ?? 0);
            const short = stock <= 0;
            return (
              <div key={item.id} style={{ ...workspaceTile, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {item.unitPrice != null ? `${money(Number(item.unitPrice))} por ${item.unit.toLowerCase()}` : 'Sem preço'}
                  </div>
                </div>
                <div>
                  <div style={workspaceTileLabel}>Em estoque</div>
                  <div style={{ ...workspaceTileValue, color: short ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {fmt(stock, 2)} {item.unit.toLowerCase()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditing(item);
                      setEditPrice(item.unitPrice != null ? String(item.unitPrice) : '');
                    }}
                  >
                    Editar preço
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setStockFor(item)}>
                    Lançar entrada
                  </Button>
                </div>
              </div>
            );
          })}
          {!materials.length && !materialsLoading && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum produto cadastrado ainda.</div>
          )}
        </div>
      </section>

      <section style={workspaceCard}>
        <div>
          <h2 style={sectionTitle}>Registrar consumo</h2>
          <p style={{ ...sectionSubtitle, marginTop: 4 }}>
            Clique no viveiro para lançar o que foi utilizado.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: space.tile }}>
          {ponds.map((pond) => {
            const summary = usageByPond.get(pond.id);
            return (
              <button
                key={pond.id}
                onClick={() => setUsagePond(pond)}
                style={{
                  ...workspaceTile,
                  textAlign: 'left',
                  padding: 14,
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: space.inline }}>
                  <div>
                    <div style={workspaceTileLabel}>Viveiro</div>
                    <div style={{ ...workspaceTileValue, fontSize: 17, marginTop: 4 }}>{pond.code}</div>
                  </div>
                  <span style={{ width: 30, height: 30, borderRadius: radius.control, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-dark)' }}>
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
          {!ponds.length && (
            <EmptyState
              compact
              title="Nenhum viveiro cadastrado."
              description="Cadastre um viveiro para registrar o consumo de materiais."
            />
          )}
        </div>
      </section>

      <section style={workspaceCard}>
        <h2 style={sectionTitle}>Últimos lançamentos</h2>
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
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Preço — ${editing?.name ?? ''}`} width={420}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Input
            label={`Preço por ${editing?.unit.toLowerCase() ?? ''}`}
            type="number"
            step="0.0001"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
          />
          {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button loading={updateMaterial.isPending} onClick={handleSavePrice}>Salvar preço</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!stockFor} onClose={() => setStockFor(null)} title={`Entrada — ${stockFor?.name ?? ''}`} width={420}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={sectionSubtitle}>
            Saldo atual: {fmt(Number(stockFor?.stockQuantity ?? 0), 2)} {stockFor?.unit.toLowerCase()}
          </div>
          <Input
            label="Quantidade recebida"
            type="number"
            step="0.001"
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
          />
          {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="ghost" onClick={() => setStockFor(null)}>Cancelar</Button>
            <Button loading={addStock.isPending} onClick={handleAddStock}>Lançar entrada</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
