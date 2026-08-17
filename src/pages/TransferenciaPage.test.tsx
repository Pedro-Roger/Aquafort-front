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

// RN-12/RF-20/RF-21 (spec viveiros-e-ciclos, "Ajustes — plano técnico de
// unificação do fluxo de transferência", 2026-08-17): reproduz o incidente
// real (VB104 -> VE204, destino VAZIO) e confirma que a mitigação de curto
// prazo (bloqueio + aviso) saiu — o backend agora cria o ciclo de destino
// automaticamente, então a submissão não pode mais ser barrada por isso.
describe('TransferenciaPage - destino sem ciclo ativo (VAZIO) deixa de ser bloqueado', () => {
  const pondsWithEmptyDestination = [
    { id: 'origin', code: 'VB-104', name: 'Berçário 104', status: 'POVOADO', type: 'BERCARIO', areaHa: 0.5 },
    { id: 'empty-dest', code: 'VE-204', name: 'Viveiro 204', status: 'VAZIO', type: 'ENGORDA', areaHa: 1 },
    { id: 'populated-dest', code: 'VE-100', name: 'Viveiro 100', status: 'POVOADO', type: 'ENGORDA', areaHa: 1 },
  ];

  beforeEach(() => {
    mutateAsync.mockClear();
    usePondsMock.mockReturnValue({ data: pondsWithEmptyDestination, isLoading: false });
  });

  afterEach(() => {
    usePondsMock.mockReturnValue({ data: defaultPonds, isLoading: false });
  });

  it('no longer shows a warning or disables submission when the selected destination is VAZIO (VB104 -> VE204 incident)', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), 'empty-dest');

    expect(screen.queryByText(/Destino sem ciclo ativo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Povoamento → Viveiro → Transferência/i })).not.toBeInTheDocument();

    const submitButtons = screen.getAllByRole('button', { name: /Registrar/i });
    submitButtons.forEach((button) => expect(button).not.toBeDisabled());

    await user.type(screen.getByLabelText('Quantidade'), '1000');
    await user.type(screen.getByLabelText('Responsável'), 'Yorvi');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ fromPondId: 'origin', toPondId: 'empty-dest', quantity: 1000 }),
    );
  });
});

// RF-13/plano técnico: campo de peso troca de unidade conforme o tipo do
// viveiro de origem (RN-10) — bercario mede em PL/g, os demais tipos em
// gramas — e nunca força um valor no payload quando não preenchido.
describe('TransferenciaPage - peso médio / PL-g opcional', () => {
  const pondsByOriginType = [
    { id: 'bercario-origin', code: 'VB-01', name: 'Berçário 01', status: 'POVOADO', type: 'BERCARIO', areaHa: 0.5 },
    { id: 'engorda-origin', code: 'VE-01', name: 'Engorda 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 1 },
    { id: 'dest', code: 'VE-02', name: 'Engorda 02', status: 'POVOADO', type: 'ENGORDA', areaHa: 1 },
  ];

  beforeEach(() => {
    mutateAsync.mockClear();
    usePondsMock.mockReturnValue({ data: pondsByOriginType, isLoading: false });
  });

  afterEach(() => {
    usePondsMock.mockReturnValue({ data: defaultPonds, isLoading: false });
  });

  it('shows PL/grama as the weight label when the origin pond is BERCARIO', async () => {
    renderPage();

    await waitFor(() =>
      expect((screen.getByLabelText('Origem') as HTMLSelectElement).value).toBe('bercario-origin'),
    );

    expect(screen.getByLabelText('PL/grama')).toBeInTheDocument();
    expect(screen.queryByLabelText('Peso médio (g)')).not.toBeInTheDocument();
  });

  it('shows Peso médio (g) as the weight label when the origin pond is not BERCARIO', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Origem'), 'engorda-origin');

    expect(screen.getByLabelText('Peso médio (g)')).toBeInTheDocument();
    expect(screen.queryByLabelText('PL/grama')).not.toBeInTheDocument();
  });

  it('does not include averageWeightG in the payload when the weight field is left empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Origem'), 'engorda-origin');
    await user.selectOptions(screen.getByLabelText('Destino'), 'dest');
    await user.type(screen.getByLabelText('Quantidade'), '500');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('averageWeightG');
  });

  it('converts grams input to averageWeightG in the payload when the origin is not BERCARIO', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Origem'), 'engorda-origin');
    await user.selectOptions(screen.getByLabelText('Destino'), 'dest');
    await user.type(screen.getByLabelText('Quantidade'), '500');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');
    await user.type(screen.getByLabelText('Peso médio (g)'), '12.5');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ averageWeightG: 12.5 }));
  });

  it('converts PL/grama input to averageWeightG in the payload when the origin is BERCARIO', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect((screen.getByLabelText('Origem') as HTMLSelectElement).value).toBe('bercario-origin'),
    );
    await user.selectOptions(screen.getByLabelText('Destino'), 'dest');
    await user.type(screen.getByLabelText('Quantidade'), '500');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');
    await user.type(screen.getByLabelText('PL/grama'), '250');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    // RN-09: avg_weight_g = 1 / pl_por_grama -> 1 / 250 = 0.004
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ averageWeightG: 0.004 }));
  });
});

// RF-21/plano técnico: seletor "Tipo de transferência" (Parcial | Total)
// envia closesOriginCycle só quando o operador de fato mexeu no seletor —
// mesmo padrão visual de HarvestType/closesCycle em OperationalReportsPage.tsx,
// mas sem pré-selecionar um valor fixo, já que esta tela não tem, hoje,
// nenhuma consulta com a população restante do ciclo de origem calculada
// (achado do revisor: um "Total" que esvazia o viveiro de origem, mas fica
// sem o operador tocar no seletor, não pode virar silenciosamente
// closesOriginCycle: false — repetiria o incidente VB104/VE204 por default
// de UI). Quando o campo não é enviado, o backend aplica o próprio default
// de RF-21 (quantity >= população restante -> true).
describe('TransferenciaPage - seletor Parcial/Total (closesOriginCycle)', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
    usePondsMock.mockReturnValue({ data: defaultPonds, isLoading: false });
  });

  it('does not send closesOriginCycle when the operator never touched the "Tipo de transferência" selector', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), 'p2');
    await user.type(screen.getByLabelText('Quantidade'), '1200');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('closesOriginCycle');
  });

  it('sends closesOriginCycle: false once the operator explicitly picks "Parcial"', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), 'p2');
    await user.selectOptions(screen.getByLabelText('Tipo de transferência'), 'TOTAL');
    await user.selectOptions(screen.getByLabelText('Tipo de transferência'), 'PARTIAL');
    await user.type(screen.getByLabelText('Quantidade'), '1200');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ closesOriginCycle: false }));
  });

  it('sends closesOriginCycle: true when the operator explicitly picks "Total"', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Destino'), 'p2');
    await user.selectOptions(screen.getByLabelText('Tipo de transferência'), 'TOTAL');
    await user.type(screen.getByLabelText('Quantidade'), '1200');
    await user.type(screen.getByLabelText('Responsável'), 'Maria');
    await user.click(screen.getByRole('button', { name: /Registrar transferência/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ closesOriginCycle: true }));
  });
});
