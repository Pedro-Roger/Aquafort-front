import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BiometricsPage } from './BiometricsPage'

// This file exercises the real Table component (unlike BiometricsPage.test.tsx,
// which mocks it down to just the empty message) specifically to prove the
// "Amostras" history column renders "—" for a null sampleCount without
// breaking the other columns (RN-13).

const { useCyclesMock, usePondsMock } = vi.hoisted(() => ({
  useCyclesMock: vi.fn(),
  usePondsMock: vi.fn(),
}))

const defaultCycle = {
  id: 'c1',
  pondId: 'p1',
  pond: { id: 'p1', code: 'V-01', name: 'Viveiro 01', type: 'ENGORDA' },
  lotCode: 'L-001',
  larvaeLotCode: null,
  supplier: 'Fornecedor X',
}

const defaultPond = { id: 'p1', code: 'V-01', name: 'Viveiro 01', type: 'ENGORDA' }

vi.mock('../hooks/useCycles', () => ({
  useCycles: (...args: unknown[]) => useCyclesMock(...args),
}))

vi.mock('../hooks/usePonds', () => ({
  usePonds: (...args: unknown[]) => usePondsMock(...args),
}))

vi.mock('../hooks/useBiometrics', () => ({
  useBiometricKpis: () => ({ data: {} }),
  useBiometrics: () => ({
    data: [
      {
        id: 'b1',
        cycleId: 'c1',
        measuredAt: '2026-08-10T12:00:00.000Z',
        averageWeightG: 15.2,
        sampleCount: null,
        survivalRatePct: 91.2,
        estimatedBiomass: 1234.5,
      },
    ],
    isLoading: false,
  }),
  useBiometricSeries: () => ({ data: { points: [] }, isLoading: false }),
  useCreateBiometric: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useDeleteBiometric: () => ({ mutate: vi.fn(), isPending: false }),
  useLatestBiometricsByPond: () => ({ data: [] }),
}))

vi.mock('../components/ponds/CycleWorkspacePanel', () => ({
  CycleWorkspacePanel: ({ title }: { title: string }) => <div>{title}</div>,
}))

beforeEach(() => {
  useCyclesMock.mockReset()
  useCyclesMock.mockReturnValue({ data: [defaultCycle] })
  usePondsMock.mockReset()
  usePondsMock.mockReturnValue({ data: [defaultPond], isLoading: false })
})

describe('BiometricsPage — history table "Amostras" column (RN-13)', () => {
  it('renders "—" for a biometry with a null sampleCount, without breaking the other columns', () => {
    render(
      <MemoryRouter>
        <BiometricsPage />
      </MemoryRouter>,
    )

    const row = screen.getByText('10/08/2026').closest('tr') as HTMLElement
    expect(row).toBeTruthy()

    const cells = Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent)
    // Date, Viveiro, Amostras, Peso médio, Sobrev., Biomassa, Responsável, ações
    expect(cells[0]).toBe('10/08/2026')
    expect(cells[2]).toBe('—')
    expect(cells[3]).toContain('15,20')
    expect(cells[4]).toContain('91,2')
    expect(cells[5]).toContain('1.234,50')
  })
})
