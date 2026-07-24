import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { OperationsDashboardPage } from './OperationsDashboardPage'
import { queryClient } from '../lib/queryClient'

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'V-01', name: 'Viveiro 01', type: 'ENGORDA', status: 'POVOADO', areaHa: 1.4 },
      { id: 'p2', code: 'V-02', name: 'Viveiro 02', type: 'ENGORDA', status: 'VAZIO', areaHa: 1.2 },
    ],
    isLoading: false,
  }),
}))

vi.mock('../hooks/useCycles', () => ({
  useCycles: () => ({
    data: [
      {
        id: 'c1',
        pondId: 'p1',
        pond: { id: 'p1', code: 'V-01', name: 'Viveiro 01' },
        lotCode: 'L-001',
        supplier: 'Fornecedor X',
        phase: 'ENGORDA',
        stockDate: '2026-07-01T00:00:00.000Z',
        plCount: 100000,
        createdAt: '2026-07-01T00:00:00.000Z',
      },
    ],
  }),
  useCyclesSummary: () => ({
    data: { activeCycles: 1, totalPopulation: 100000, totalBiomassKg: 8400, avgFca: 1.52 },
  }),
}))

vi.mock('../hooks/useFeeding', () => ({
  useFeedingTable: () => ({
    data: {
      rows: [
        {
          pondId: 'p1',
          pondCode: 'V-01',
          pondName: 'Viveiro 01',
          pondStatus: 'POVOADO',
          cycleId: 'c1',
          lotCode: 'L-001',
          lastFedAt: '2026-07-14T12:00:00.000Z',
          lastFeedKg: 120.5,
          responsibleName: 'Gestor',
          productName: 'Ração X',
          dailyFeedKg: 120.5,
          racaoAcumuladaKg: 1820.25,
          estimatedBagsUsed: 3,
        },
        {
          pondId: 'p2',
          pondCode: 'V-02',
          pondName: 'Viveiro 02',
          pondStatus: 'VAZIO',
          cycleId: 'c2',
          lotCode: '—',
          lastFedAt: '2026-07-14T08:00:00.000Z',
          lastFeedKg: 0,
          responsibleName: '—',
          productName: '—',
          dailyFeedKg: 0,
          racaoAcumuladaKg: 0,
          estimatedBagsUsed: 0,
        },
      ],
      totals: { dailyFeedKg: 120.5, racaoAcumuladaKg: 1820.25, estimatedBagsUsed: 3 },
    },
  }),
  useFeedingList: () => ({ data: { items: [] } }),
  useFeedProducts: () => ({ data: [] }),
  useCreateExpressFeeding: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../hooks/useBiometrics', () => ({
  useBiometricKpis: () => ({
    data: { pesoMedioG: 18.4, survivalPct: 91.2, biomassaAtualKg: 8400, biomassaGanhaKg: 1200, totalBiometria: 4 },
  }),
  useBiometricSeries: () => ({ data: { points: [] } }),
  useBiometrics: () => ({ data: [] }),
}))

vi.mock('../hooks/useWaterQuality', () => ({
  useWaterQuality: () => ({ data: [] }),
  useWaterQualitySeries: () => ({ data: undefined }),
  useWaterQualitySocket: () => {},
}))

describe('OperationsDashboardPage', () => {
  it('renders the quick actions and ration summary sections', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <OperationsDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('Cadastrar viveiro')).toBeInTheDocument()
    expect(screen.getByText('Povoar')).toBeInTheDocument()
    expect(screen.getByText('Transferir')).toBeInTheDocument()
    expect(screen.getByText('Definir ração')).toBeInTheDocument()
    expect(screen.getByText('Ração por dia')).toBeInTheDocument()
    expect(screen.getByText('Acompanhamento por viveiro')).toBeInTheDocument()
  })
})
