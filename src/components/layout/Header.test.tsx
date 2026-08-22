import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

const clearAuth = vi.fn();
const useAuthMock = vi.fn();
const useFarmMock = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../hooks/useFarm', () => ({
  useFarm: () => useFarmMock(),
}));

vi.mock('./FarmSwitcher', () => ({
  FarmSwitcher: () => <div data-testid="farm-switcher" />,
}));

const baseUser = { id: 'u1', name: 'Pedro', email: 'pedro@aq.com', role: 'OPERADOR', createdAt: '2026-01-01' };

describe('Header', () => {
  beforeEach(() => {
    clearAuth.mockClear();
    useAuthMock.mockReturnValue({ user: baseUser, clearAuth });
    useFarmMock.mockReturnValue({ activeFarmRole: null });
  });

  it('renders the farm switcher', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('farm-switcher')).toBeInTheDocument();
  });

  it('shows the role effective for the active farm (RN-03), not the global JWT role', () => {
    useAuthMock.mockReturnValue({ user: { ...baseUser, role: 'OPERADOR' }, clearAuth });
    useFarmMock.mockReturnValue({ activeFarmRole: 'TECNICO' });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('Técnico')).toBeInTheDocument();
    expect(screen.queryByText('Operador')).not.toBeInTheDocument();
  });

  it('falls back to the global role before the active farm resolves', () => {
    useFarmMock.mockReturnValue({ activeFarmRole: null });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('Operador')).toBeInTheDocument();
  });

  it('logs out and redirects to /login', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Sair/ }));

    expect(clearAuth).toHaveBeenCalled();
  });
});
