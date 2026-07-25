import { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowRightLeft,
  CircleDollarSign,
  Package2,
  Plus,
  Search,
  Warehouse,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { useFeedProducts } from '../hooks/useFeeding'
import {
  useCreateInventoryLocation,
  useCreateInventoryMovement,
  useInventoryBalances,
  useInventoryLocations,
  useInventoryMovements,
  useInventorySummary,
} from '../hooks/useInventory'
import { groupBalancesByLocation, formatMovementLabel } from './inventoryTransforms'
import type { InventoryBalanceRow, InventoryLocationType, InventoryMovement, InventoryMovementType } from '../types'
import { controlHeight, pageStack, radius, sectionTitle, space, workspaceCard, workspaceEyebrow, workspaceSurface, workspaceTile, workspaceTileLabel, workspaceTileValue } from '../components/ui/surfaces';

// A few fields here need native <select> markup, so they cannot use the shared
// Select component. Pin them to the same control tokens so a modal row of
// inputs and selects lines up instead of stair-stepping.
const nativeLabelStyle: CSSProperties = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.03em',
  marginBottom: 6,
};

const nativeSelectStyle: CSSProperties = {
  width: '100%',
  height: controlHeight,
  borderRadius: radius.control,
  border: '1px solid var(--border)',
  padding: '0 12px',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
};

function fmt(value: number, digits = 2) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function currentLocalDateTime() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const LOCATION_TYPE_OPTIONS: InventoryLocationType[] = ['ALMOXARIFADO', 'SETOR', 'FAZENDA']
const MOVEMENT_TYPE_OPTIONS: InventoryMovementType[] = ['INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT']

function locationTypeLabel(type: InventoryLocationType) {
  if (type === 'ALMOXARIFADO') return 'Almoxarifado'
  if (type === 'SETOR') return 'Setor'
  return 'Fazenda'
}

