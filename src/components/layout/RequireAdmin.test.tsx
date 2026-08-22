import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RequireAdmin } from './RequireAdmin';

const useAuthMock = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

function renderWithRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard" element={<div>Painel operacional</div>} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin/fazendas" element={<div>Administração de fazendas</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAdmin', () => {
  it('renders the protected route for an admin user', () => {
    useAuthMock.mockReturnValue({ isAdmin: true });
    renderWithRoute('/admin/fazendas');

    expect(screen.getByText('Administração de fazendas')).toBeInTheDocument();
  });

  it('redirects a non-admin user to /dashboard', () => {
    useAuthMock.mockReturnValue({ isAdmin: false });
    renderWithRoute('/admin/fazendas');

    expect(screen.queryByText('Administração de fazendas')).not.toBeInTheDocument();
    expect(screen.getByText('Painel operacional')).toBeInTheDocument();
  });
});
