import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AutoFeedersPage } from './AutoFeedersPage';

const updateMutate = vi.fn().mockResolvedValue({});

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'VE-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 3, feederCount: 4 },
      { id: 'p2', code: 'BRC-01', name: 'Berçário 01', status: 'VAZIO', type: 'BERCARIO', areaHa: 0.05, feederCount: 0 },
    ],
    isLoading: false,
  }),
  useUpdatePond: () => ({ mutateAsync: updateMutate, isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AutoFeedersPage />
    </MemoryRouter>,
  );
}

describe('AutoFeedersPage', () => {
  beforeEach(() => updateMutate.mockClear());

  it('totals the feeders installed and counts the ponds without any', () => {
    renderPage();

    expect(screen.getByText('Total instalado')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Sem alimentador')).toBeInTheDocument();
  });

  it('starts each field from the count already registered', () => {
    renderPage();

    const inputs = screen.getAllByLabelText('Alimentadores') as HTMLInputElement[];
    expect(inputs[0].value).toBe('4');
    expect(inputs[1].value).toBe('0');
  });

  it('saves the new count for the pond that was edited', async () => {
    const user = userEvent.setup();
    renderPage();

    const inputs = screen.getAllByLabelText('Alimentadores');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '3');
    await user.click(screen.getAllByRole('button', { name: 'Salvar' })[1]);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate).toHaveBeenCalledWith({ id: 'p2', data: { feederCount: 3 } });
  });
});
