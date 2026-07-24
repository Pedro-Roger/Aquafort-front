import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TransferenciaPage } from './TransferenciaPage';
import { queryClient } from '../lib/queryClient';

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'V-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 1.4 },
      { id: 'p2', code: 'V-02', name: 'Viveiro 02', status: 'PREPARANDO', type: 'ENGORDA', areaHa: 1.2 },
    ],
    isLoading: false,
  }),
}));

describe('TransferenciaPage', () => {
  it('renders the transfer flow instead of povoamento', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TransferenciaPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Transferência')).toBeInTheDocument();
    expect(screen.getByText('Registrar transferência')).toBeInTheDocument();
    expect(screen.queryByText('Salvar povoamento')).not.toBeInTheDocument();
  });
});
