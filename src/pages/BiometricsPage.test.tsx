import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BiometricsPage } from './BiometricsPage'

vi.mock('../hooks/useCycles', () => ({
  useCycles: () => ({
    data: [
      {
        id: 'c1',
        pondId: 'p1',
        pond: { id: 'p1', code: 'V-01', name: 'Viveiro 01' },
        lotCode: 'L-001',
        larvaeLotCode: null,
        supplier: 'Fornecedor X',
      },
    ],
  }),
}))

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [{ id: 'p1', code: 'V-01', name: 'Viveiro 01' }],
    isLoading: false,
  }),
}))

vi.mock('../hooks/useBiometrics', () => ({
  useBiometricKpis: () => ({ data: { pesoMedioG: 18.4, survivalPct: 91.2, biomassaAtualKg: 8400, racaoConsumidaKg: 1200, fca: 1.52 } }),
  useBiometrics: () => ({ data: [], isLoading: false }),
  useBiometricSeries: () => ({ data: { points: [] }, isLoading: false }),
  useCreateBiometric: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteBiometric: () => ({ mutate: vi.fn(), isPending: false }),
  useLatestBiometricsByPond: () => ({
    data: [
      {
        pondId: 'p1',
        pondCode: 'V-01',
        cycleId: 'c1',
        measuredAt: '2026-07-23T00:00:00.000Z',
        averageWeightG: 20.81,
        survivalRatePct: 75.83,
        estimatedBiomassKg: 3788.2,
      },
    ],
  }),
}))

vi.mock('../components/ponds/CycleWorkspacePanel', () => ({
  CycleWorkspacePanel: ({ title }: { title: string }) => <div>{title}</div>,
}))

vi.mock('../components/ui/KPICard', () => ({
  KPICard: ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}))

vi.mock('../components/ui/Table', () => ({
  Table: ({ emptyMessage }: { emptyMessage: string }) => <div>{emptyMessage}</div>,
}))

vi.mock('../pages/biometrias', () => ({
  buildBiometriaCards: () => [
    { label: 'Peso médio', value: '18.4', unit: 'g', tone: 'blue' },
    { label: 'Sobrevivência', value: '91.2', unit: '%', tone: 'green' },
    { label: 'Biomassa atual', value: '8400', unit: 'kg', tone: 'amber' },
    { label: 'Ração consumida', value: '1200', unit: 'kg', tone: 'slate' },
    { label: 'FCA', value: '1.520', tone: 'green' },
  ],
  buildBiometriaPath: () => '/biometrias',
  buildBiometriaQuickActions: () => [
    { label: 'Nova leitura', description: '', kind: 'primary', action: 'focus-form' },
    { label: 'Ver curva', description: '', kind: 'secondary', action: 'focus-chart' },
    { label: 'Ir para Despesca', description: '', kind: 'ghost', action: 'navigate-despesca' },
    { label: 'Voltar para Viveiros', description: '', kind: 'ghost', action: 'navigate-tanques' },
  ],
  buildBiometriaSnapshot: () => [
    { label: 'Ciclo', value: 'V-01 · L-001', detail: 'referência ativa' },
    { label: 'Leituras', value: '1', detail: 'histórico salvo' },
    { label: 'Última leitura', value: '14/07/2026', detail: 'data da biometria mais recente' },
    { label: 'Peso recente', value: '18.40 g', detail: 'último ponto coletado' },
    { label: 'Sobrevivência', value: '91.2 %', detail: 'índice do ciclo' },
  ],
  calculateBiometricsOperationalEstimate: () => ({
    weightG: 18.4,
    consumptionPct: 1,
    biomassKg: 8400,
    shrimpCount: 456521.74,
    survivalPct: 57.07,
  }),
  getConsumptionPctForWeight: () => 1,
}))

vi.mock('../pages/despesca', () => ({
  buildDespescaPath: () => '/despesca',
}))

describe('BiometricsPage', () => {
  it('shows operational shortcuts and a direct entry path', () => {
    render(
      <MemoryRouter>
        <BiometricsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Voltar ao painel')).toBeInTheDocument()
    expect(screen.getByText('Viveiros')).toBeInTheDocument()
    expect(screen.getByText('Povoamento')).toBeInTheDocument()
    expect(screen.getByText('Ração')).toBeInTheDocument()
    expect(screen.getByText('Qualidade')).toBeInTheDocument()
    expect(screen.getByText('Salvar biometria')).toBeInTheDocument()
  })

  it('lists each pond as an entry point for a new reading', () => {
    render(
      <MemoryRouter>
        <BiometricsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('V-01')).toBeInTheDocument()
    expect(screen.getByText(/Peso: 20,81 g/)).toBeInTheDocument()
  })
})
