import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InventoryPage } from './InventoryPage';

const updatePondMutate = vi.fn().mockResolvedValue({});

const ponds = [
  { id: 'p1', code: 'VE-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 3, feedLocationId: 'loc-1' },
  { id: 'p2', code: 'VE-02', name: 'Viveiro 02', status: 'POVOADO', type: 'ENGORDA', areaHa: 1.5, feedLocationId: null },
  { id: 'p3', code: 'BRC-01', name: 'Berçário 01', status: 'VAZIO', type: 'BERCARIO', areaHa: 0.05, feedLocationId: null },
];

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({ data: ponds, isLoading: false }),
  useUpdatePond: () => ({ mutateAsync: updatePondMutate, isPending: false }),
}));

vi.mock('../hooks/useFeeding', () => ({
  useFeedProducts: () => ({ data: [{ id: 'prod-1', name: 'Ração 35% PB', bagWeightKg: 30, active: true }] }),
}));

vi.mock('../hooks/useInventory', () => ({
  useInventoryLocations: () => ({
    data: [{ id: 'loc-1', code: 'ALM-01', name: 'Almoxarifado central', type: 'ALMOXARIFADO', active: true }],
    isLoading: false,
  }),
  useInventoryBalances: () => ({ data: [], isLoading: false }),
  useInventoryMovements: () => ({ data: [], isLoading: false }),
  useInventorySummary: () => ({ data: undefined }),
  useCreateInventoryLocation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateInventoryMovement: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <InventoryPage />
    </MemoryRouter>,
  );
}

describe('InventoryPage — ração de cada viveiro', () => {
  beforeEach(() => updatePondMutate.mockClear());

  it('warns how many ponds still move no stock', () => {
    renderPage();

    expect(screen.getByText(/2 viveiro\(s\) sem depósito/)).toBeInTheDocument();
  });

  it('links a pond to the warehouse it draws from', async () => {
    const user = userEvent.setup();
    renderPage();

    const selects = screen.getAllByLabelText('Sai do depósito');
    await user.selectOptions(selects[1], 'loc-1');

    await waitFor(() => expect(updatePondMutate).toHaveBeenCalledTimes(1));
    expect(updatePondMutate).toHaveBeenCalledWith({ id: 'p2', data: { feedLocationId: 'loc-1' } });
  });

  it('releases a pond when the warehouse is cleared', async () => {
    const user = userEvent.setup();
    renderPage();

    const selects = screen.getAllByLabelText('Sai do depósito');
    await user.selectOptions(selects[0], '');

    await waitFor(() => expect(updatePondMutate).toHaveBeenCalledTimes(1));
    expect(updatePondMutate).toHaveBeenCalledWith({ id: 'p1', data: { feedLocationId: null } });
  });

  it('links every unassigned pond at once when the farm has a single warehouse', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Usar ALM-01 em todos/ }));

    // only the two that had none — the linked pond is left alone
    await waitFor(() => expect(updatePondMutate).toHaveBeenCalledTimes(2));
    expect(updatePondMutate).toHaveBeenCalledWith({ id: 'p2', data: { feedLocationId: 'loc-1' } });
    expect(updatePondMutate).toHaveBeenCalledWith({ id: 'p3', data: { feedLocationId: 'loc-1' } });
  });
});
