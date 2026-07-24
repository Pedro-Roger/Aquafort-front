import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { NutritionPage } from './NutritionPage'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Gestor', email: 'gestor@aq.com', role: 'ADMIN', createdAt: '2026-01-01' },
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
        larvaeLotCode: null,
        supplier: 'Fornecedor X',
      },
    ],
  }),
}))

vi.mock('../hooks/useFeeding', () => ({
  useFeedProducts: () => ({ data: [{ id: 'prod1', name: 'Ração 35%' }] }),
  useFeedingTable: () => ({
    data: {
      date: '2026-07-14',
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
          productName: 'Ração 35%',
          dailyFeedKg: 120.5,
          racaoAcumuladaKg: 1820.25,
          estimatedBagsUsed: 3,
        },
      ],
      totals: { dailyFeedKg: 120.5, racaoAcumuladaKg: 1820.25, estimatedBagsUsed: 3 },
    },
    isLoading: false,
  }),
  useFeedingList: () => ({ data: { items: [] }, isLoading: false }),
  useCreateExpressFeeding: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe('NutritionPage', () => {
  it('opens with useful defaults and shows the quick links', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <NutritionPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Voltar ao painel')).toBeInTheDocument()
    expect(screen.getByText('Povoamento')).toBeInTheDocument()
    expect(screen.getByText('Biometrias')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Lancar trato' }))

    expect(screen.getByLabelText('Viveiro / ciclo')).toHaveValue('c1')
    expect(screen.getByLabelText('Produto')).toHaveValue('prod1')
  })
})
