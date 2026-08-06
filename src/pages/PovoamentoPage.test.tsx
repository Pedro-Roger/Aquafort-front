import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PovoamentoPage } from './PovoamentoPage'

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'V-01', name: 'Viveiro 01', type: 'ENGORDA', status: 'VAZIO', areaHa: 1.4 },
      { id: 'p2', code: 'B-02', name: 'Berçário 02', type: 'BERCARIO', status: 'VAZIO', areaHa: 1.2 },
    ],
    isLoading: false,
  }),
}))

vi.mock('../hooks/useCycles', () => ({
  useCreateCycle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCycles: () => ({ data: [], isLoading: false }),
}))

describe('PovoamentoPage', () => {
  it('shows operational shortcuts and defaults to the Berçário mode', () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Voltar ao painel')).toBeInTheDocument()
    expect(screen.getByText('Viveiros')).toBeInTheDocument()
    expect(screen.getByText('Ração')).toBeInTheDocument()
    expect(screen.getByText('Biometrias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Berçário' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Viveiro' })).toBeInTheDocument()
    expect(screen.getByText('Berçários disponíveis')).toBeInTheDocument()
    expect(screen.queryByText('Salvar povoamento')).not.toBeInTheDocument()
  })

  it('shows the Direto/Transferência toggle only in Viveiro mode', () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Povoamento direto')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Viveiro' }))

    expect(screen.getByText('Povoamento direto')).toBeInTheDocument()
    expect(screen.getByText('Transferência de berçário')).toBeInTheDocument()
    expect(screen.getByText('Viveiros disponíveis')).toBeInTheDocument()
  })

  it('selecting a tank and clicking Criar povoamento reveals the distribution and save button', () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Salvar povoamento')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('B-02'))
    fireEvent.click(screen.getByRole('button', { name: /Criar povoamento/ }))

    expect(screen.getByText('Salvar povoamento')).toBeInTheDocument()
  })
})
