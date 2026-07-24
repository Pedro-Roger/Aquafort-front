import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const mutateAsync = vi.fn().mockResolvedValue({ id: 'transfer-1' });

vi.mock('../hooks/useTransfers', () => ({
  useTransfers: () => ({
    data: [
      {
        id: 'transfer-1',
        fromPondId: 'p1',
        toPondId: 'p2',
        quantity: 5000,
        transferredAt: '2026-07-20T12:00:00.000Z',
        responsible: 'João',
        reason: 'Ajuste operacional',
        createdAt: '2026-07-20T12:00:00.000Z',
        fromPond: { id: 'p1', code: 'V-01', name: 'Viveiro 01', status: 'POVOADO' },
        toPond: { id: 'p2', code: 'V-02', name: 'Viveiro 02', status: 'PREPARANDO' },
      },
    ],
    isLoading: false,
  }),
  useCreateTransfer: () => ({ mutateAsync, isPending: false }),
}));

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TransferenciaPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TransferenciaPage', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('renders the transfer flow instead of povoamento', () => {
    renderPage();

    expect(screen.getByText('Transferência')).toBeInTheDocument();
    expect(screen.getByText('Registrar transferência')).toBeInTheDocument();
    expect(screen.queryByText('Salvar povoamento')).not.toBeInTheDocument();
  });

  it('shows transfers coming from the server', () => {
    renderPage();

    expect(screen.getByText('V-01')).toBeInTheDocument();
    expect(screen.getByText('Ajuste operacional')).toBeInTheDocument();
    expect(screen.getByText('5.000 un')).toBeInTheDocument();
  });

  it('sends the transfer to the API instead of keeping it in memory', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), 'p2');
    await user.type(screen.getByLabelText('Quantidade'), '1200');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');

    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        fromPondId: 'p1',
        toPondId: 'p2',
        quantity: 1200,
        responsible: 'Maria',
      }),
    );
  });

  it('surfaces an error when the API rejects the transfer', async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValueOnce(new Error('boom'));
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), 'p2');
    await user.type(screen.getByLabelText('Quantidade'), '10');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    expect(await screen.findByText(/Não foi possível salvar a transferência/i)).toBeInTheDocument();
  });
});
