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
      {
        position: 1, feederId: 'f1', feederName: 'João', pondCount: 2, pondCodes: ['VE-01', 'VE-02'],
        weeklyGrowthG: 2.5, averageWeightG: 20.81, heaviestPondCode: 'VE-01',
        survivalPct: 75.83, biomassKg: 6289.2,
        ponds: [
          { pondId: 'p1', pondCode: 'VE-01', averageWeightG: 20.81, survivalPct: 75.83, biomassKg: 3788.2, weeklyGrowthG: 2.5 },
          { pondId: 'p2', pondCode: 'VE-02', averageWeightG: 18.33, survivalPct: 75.83, biomassKg: 2501, weeklyGrowthG: 2.2 },
        ],
      },
      { position: 2, feederId: 'f2', feederName: 'Maria', pondCount: 0, pondCodes: [], weeklyGrowthG: null, averageWeightG: null, heaviestPondCode: null, survivalPct: null, biomassKg: 0, ponds: [] },
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

  it('shows the heaviest pond weight and names that pond', () => {
    renderPage();

    // the weight cell names the heaviest pond alongside the number
    const trigger = screen.getByRole('button', { name: /20,81 g/ });
    expect(trigger).toHaveTextContent('VE-01');
  });

  it('opens the pond by pond breakdown when the weight is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText(/Viveiros de João/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /20,81 g/ }));

    expect(await screen.findByText(/Viveiros de João/)).toBeInTheDocument();
    expect(screen.getByText('18,33 g')).toBeInTheDocument();
  });

  it('closes the breakdown when the weight is clicked again', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', { name: /20,81 g/ });
    await user.click(trigger);
    await user.click(trigger);

    expect(screen.queryByText(/Viveiros de João/)).not.toBeInTheDocument();
  });

  it('locks a pond that already answers to another feeder', async () => {
    const user = userEvent.setup();
    renderPage();

    // Maria has none; VE-01 belongs to João
    await user.click(screen.getAllByRole('button', { name: 'Atribuir viveiros' })[1]);

    const checkbox = screen.getByRole('checkbox', { name: /VE-01/ });
    expect(checkbox).toBeDisabled();
    expect(screen.getByText(/com João/)).toBeInTheDocument();
  });

  it('unlocks the pond only when the move is asked for', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Atribuir viveiros' })[1]);
    await user.click(screen.getByRole('button', { name: 'Trocar' }));

    expect(screen.getByRole('checkbox', { name: /VE-01/ })).toBeEnabled();
  });

  it('surfaces an error instead of closing when the assignment fails', async () => {
    const user = userEvent.setup();
    assignMutate.mockRejectedValueOnce(new Error('boom'));
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Atribuir viveiros' })[0]);
    await user.click(screen.getByRole('button', { name: 'Salvar atribuição' }));

    expect(await screen.findByText(/Não foi possível salvar a atribuição/)).toBeInTheDocument();
  });
});
