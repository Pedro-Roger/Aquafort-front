import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomDashboardsPage } from './CustomDashboardsPage'

const METRICS = [
  { key: 'racao_kg', label: 'Ração do dia (kg)', unit: 'kg', group: 'Nutrição' },
  { key: 'peso_medio_g', label: 'Peso médio (g)', unit: 'g', group: 'Biometria' },
]

const PONDS = [{ id: 'p1', code: 'V-01', name: 'Viveiro 01' }]

const { useMetricScatterMock } = vi.hoisted(() => ({
  useMetricScatterMock: vi.fn(),
}))

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({ data: PONDS }),
}))

vi.mock('../hooks/useDashboards', () => ({
  useDashboardMetrics: () => ({ data: METRICS }),
  useDashboards: () => ({ data: [] }),
  useSaveDashboard: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteDashboard: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMetricSeries: () => ({ data: [], isLoading: false }),
  useMetricScatter: (...args: unknown[]) => useMetricScatterMock(...args),
}))

describe('CustomDashboardsPage — cross-metric correlation (xAxis "metric")', () => {
  beforeEach(() => {
    useMetricScatterMock.mockReset()
    useMetricScatterMock.mockReturnValue({
      data: [
        {
          pondId: 'p1',
          pondCode: 'V-01',
          points: [
            { date: '2026-08-01', x: 10, y: 1.2 },
            { date: '2026-08-04', x: 18, y: 2.4 },
          ],
        },
      ],
      isLoading: false,
    })
  })

  it('lets the operator pick a second metric for the X axis and renders the correlation panel', async () => {
    const user = userEvent.setup()
    render(<CustomDashboardsPage />)

    await user.click(screen.getByRole('button', { name: 'Adicionar gráfico' }))

    // Order in the DOM: [0] "Painel salvo" (page header), then inside the
    // modal [1] "Métrica (eixo Y)", [2] "Eixo X" — once xAxis flips to
    // "metric" a new "Eixo X (métrica)" select appears at [3].
    await user.selectOptions(screen.getAllByRole('combobox')[1], 'peso_medio_g')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'metric')

    expect(screen.getByText('Eixo X (métrica)')).toBeInTheDocument()
    const xMetricSelect = screen.getAllByRole('combobox')[3]
    await user.selectOptions(xMetricSelect, 'racao_kg')

    // The Y metric must not be offered again as the X metric.
    expect(within(xMetricSelect).queryByRole('option', { name: 'Peso médio (g)' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'V-01' }))
    await user.click(screen.getByRole('button', { name: 'Adicionar ao painel' }))

    expect(screen.getByText(/Peso médio \(g\) × Ração do dia \(kg\)/)).toBeInTheDocument()
    expect(useMetricScatterMock).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'peso_medio_g', xMetric: 'racao_kg' }),
    )
  })

  it('disables "Adicionar ao painel" until an X metric is chosen', async () => {
    const user = userEvent.setup()
    render(<CustomDashboardsPage />)

    await user.click(screen.getByRole('button', { name: 'Adicionar gráfico' }))
    await user.selectOptions(screen.getAllByRole('combobox')[1], 'peso_medio_g')
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'metric')

    expect(screen.getByRole('button', { name: 'Adicionar ao painel' })).toBeDisabled()
  })
})
