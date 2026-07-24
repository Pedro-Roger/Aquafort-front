import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PovoamentoPage } from './PovoamentoPage'

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'V-01', name: 'Viveiro 01', type: 'ENGORDA', status: 'VAZIO', areaHa: 1.4 },
      { id: 'p2', code: 'V-02', name: 'Viveiro 02', type: 'BERCARIO', status: 'VAZIO', areaHa: 1.2 },
    ],
    isLoading: false,
  }),
}))

vi.mock('../hooks/useCycles', () => ({
  useCreateCycle: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe('PovoamentoPage', () => {
  it('shows operational shortcuts and the simplified povoamento flow', () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Voltar ao painel')).toBeInTheDocument()
    expect(screen.getByText('Viveiros')).toBeInTheDocument()
    expect(screen.getByText('Ração')).toBeInTheDocument()
    expect(screen.getByText('Biometrias')).toBeInTheDocument()
    expect(screen.getByText('Salvar povoamento')).toBeInTheDocument()
    expect(screen.getByText('Tanques disponíveis')).toBeInTheDocument()
  })
})
