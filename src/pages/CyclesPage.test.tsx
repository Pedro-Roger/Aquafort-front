import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CyclesPage } from './CyclesPage'

const usePondsMock = vi.fn((filter?: { type?: string }) => ({
  data: filter?.type === 'BERCARIO'
    ? [
        { id: 'p1', code: 'BC-01', name: 'Berçário 01', type: 'BERCARIO', status: 'POVOADO' },
        { id: 'p2', code: 'BC-02', name: 'Berçário 02', type: 'BERCARIO', status: 'VAZIO' },
      ]
    : [],
  isLoading: false,
}))

vi.mock('../hooks/useNursery', () => ({
  useNurseryActivities: () => ({
    data: [
      {
        id: 'a1',
        pondId: 'p1',
        measuredAt: '2026-07-08T00:00:00.000Z',
        plGram: 1.2,
        probioticKg: 0.5,
        bicarbonateKg: null,
        chlorineKg: null,
        bokashiKg: 0.25,
        waterManagementType: 'TROCA_PARCIAL',
        waterManagementNote: 'Ajuste após chuva',
        observation: 'Sem intercorrência',
        createdAt: '2026-07-08T12:00:00.000Z',
        pond: { id: 'p1', code: 'BC-01', name: 'Berçário 01' },
        creator: null,
      },
    ],
    isLoading: false,
  }),
  useCreateNurseryActivity: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../hooks/usePonds', () => ({
  usePonds: (filter?: { type?: string }) => usePondsMock(filter),
}))

describe('CyclesPage', () => {
  it('renders the berçário title and filters ponds by nursery type', async () => {
    const user = userEvent.setup()

    render(<CyclesPage />)

    expect(screen.getByRole('heading', { name: 'PL grama, insumos e manejo operacional.' })).toBeInTheDocument()
    expect(screen.getByText('BC-01')).toBeInTheDocument()
    expect(screen.getByText('BC-02')).toBeInTheDocument()
    expect(screen.queryByText('Berçário 01')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Novo registro' }))

    expect(screen.getByRole('heading', { name: 'Novo registro de berçário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Berçário')).toBeInTheDocument()
    expect(screen.getByLabelText('PL grama')).toBeInTheDocument()
  })
})
