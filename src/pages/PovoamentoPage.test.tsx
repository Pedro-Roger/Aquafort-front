import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PovoamentoPage } from './PovoamentoPage'

const { mutateAsyncMock, useCyclesMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn().mockResolvedValue({}),
  useCyclesMock: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}))

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
  useCreateCycle: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
  useCycles: (...args: unknown[]) => useCyclesMock(...args),
}))

beforeEach(() => {
  mutateAsyncMock.mockClear()
  useCyclesMock.mockReset()
  useCyclesMock.mockReturnValue({ data: [], isLoading: false })
})

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

  it('omits geneticCode and plPerGram from the payload when saving a transfer-mode cycle', async () => {
    useCyclesMock.mockReturnValue({
      data: [
        { id: 'c1', pondId: 'p2', pond: { code: 'B-02' }, plCount: 100000, supplier: 'Lavifort', phase: 'BERCARIO', stockDate: '2026-07-01' },
      ],
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Viveiro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Transferência de berçário' }))
    fireEvent.click(screen.getByText('V-01'))
    fireEvent.click(screen.getByRole('button', { name: /Criar povoamento/ }))

    fireEvent.click(screen.getByRole('button', { name: /B-02/ }))

    const quantityInput = screen.getByLabelText(/Quantidade —/)
    fireEvent.change(quantityInput, { target: { value: '5000' } })

    expect(screen.getByText('Pronto para salvar.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
    const payload = mutateAsyncMock.mock.calls[0][0]
    expect(payload.geneticCode).toBeUndefined()
    expect(payload.plPerGram).toBeUndefined()
    expect(payload.origins).toEqual([{ sourceCycleId: 'c1', label: expect.stringContaining('B-02'), quantity: 5000 }])
  })
})
