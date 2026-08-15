import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('lets the manager extend the table past the last weight', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    // A fazenda pode ir além da última linha, um grama por vez: 19, 20, 21...
    for (const weight of [19, 20, 21, 22, 23]) {
      await user.click(screen.getByRole('button', { name: `Adicionar ${weight} g` }))
      expect(screen.getByText(`${weight} g`)).toBeInTheDocument()
    }

    // 19–22 g fazem parte da regra padrão; 23 g é uma adição da fazenda.
    expect(screen.getByText('Adicionado pela fazenda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar 24 g' })).toBeInTheDocument()

    // Linhas adicionadas podem ser removidas; as do padrão, não.
    await user.click(screen.getByTitle('Remover 23 g'))
    expect(screen.queryByText('23 g')).not.toBeInTheDocument()
  })
})