export function InventoryPage() {
  const { data: products = [] } = useFeedProducts()
  const { data: summary, isLoading: summaryLoading } = useInventorySummary()
  const { data: balances = [], isLoading: balancesLoading } = useInventoryBalances()
  const { data: movements = [], isLoading: movementsLoading } = useInventoryMovements()
  const { data: locations = [] } = useInventoryLocations()
  const createLocation = useCreateInventoryLocation()
  const createMovement = useCreateInventoryMovement()

  const [query, setQuery] = useState('')
  const [locationOpen, setLocationOpen] = useState(false)
  const [movementOpen, setMovementOpen] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [movementError, setMovementError] = useState<string | null>(null)
  const [locationForm, setLocationForm] = useState({
    code: '',
    name: '',
    type: 'ALMOXARIFADO' as InventoryLocationType,
    parentId: '',
  })
  const [movementForm, setMovementForm] = useState({
    productId: '',
    movementType: 'INBOUND' as InventoryMovementType,
    quantityKg: '',
    unitCost: '',
    fromLocationId: '',
    toLocationId: '',
    effectiveAt: currentLocalDateTime(),
    notes: '',
  })

  const filteredBalanceRows = balances.filter((balance) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      balance.productName.toLowerCase().includes(q) ||
      balance.locationName.toLowerCase().includes(q)
    )
  })

  const filteredGroupedBalances = groupBalancesByLocation(filteredBalanceRows)
  const filteredMovements = movements.filter((movement) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      movement.product.name.toLowerCase().includes(q) ||
      movement.fromLocation?.name?.toLowerCase().includes(q) ||
      movement.toLocation?.name?.toLowerCase().includes(q)
    )
  })

  const activeProductOptions = products
    .filter((product) => product.active)
    .map((product) => ({ value: product.id, label: product.name }))

  const locationOptions = locations
    .filter((location) => location.active)
    .map((location) => ({
      value: location.id,
      label: `${location.code} · ${location.name}`,
    }))

  async function handleCreateLocation() {
    if (!locationForm.code.trim() || !locationForm.name.trim()) return
    setLocationError(null)

    try {
      await createLocation.mutateAsync({
        code: locationForm.code.trim().toUpperCase(),
        name: locationForm.name.trim(),
        type: locationForm.type,
        parentId: locationForm.parentId || undefined,
      })

      setLocationForm({ code: '', name: '', type: 'ALMOXARIFADO', parentId: '' })
      setLocationOpen(false)
    } catch (error: any) {
      setLocationError(error?.response?.data?.message ?? error?.message ?? 'Erro ao criar local.')
    }
  }

  async function handleCreateMovement() {
    if (!movementForm.productId || !movementForm.quantityKg) return
    setMovementError(null)

    try {
      await createMovement.mutateAsync({
        productId: movementForm.productId,
        movementType: movementForm.movementType,
        quantityKg: Number(movementForm.quantityKg),
        unitCost: movementForm.unitCost ? Number(movementForm.unitCost) : undefined,
        fromLocationId: movementForm.fromLocationId || undefined,
        toLocationId: movementForm.toLocationId || undefined,
        effectiveAt: new Date(movementForm.effectiveAt).toISOString(),
        notes: movementForm.notes || undefined,
      })

      setMovementForm({
        productId: '',
        movementType: 'INBOUND',
        quantityKg: '',
        unitCost: '',
        fromLocationId: '',
        toLocationId: '',
        effectiveAt: currentLocalDateTime(),
        notes: '',
      })
      setMovementOpen(false)
    } catch (error: any) {
      setMovementError(error?.response?.data?.message ?? error?.message ?? 'Erro ao registrar movimentacao.')
    }
  }

  const balanceColumns = [
    {
      key: 'location',
      header: 'Local',
      render: (row: ReturnType<typeof groupBalancesByLocation>[number]) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.locationName}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{locationTypeLabel(row.locationType)}</div>
        </div>
      ),
    },
    {
      key: 'skuCount',
      header: 'SKUs',
      align: 'right' as const,
      render: (row: ReturnType<typeof groupBalancesByLocation>[number]) => row.skuCount,
    },
    {
      key: 'totalQuantityKg',
      header: 'Saldo total',
      align: 'right' as const,
      render: (row: ReturnType<typeof groupBalancesByLocation>[number]) => `${fmt(row.totalQuantityKg, 1)} kg`,
    },
    {
      key: 'topItems',
      header: 'Itens',
      render: (row: ReturnType<typeof groupBalancesByLocation>[number]) => row.items.slice(0, 2).map((item) => item.productName).join(' • '),
    },
  ]

  const movementColumns = [
    {
      key: 'effectiveAt',
      header: 'Data',
      render: (row: InventoryMovement) => new Date(row.effectiveAt).toLocaleString('pt-BR'),
    },
    {
      key: 'product',
      header: 'Produto',
      render: (row: InventoryMovement) => row.product.name,
    },
    {
      key: 'type',
      header: 'Movimento',
      render: (row: InventoryMovement) => formatMovementLabel(row),
    },
    {
      key: 'route',
      header: 'Fluxo',
      render: (row: InventoryMovement) => `${row.fromLocation?.code ?? '-'} -> ${row.toLocation?.code ?? '-'}`,
    },
    {
      key: 'quantityKg',
      header: 'Quantidade',
      align: 'right' as const,
      render: (row: InventoryMovement) => `${fmt(row.quantityKg, 2)} kg`,
    },
  ]

  const detailColumns = [
    {
      key: 'productName',
      header: 'Item',
      render: (row: InventoryBalanceRow) => row.productName,
    },
    {
      key: 'locationName',
      header: 'Local',
      render: (row: InventoryBalanceRow) => row.locationName,
    },
    {
      key: 'quantityKg',
      header: 'Saldo',
      align: 'right' as const,
      render: (row: InventoryBalanceRow) => `${fmt(row.quantityKg, 2)} kg`,
    },
  ]

  const cards = [
    {
      label: 'Locais ativos',
      value: summary?.activeLocations ?? 0,
      icon: <Warehouse size={18} />,
    },
    {
      label: 'Produtos com saldo',
      value: summary?.productsWithBalance ?? 0,
      icon: <Package2 size={18} />,
    },
    {
      label: 'Movimentacoes',
      value: summary?.movementCount ?? 0,
      icon: <ArrowRightLeft size={18} />,
    },
    {
      label: 'Estoque total',
      value: `${fmt(summary?.totalQuantityKg ?? 0, 1)} kg`,
      icon: <CircleDollarSign size={18} />,
    },
  ]

  const movementTypeRequiresFrom = movementForm.movementType === 'OUTBOUND' || movementForm.movementType === 'TRANSFER'
  const movementTypeRequiresTo = movementForm.movementType === 'INBOUND' || movementForm.movementType === 'TRANSFER' || movementForm.movementType === 'ADJUSTMENT'

  return (
    <div style={{ ...pageStack, height: '100%' }}>
      <div style={workspaceSurface}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.section, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={workspaceEyebrow}>
            Estoque por local
          </div>
          <div style={{ display: 'flex', gap: space.inline, flexWrap: 'wrap' }}>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setLocationOpen(true)}>
              Novo local
            </Button>
            <Button icon={<ArrowRightLeft size={16} />} onClick={() => setMovementOpen(true)} style={{ whiteSpace: 'nowrap' }}>
              Nova movimentacao
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: space.tile, marginTop: space.section }}>
          {cards.map((card) => (
            <div key={card.label} style={{ ...workspaceTile, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={workspaceTileLabel}>{card.label}</span>
                {card.icon}
              </div>
              <div style={workspaceTileValue}>{summaryLoading ? '-' : card.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: space.tile, flexWrap: 'wrap', alignItems: 'end' }}>
        <div style={{ minWidth: 320, flex: '1 1 360px' }}>
          <Input label="Pesquisar item ou local" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Racao, probiotico, almox..." />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.inline, color: 'var(--text-muted)', height: 38, fontSize: 13 }}>
          <Search size={16} />
          <span>{filteredBalanceRows.length} saldos visiveis</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: space.page, minHeight: 0 }}>
        <div style={{ ...workspaceCard, minHeight: 0 }}>
          <h2 style={sectionTitle}>Saldo consolidado por local</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Table columns={balanceColumns} data={filteredGroupedBalances} rowKey={(row) => row.locationId} loading={balancesLoading} emptyMessage="Sem saldos registrados" />
          </div>
        </div>

        <div style={{ ...workspaceCard, minHeight: 0 }}>
          <h2 style={sectionTitle}>Movimentacoes recentes</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Table columns={movementColumns} data={filteredMovements} rowKey={(row) => row.id} loading={movementsLoading} emptyMessage="Sem movimentacoes ainda" />
          </div>
        </div>
      </div>

      <div style={{ ...workspaceCard, minHeight: 280 }}>
        <h2 style={sectionTitle}>Saldo detalhado por item e local</h2>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Table columns={detailColumns} data={filteredBalanceRows} rowKey={(row) => `${row.locationId}:${row.productId}`} loading={balancesLoading} emptyMessage="Sem saldos detalhados" />
        </div>
      </div>

      <Modal open={locationOpen} onClose={() => setLocationOpen(false)} title="Novo local de estoque" width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Codigo" value={locationForm.code} onChange={(e) => setLocationForm((current) => ({ ...current, code: e.target.value }))} placeholder="ALM-01" />
          <Input label="Nome" value={locationForm.name} onChange={(e) => setLocationForm((current) => ({ ...current, name: e.target.value }))} placeholder="Almoxarifado central" />
          <div>
            <label style={nativeLabelStyle}>Tipo</label>
            <select
              value={locationForm.type}
              onChange={(e) => setLocationForm((current) => ({ ...current, type: e.target.value as InventoryLocationType }))}
              style={nativeSelectStyle}
            >
              {LOCATION_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{locationTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={nativeLabelStyle}>Local pai</label>
            <select
              value={locationForm.parentId}
              onChange={(e) => setLocationForm((current) => ({ ...current, parentId: e.target.value }))}
              style={nativeSelectStyle}
            >
              <option value="">Sem pai</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.code} · {location.name}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            {locationError && (
              <div style={{ marginRight: 'auto', color: 'var(--danger)', fontSize: 13, alignSelf: 'center' }}>
                {locationError}
              </div>
            )}
            <Button variant="secondary" onClick={() => setLocationOpen(false)}>Cancelar</Button>
            <Button loading={createLocation.isPending} onClick={handleCreateLocation} disabled={!locationForm.code.trim() || !locationForm.name.trim()}>
              Criar local
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={movementOpen} onClose={() => setMovementOpen(false)} title="Nova movimentacao" width={680}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={nativeLabelStyle}>Produto</label>
            <select
              value={movementForm.productId}
              onChange={(e) => setMovementForm((current) => ({ ...current, productId: e.target.value }))}
              style={nativeSelectStyle}
            >
              <option value="">Selecione um produto</option>
              {activeProductOptions.map((product) => (
                <option key={product.value} value={product.value}>{product.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={nativeLabelStyle}>Tipo</label>
            <select
              value={movementForm.movementType}
              onChange={(e) => setMovementForm((current) => ({ ...current, movementType: e.target.value as InventoryMovementType }))}
              style={nativeSelectStyle}
            >
              {MOVEMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{formatMovementLabel({ movementType: type } as InventoryMovement)}</option>
              ))}
            </select>
          </div>
          <Input label="Quantidade (kg)" type="number" step="0.001" value={movementForm.quantityKg} onChange={(e) => setMovementForm((current) => ({ ...current, quantityKg: e.target.value }))} />
          <Input label="Custo unitario (opcional)" type="number" step="0.0001" value={movementForm.unitCost} onChange={(e) => setMovementForm((current) => ({ ...current, unitCost: e.target.value }))} />
          <Input label="Data / hora" type="datetime-local" value={movementForm.effectiveAt} onChange={(e) => setMovementForm((current) => ({ ...current, effectiveAt: e.target.value }))} />

          {movementTypeRequiresFrom && (
            <div>
              <label style={nativeLabelStyle}>Origem</label>
              <select
                value={movementForm.fromLocationId}
                onChange={(e) => setMovementForm((current) => ({ ...current, fromLocationId: e.target.value }))}
                style={nativeSelectStyle}
              >
                <option value="">Selecione a origem</option>
                {locationOptions.map((location) => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </div>
          )}

          {movementTypeRequiresTo && (
            <div>
              <label style={nativeLabelStyle}>Destino</label>
              <select
                value={movementForm.toLocationId}
                onChange={(e) => setMovementForm((current) => ({ ...current, toLocationId: e.target.value }))}
                style={nativeSelectStyle}
              >
                <option value="">Selecione o destino</option>
                {locationOptions.map((location) => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Observacao" value={movementForm.notes} onChange={(e) => setMovementForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Entrada de compra, transferencia para setor..." />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            {movementError && (
              <div style={{ marginRight: 'auto', color: 'var(--danger)', fontSize: 13, alignSelf: 'center' }}>
                {movementError}
              </div>
            )}
            <Button variant="secondary" onClick={() => setMovementOpen(false)}>Cancelar</Button>
            <Button loading={createMovement.isPending} onClick={handleCreateMovement} disabled={!movementForm.productId || !movementForm.quantityKg}>
              Registrar movimentacao
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
