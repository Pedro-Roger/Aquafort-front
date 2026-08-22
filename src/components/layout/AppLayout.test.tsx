import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';

const useAuthMock = vi.fn();
const useFarmMock = vi.fn();
const domainQuerySpy = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../hooks/useFarm', () => ({
  useFarm: () => useFarmMock(),
}));

vi.mock('./Header', () => ({
  Header: () => <div data-testid="header" />,
}));

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

// Simula uma página de domínio real (ex.: OperationsDashboardPage) que
// dispara sua query assim que monta, sem checar farmsLoading por conta própria.
function DomainPage() {
  domainQuerySpy();
  return <div>Domain content</div>;
}

function renderAppLayout() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DomainPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    domainQuerySpy.mockClear();
    useAuthMock.mockReset();
    useFarmMock.mockReset();
  });

  it('redirects to /login when not authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });
    useFarmMock.mockReturnValue({ farmsLoading: false });

    renderAppLayout();

    expect(screen.queryByText('Domain content')).not.toBeInTheDocument();
    expect(domainQuerySpy).not.toHaveBeenCalled();
  });

  it('does not render the Outlet (nor let a domain page mount/fire its query) while GET /me/farms is still loading — covers the first-login race with X-Farm-Id (Achado 1)', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    useFarmMock.mockReturnValue({ farmsLoading: true });

    renderAppLayout();

    expect(screen.queryByText('Domain content')).not.toBeInTheDocument();
    expect(domainQuerySpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('renders the Outlet once authenticated and farms have finished loading', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true });
    useFarmMock.mockReturnValue({ farmsLoading: false });

    renderAppLayout();

    expect(screen.getByText('Domain content')).toBeInTheDocument();
    expect(domainQuerySpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});
