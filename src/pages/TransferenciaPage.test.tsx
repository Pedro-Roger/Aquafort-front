import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TransferenciaPage } from './TransferenciaPage';
import { queryClient } from '../lib/queryClient';

const defaultPonds = [
  { id: 'p1', code: 'V-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 1.4 },
  { id: 'p2', code: 'V-02', name: 'Viveiro 02', status: 'PREPARANDO', type: 'ENGORDA', areaHa: 1.2 },
];

const usePondsMock = vi.fn(() => ({ data: defaultPonds, isLoading: false }));

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => usePondsMock(),
}));

function selectOptionValues(select: HTMLElement) {
  return Array.from((select as HTMLSelectElement).options)
    .map((opt) => opt.value)
    .filter((value) => value !== '');
}

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
    usePondsMock.mockReturnValue({ data: defaultPonds, isLoading: false });
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

describe('TransferenciaPage - filtro e ordenação de Origem/Destino', () => {
  // Reproduz o caso real de produção: VE-242 é um viveiro de engorda recém
  // cadastrado, sem ciclo (VAZIO), que não deveria aparecer como origem.
  const richPonds = [
    { id: 've242', code: 'VE-242', name: 'Viveiro 242', status: 'VAZIO', type: 'ENGORDA', areaHa: 1 },
    { id: 've100', code: 'VE-100', name: 'Viveiro 100', status: 'POVOADO', type: 'ENGORDA', areaHa: 1 },
    { id: 'vb02', code: 'VB-02', name: 'Berçário 02', status: 'POVOADO', type: 'BERCARIO', areaHa: 0.5 },
    { id: 'vb01', code: 'VB-01', name: 'Berçário 01', status: 'POVOADO', type: 'BERCARIO', areaHa: 0.5 },
    { id: 've050', code: 'VE-050', name: 'Viveiro 050', status: 'PREPARANDO', type: 'ENGORDA', areaHa: 1 },
  ];

  beforeEach(() => {
    mutateAsync.mockClear();
    usePondsMock.mockReturnValue({ data: richPonds, isLoading: false });
  });

  afterEach(() => {
    usePondsMock.mockReturnValue({ data: defaultPonds, isLoading: false });
  });

  it('does not list a VAZIO pond (VE-242) as an Origem option even though it exists in the ponds list', () => {
    renderPage();

    const originValues = selectOptionValues(screen.getByLabelText('Origem'));
    expect(originValues).not.toContain('ve242');
  });

  it('does not pre-select a pond without an active cycle as the default Origem', () => {
    renderPage();

    const origin = screen.getByLabelText('Origem') as HTMLSelectElement;
    expect(origin.value).not.toBe('ve242');
    // Só há POVOADO no dataset além do VE-242 vazio: VE-100, VB-01, VB-02 —
    // o default precisa ser um desses.
    expect(['ve100', 'vb01', 'vb02']).toContain(origin.value);
  });

  it('lists every BERCARIO pond before any other type in fromOptions (Origem)', () => {
    renderPage();

    const originValues = selectOptionValues(screen.getByLabelText('Origem'));
    // Origem só aceita POVOADO: ve100, vb02, vb01 — berçário deve vir primeiro.
    expect(originValues).toEqual(['vb01', 'vb02', 've100']);
  });

  it('lists every ENGORDA pond before any other type in toOptions (Destino)', async () => {
    renderPage();

    // A origem é auto-selecionada (VB-01), então o destino exclui esse id
    // mas mantém o resto ordenado com engorda primeiro.
    await waitFor(() => expect((screen.getByLabelText('Origem') as HTMLSelectElement).value).toBe('vb01'));

    const destinationValues = selectOptionValues(screen.getByLabelText('Destino'));
    expect(destinationValues).toEqual(['ve050', 've100', 've242', 'vb02']);
  });
});

// RN-12 (spec viveiros-e-ciclos, "Ajustes — decisão sobre duplicação de
// fluxo de transferência", 2026-08-17): reproduz o incidente real
// (VB104 -> VE204, destino VAZIO ficou sem ciclo) e garante que a mitigação
// de curto prazo (bloqueio + aviso) está em vigor.
describe('TransferenciaPage - destino sem ciclo ativo (VAZIO)', () => {
  const pondsWithEmptyDestination = [
    { id: 'origin', code: 'VB-104', name: 'Berçário 104', status: 'POVOADO', type: 'BERCARIO', areaHa: 0.5 },
    { id: 'empty-dest', code: 'VE-204', name: 'Viveiro 204', status: 'VAZIO', type: 'ENGORDA', areaHa: 1 },
    { id: 'populated-dest', code: 'VE-100', name: 'Viveiro 100', status: 'POVOADO', type: 'ENGORDA', areaHa: 1 },
    { id: 'preparing-dest', code: 'VE-050', name: 'Viveiro 050', status: 'PREPARANDO', type: 'ENGORDA', areaHa: 1 },
    { id: 'despescando-dest', code: 'VE-060', name: 'Viveiro 060', status: 'DESPESCANDO', type: 'ENGORDA', areaHa: 1 },
  ];

  beforeEach(() => {
    mutateAsync.mockClear();
    usePondsMock.mockReturnValue({ data: pondsWithEmptyDestination, isLoading: false });
  });

  afterEach(() => {
    usePondsMock.mockReturnValue({ data: defaultPonds, isLoading: false });
  });

  it('shows a warning and disables submission when the selected destination is VAZIO (VB104 -> VE204 incident)', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), 'empty-dest');

    expect(await screen.findByText(/Destino sem ciclo ativo/i)).toBeInTheDocument();
    expect(screen.getByText(/VE-204 está com status Vazio/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Povoamento → Viveiro → Transferência/i })).toHaveAttribute(
      'href',
      '/povoamento',
    );

    const submitButtons = screen.getAllByRole('button', { name: /Registrar/i });
    submitButtons.forEach((button) => expect(button).toBeDisabled());

    await user.type(screen.getByLabelText('Quantidade'), '1000');
    await user.type(screen.getByLabelText('Responsável'), 'Yorvi');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['POVOADO', 'populated-dest'],
    ['PREPARANDO', 'preparing-dest'],
    ['DESPESCANDO', 'despescando-dest'],
  ])('shows no warning when the destination status is %s', async (_status, pondId) => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), pondId);

    expect(screen.queryByText(/Destino sem ciclo ativo/i)).not.toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: /Registrar transferência/i });
    expect(submitButton).not.toBeDisabled();
  });
});
