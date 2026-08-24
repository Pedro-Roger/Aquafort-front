import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PovoamentoPage } from './PovoamentoPage'

const { mutateAsyncMock, createBiometricMutateAsync, useCyclesMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn().mockResolvedValue({}),
  createBiometricMutateAsync: vi.fn().mockResolvedValue({}),
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

vi.mock('../hooks/useBiometrics', () => ({
  useCreateBiometric: () => ({ mutateAsync: createBiometricMutateAsync, isPending: false }),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Operador Teste' } }),
}))

beforeEach(() => {
  mutateAsyncMock.mockClear()
  mutateAsyncMock.mockResolvedValue({})
  createBiometricMutateAsync.mockClear()
  createBiometricMutateAsync.mockResolvedValue({})
  useCyclesMock.mockReset()
  useCyclesMock.mockReturnValue({ data: [], isLoading: false })
})

describe('PovoamentoPage', () => {
  it('defaults to the Berçário mode', () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

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

  it('omits geneticCode always, and plPerGram when it was not informed, in a transfer-mode cycle', async () => {
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

  function renderTransferWithOrigin() {
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
    fireEvent.change(screen.getByLabelText(/Quantidade —/), { target: { value: '5000' } })
  }

  it('shows the PL/grama field in the transfer form (RF-13, previously absent)', () => {
    renderTransferWithOrigin()

    expect(screen.getByLabelText('PL/grama (opcional)')).toBeInTheDocument()
  })

  it('does not render an "Amostras" field in the transfer form anymore (RF-14 revisado/RF-16)', () => {
    renderTransferWithOrigin()

    expect(screen.queryByLabelText(/Amostras/)).not.toBeInTheDocument()
  })

  it('saves a transfer with PL/grama informed without requiring Amostras (RF-14 revisado)', async () => {
    renderTransferWithOrigin()

    fireEvent.change(screen.getByLabelText('PL/grama (opcional)'), { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    expect(createBiometricMutateAsync).toHaveBeenCalledTimes(1)
  })

  it('sends PL/grama on the destination cycle and creates a closing biometria on the origin cycle, with no sampleCount in the payload (RF-13/RF-14 revisado)', async () => {
    renderTransferWithOrigin()

    fireEvent.change(screen.getByLabelText('PL/grama (opcional)'), { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    const cyclePayload = mutateAsyncMock.mock.calls[0][0]
    expect(cyclePayload.plPerGram).toBe(250)

    expect(createBiometricMutateAsync).toHaveBeenCalledTimes(1)
    const biometryPayload = createBiometricMutateAsync.mock.calls[0][0]
    expect(biometryPayload.cycleId).toBe('c1')
    expect(biometryPayload).not.toHaveProperty('sampleCount')
    expect(biometryPayload.averageWeightG).toBeCloseTo(0.004, 6)
    expect(biometryPayload.responsibleId).toBe('user-1')
  })

  it('still allows a transfer without PL/grama (field stays optional)', async () => {
    renderTransferWithOrigin()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    expect(createBiometricMutateAsync).not.toHaveBeenCalled()
  })

  it('shows povoamentos that already exist on the server, without needing a save action first', () => {
    // Regression test for the bug: the card used to rely on local state populated
    // only inside handleSave, so a fresh mount (reload / new session) with real
    // data already saved on the server showed "Nenhum povoamento salvo ainda."
    useCyclesMock.mockImplementation((filter?: { status?: string; phase?: string }) => {
      if (filter?.phase === 'BERCARIO') return { data: [], isLoading: false }
      return {
        data: [
          {
            id: 'c1',
            pondId: 'p2',
            pond: { code: 'B-02', type: 'BERCARIO' },
            plCount: 250000,
            supplier: 'LARVI FORT',
            geneticCode: 'GEN-9',
            phase: 'BERCARIO',
            stockDate: '2026-08-01',
          },
        ],
        isLoading: false,
      }
    })

    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Nenhum povoamento salvo ainda.')).not.toBeInTheDocument()
    expect(screen.getByText('B-02 · Berçário 02')).toBeInTheDocument()
    expect(screen.getByText(/GEN-9 · LARVI FORT · 250\.000 PL/)).toBeInTheDocument()
    expect(mutateAsyncMock).not.toHaveBeenCalled()
  })

  it('shows the optional Geração field alongside Código genético, and saves without it (RF-18)', async () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Geração (opcional)')).toBeInTheDocument()

    fireEvent.click(screen.getByText('B-02'))
    fireEvent.click(screen.getByRole('button', { name: /Criar povoamento/ }))
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText('Fornecedor'), { target: { value: 'Lavifort' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    const payload = mutateAsyncMock.mock.calls[0][0]
    expect(payload.geneticGeneration).toBeUndefined()
  })

  it('marks the Geração field min=1 (backend requires @Min(1)) and blocks save with a visible error when 0 is typed, instead of silently dropping it', () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    const geracaoInput = screen.getByLabelText('Geração (opcional)') as HTMLInputElement
    expect(geracaoInput).toHaveAttribute('min', '1')

    fireEvent.change(screen.getByLabelText('Fornecedor'), { target: { value: 'Lavifort' } })
    fireEvent.change(geracaoInput, { target: { value: '0' } })
    fireEvent.click(screen.getByText('B-02'))
    fireEvent.click(screen.getByRole('button', { name: /Criar povoamento/ }))
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    expect(screen.getByText('Geração deve ser um número inteiro maior ou igual a 1.')).toBeInTheDocument()
    expect(mutateAsyncMock).not.toHaveBeenCalled()
  })

  it('sends the numeric geneticGeneration value in the create-cycle payload when filled (RF-18)', async () => {
    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Código genético'), { target: { value: 'APQS' } })
    fireEvent.change(screen.getByLabelText('Geração (opcional)'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Fornecedor'), { target: { value: 'Lavifort' } })
    fireEvent.click(screen.getByText('B-02'))
    fireEvent.click(screen.getByRole('button', { name: /Criar povoamento/ }))
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    const payload = mutateAsyncMock.mock.calls[0][0]
    expect(payload.geneticCode).toBe('APQS')
    expect(payload.geneticGeneration).toBe(4)
  })

  it('omits geneticGeneration (like geneticCode) in transfer-mode cycles', async () => {
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

    expect(screen.queryByLabelText('Geração (opcional)')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('V-01'))
    fireEvent.click(screen.getByRole('button', { name: /Criar povoamento/ }))
    fireEvent.click(screen.getByRole('button', { name: /B-02/ }))
    fireEvent.change(screen.getByLabelText(/Quantidade —/), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar povoamento' }))

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1))
    expect(mutateAsyncMock.mock.calls[0][0].geneticGeneration).toBeUndefined()
  })

  it('shows "código · geração N" in the recent povoamentos card when generation is filled, and falls back to the code alone otherwise', () => {
    useCyclesMock.mockImplementation((filter?: { status?: string; phase?: string }) => {
      if (filter?.phase === 'BERCARIO') return { data: [], isLoading: false }
      return {
        data: [
          {
            id: 'c1',
            pondId: 'p2',
            pond: { code: 'B-02', type: 'BERCARIO' },
            plCount: 100000,
            supplier: 'Lavifort',
            geneticCode: 'APQS',
            geneticGeneration: 4,
            phase: 'BERCARIO',
            stockDate: '2026-08-01',
          },
        ],
        isLoading: false,
      }
    })

    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/APQS · geração 4 · Lavifort · 100\.000 PL/)).toBeInTheDocument()
  })

  it('filters the recent povoamentos card by the pond type of the current mode', () => {
    useCyclesMock.mockImplementation((filter?: { status?: string; phase?: string }) => {
      if (filter?.phase === 'BERCARIO') return { data: [], isLoading: false }
      return {
        data: [
          {
            id: 'c1',
            pondId: 'p2',
            pond: { code: 'B-02', type: 'BERCARIO' },
            plCount: 100000,
            supplier: 'Lavifort',
            phase: 'BERCARIO',
            stockDate: '2026-08-01',
          },
          {
            id: 'c2',
            pondId: 'p1',
            pond: { code: 'V-01', type: 'ENGORDA' },
            plCount: 300000,
            supplier: 'Nutrimar',
            phase: 'ENGORDA',
            stockDate: '2026-08-05',
          },
        ],
        isLoading: false,
      }
    })

    render(
      <MemoryRouter>
        <PovoamentoPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Lavifort/)).toBeInTheDocument()
    expect(screen.queryByText(/Nutrimar/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Viveiro' }))

    expect(screen.getByText(/Nutrimar/)).toBeInTheDocument()
    expect(screen.queryByText(/Lavifort/)).not.toBeInTheDocument()
  })
})
