import { render, screen } from '@testing-library/react'
import { SettingsPage } from './SettingsPage'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'manager-1',
      name: 'Gerente',
      email: 'gerente@aquafort.com',
      role: 'ADMIN',
      createdAt: '2026-07-01',
    },
    isAdmin: true,
  }),
}))

vi.mock('../hooks/useFarmBiometricsReference', () => ({
  useFarmBiometricsReference: () => ({
    reference: Array.from({ length: 18 }, (_, index) => ({ weightG: index + 1, consumptionPct: Math.max(1, 11 - (index + 1)) })),
    saveReference: vi.fn((reference) => reference),
    resetReference: vi.fn(() => Array.from({ length: 18 }, (_, index) => ({ weightG: index + 1, consumptionPct: Math.max(1, 11 - (index + 1)) }))),
  }),
}))

describe('SettingsPage', () => {
  it('shows the farm biometrics reference table for the manager', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Configurações da fazenda')).toBeInTheDocument()
    expect(screen.getByText('Tabela de consumo por peso da biometria.')).toBeInTheDocument()
    expect(screen.getByText('1g até 18g')).toBeInTheDocument()
    expect(screen.getByText('Salvar tabela')).toBeInTheDocument()
    expect(screen.getByText('Restaurar padrão')).toBeInTheDocument()
    expect(screen.getByText('18 g')).toBeInTheDocument()
  })
})
