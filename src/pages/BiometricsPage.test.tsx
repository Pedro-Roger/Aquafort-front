import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BiometricsPage } from './BiometricsPage'

const { useCyclesMock, usePondsMock, createBiometricMutateAsync } = vi.hoisted(() => ({
  useCyclesMock: vi.fn(),
  usePondsMock: vi.fn(),
  createBiometricMutateAsync: vi.fn().mockResolvedValue({}),
}))

const defaultCycle = {
  id: 'c1',
  pondId: 'p1',
  pond: { id: 'p1', code: 'V-01', name: 'Viveiro 01' },
  lotCode: 'L-001',
  larvaeLotCode: null,
  supplier: 'Fornecedor X',
}

const defaultPond = { id: 'p1', code: 'V-01', name: 'Viveiro 01' }

vi.mock('../hooks/useCycles', () => ({
  useCycles: (...args: unknown[]) => useCyclesMock(...args),
}))

vi.mock('../hooks/usePonds', () => ({
  usePonds: (...args: unknown[]) => usePondsMock(...args),
}))

vi.mock('../hooks/useBiometrics', () => ({
  useBiometricKpis: () => ({ data: { pesoMedioG: 18.4, survivalPct: 91.2, biomassaAtualKg: 8400, racaoConsumidaKg: 1200, fca: 1.52 } }),
  useBiometrics: () => ({ data: [], isLoading: false }),
  useBiometricSeries: () => ({ data: { points: [] }, isLoading: false }),
  useCreateBiometric: () => ({ mutateAsync: createBiometricMutateAsync, isPending: false }),
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

beforeEach(() => {
  useCyclesMock.mockReset()
  useCyclesMock.mockReturnValue({ data: [defaultCycle] })
  usePondsMock.mockReset()
  usePondsMock.mockReturnValue({ data: [defaultPond], isLoading: false })
  createBiometricMutateAsync.mockClear()
  createBiometricMutateAsync.mockResolvedValue({})
})

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

vi.mock('../pages/biometrias', async (importOriginal) => ({
  // isBercarioPondType/averageWeightGToPlPerGram stay real — the RF-10
  // (revisado)/RF-11 unit conversion itself now lives inside
  // BiometricsModalForm (see its own test file), this page just forwards
  // whatever averageWeightG the modal already resolved.
  ...(await importOriginal<typeof import('./biometrias')>()),
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
  isBiometricFormValid: (values: { measuredAt: string; sampleCount: number; averageWeightG: number }) =>
    Boolean(values.measuredAt && values.sampleCount && values.averageWeightG),
  buildBiometricPayload: (cycleId: string, values: Record<string, unknown>) => ({ cycleId, ...values }),
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

  // The sidebar form these used to test (RF-10 field swap, RF-11 PL/g
  // conversion) was removed — every entry point is now the pond-click
  // modal below, which already covers the same conversion rules.

  describe('pond-click modal (BiometricsModalForm)', () => {
    // Two ponds/cycles on screen at once: the sidebar dropdown defaults to
    // the first cycle (engorda, V-01), while the ponds grid also shows a
    // second, bercario pond (B-02) with its own cycle (c2).
    const engordaCycle = { ...defaultCycle, id: 'c1', pondId: 'p1', pond: { id: 'p1', code: 'V-01', name: 'Viveiro 01', type: 'ENGORDA' } }
    const bercarioCycle = { id: 'c2', pondId: 'p2', pond: { id: 'p2', code: 'B-02', name: 'Berçário 02', type: 'BERCARIO' }, lotCode: 'L-002', larvaeLotCode: null, supplier: 'Fornecedor Y' }
    const bercarioPond = { id: 'p2', code: 'B-02', name: 'Berçário 02', type: 'BERCARIO' }

    beforeEach(() => {
      useCyclesMock.mockReturnValue({ data: [engordaCycle, bercarioCycle] })
      usePondsMock.mockReturnValue({ data: [defaultPond, bercarioPond], isLoading: false })
    })

    it('saves into the clicked pond\'s own cycle, not the sidebar\'s selected cycle, and converts PL/g (bugs 1 and 2)', async () => {
      render(
        <MemoryRouter>
          <BiometricsPage />
        </MemoryRouter>,
      )

      fireEvent.click(screen.getByText('B-02'))

      // Bug 1: the modal must read PL/g for a bercario pond, not grams.
      expect(await screen.findByLabelText('PL/grama')).toBeInTheDocument()
      expect(screen.queryByText('Nova leitura — B-02')).toBeInTheDocument()

      const amostrasInputs = screen.getAllByLabelText('Amostras')
      fireEvent.change(amostrasInputs[amostrasInputs.length - 1], { target: { value: '20' } })
      fireEvent.change(screen.getByLabelText('PL/grama'), { target: { value: '250' } })
      fireEvent.click(screen.getByText('Salvar leitura'))

      await waitFor(() => expect(createBiometricMutateAsync).toHaveBeenCalledTimes(1))
      const payload = createBiometricMutateAsync.mock.calls[0][0]
      // Bug 2: must land on the clicked pond's cycle (c2), never the sidebar's (c1).
      expect(payload.cycleId).toBe('c2')
      // Bug 1: 250 PL/g must convert to avg_weight_g, not be persisted as 250 g.
      expect(payload.averageWeightG).toBeCloseTo(0.004, 6)
    })

    it('keeps grams (no conversion) when the clicked pond is engorda, even if a bercario cycle is selected in the sidebar', async () => {
      // Sidebar dropdown starts on the bercario cycle this time (cycles[0]).
      useCyclesMock.mockReturnValue({ data: [bercarioCycle, engordaCycle] })

      render(
        <MemoryRouter>
          <BiometricsPage />
        </MemoryRouter>,
      )

      fireEvent.click(screen.getByText('V-01'))

      expect(await screen.findByText('Nova leitura — V-01')).toBeInTheDocument()
      // The clicked pond is engorda — the modal must show grams, regardless
      // of which cycle the dropdown above happens to be on.
      expect(screen.getByLabelText('Peso médio (g)')).toBeInTheDocument()

      const amostrasInputs = screen.getAllByLabelText('Amostras')
      fireEvent.change(amostrasInputs[amostrasInputs.length - 1], { target: { value: '10' } })
      fireEvent.change(screen.getByLabelText('Peso médio (g)'), { target: { value: '12.5' } })
      fireEvent.click(screen.getByText('Salvar leitura'))

      await waitFor(() => expect(createBiometricMutateAsync).toHaveBeenCalledTimes(1))
      const payload = createBiometricMutateAsync.mock.calls[0][0]
      expect(payload.cycleId).toBe('c1')
      expect(payload.averageWeightG).toBe(12.5)
    })

    it('blocks saving when the clicked pond has no active cycle, instead of writing into the wrong one', async () => {
      usePondsMock.mockReturnValue({
        data: [defaultPond, bercarioPond, { id: 'p3', code: 'B-03', name: 'Berçário 03', type: 'BERCARIO' }],
        isLoading: false,
      })
      // No cycle in the list has pondId 'p3'.

      render(
        <MemoryRouter>
          <BiometricsPage />
        </MemoryRouter>,
      )

      fireEvent.click(screen.getByText('B-03'))

      expect(await screen.findByText(/não tem ciclo ativo/)).toBeInTheDocument()
      expect(screen.getByText('Salvar leitura')).toBeDisabled()
    })

    // The removed sidebar form used to be the target of ?focus=form deep
    // links (e.g. from HarvestPlanningPage). It now opens this same modal,
    // for whichever cycle is selected, instead of scrolling to nothing.
    it('opens the modal for the selected cycle\'s pond when navigated to with ?focus=form', async () => {
      render(
        <MemoryRouter initialEntries={['/biometrias?focus=form']}>
          <BiometricsPage />
        </MemoryRouter>,
      )

      // cycles[0] in this describe block is the engorda cycle (c1/V-01).
      expect(await screen.findByText('Nova leitura — V-01')).toBeInTheDocument()
      expect(screen.getByLabelText('Peso médio (g)')).toBeInTheDocument()
    })
  })
})
