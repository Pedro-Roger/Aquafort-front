import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FeedersPage } from './FeedersPage';

const assignMutate = vi.fn().mockResolvedValue({});
const createMutate = vi.fn().mockResolvedValue({});

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'VE-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 3 },
      { id: 'p2', code: 'BRC-01', name: 'Berçário 01', status: 'VAZIO', type: 'BERCARIO', areaHa: 0.05 },
    ],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useFeeders', () => ({
  useFeeders: () => ({
    data: [
      { id: 'f1', name: 'João', active: true, ponds: [{ id: 'p1', code: 'VE-01', name: 'Viveiro 01', type: 'ENGORDA', status: 'POVOADO' }] },
      { id: 'f2', name: 'Maria', active: true, ponds: [] },
    ],
    isLoading: false,
  }),
  useFeederRanking: () => ({
    data: [
      { position: 1, feederId: 'f1', feederName: 'João', pondCount: 1, pondCodes: ['VE-01'], weeklyGrowthG: 2.5, averageWeightG: 20.81, survivalPct: 75.83, biomassKg: 3788.2 },
      { position: 2, feederId: 'f2', feederName: 'Maria', pondCount: 0, pondCodes: [], weeklyGrowthG: null, averageWeightG: null, survivalPct: null, biomassKg: 0 },
    ],
  }),
  useCreateFeeder: () => ({ mutateAsync: createMutate, isPending: false }),
  useAssignPonds: () => ({ mutateAsync: assignMutate, isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <FeedersPage />
    </MemoryRouter>,
  );
}

describe('FeedersPage', () => {
  beforeEach(() => {
    assignMutate.mockClear();
    createMutate.mockClear();
  });

  it('ranks feeders by weekly growth and names the leader', () => {
    renderPage();

    expect(screen.getByText('Ranking de crescimento')).toBeInTheDocument();
    expect(screen.getByText('2,50 g/sem')).toBeInTheDocument();
    expect(screen.getByText('2,50 g por semana')).toBeInTheDocument();
  });

  it('counts ponds that still have no one responsible', () => {
    renderPage();

    // two ponds exist, one is assigned
    expect(screen.getByText('Viveiros sem responsável')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('sends the full pond set when assigning, so unchecking releases a pond', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Atribuir viveiros' })[0]);
    await user.click(screen.getByRole('checkbox', { name: /BRC-01/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar atribuição' }));

    await waitFor(() => expect(assignMutate).toHaveBeenCalledTimes(1));
    expect(assignMutate).toHaveBeenCalledWith({ feederId: 'f1', pondIds: ['p1', 'p2'] });
  });

  it('refuses to save a feeder without a name', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Cadastrar arraçoador/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Informe o nome do arraçoador.')).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });
});
