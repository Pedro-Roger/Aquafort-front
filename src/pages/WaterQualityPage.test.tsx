import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WaterQualityPage } from './WaterQualityPage'

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
      },
    ],
  }),
}))

vi.mock('../hooks/useWaterQuality', () => ({
  useWaterQuality: () => ({
    data: [
      {
        id: 'w1',
        cycleId: 'c1',
        pondId: 'p1',
        measuredAt: '2026-07-14T12:00:00.000Z',
        oxygenMgL: 6.5,
        ph: 7.8,
        salinityPpt: 16,
        temperatureC: 28,
        ammoniaMgL: 0.1,
        responsibleName: 'Gestor',
        outOfRange: false,
        outOfRangeParams: [],
        createdAt: '2026-07-14T12:00:00.000Z',
      },
    ],
    isLoading: false,
  }),
  useCreateWaterQuality: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useWaterQualitySocket: () => {},
  useWaterQualitySeries: () => ({ data: { doMgL: [], ph: [], salinity: [], temperatureC: [], ammoniaMgL: [] }, isLoading: false }),
}))

describe('WaterQualityPage', () => {
  it('shows operational shortcuts and the direct monitoring flow', () => {
    render(
      <MemoryRouter>
        <WaterQualityPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Voltar ao painel')).toBeInTheDocument()
    expect(screen.getByText('Ração')).toBeInTheDocument()
    expect(screen.getByText('Biometrias')).toBeInTheDocument()
    expect(screen.getByText('Povoamento')).toBeInTheDocument()
    expect(screen.getByText('Nova Medição')).toBeInTheDocument()
    expect(screen.getByText('Leitura do ciclo e alerta operacional.')).toBeInTheDocument()
  })
})
