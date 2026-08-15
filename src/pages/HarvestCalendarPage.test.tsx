import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HarvestCalendarPage } from './HarvestCalendarPage';
import { pad } from './harvestCalendar';
import { queryClient } from '../lib/queryClient';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

function isoKey(day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

vi.mock('../hooks/useFeeders', () => ({
  useFeeders: () => ({
    data: [
      { id: 'feeder-1', name: 'Pedro Roger', active: true, ponds: [] },
      { id: 'feeder-2', name: 'Maria', active: true, ponds: [] },
    ],
    isLoading: false,
  }),
}));

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'V-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 1.4 },
      { id: 'p2', code: 'V-02', name: 'Viveiro 02', status: 'POVOADO', type: 'ENGORDA', areaHa: 1.2 },
    ],
    isLoading: false,
  }),
}));

const createMutateAsync = vi.fn().mockResolvedValue({ id: 'hs-new' });
const updateMutateAsync = vi.fn().mockResolvedValue({ id: 'hs-1' });
const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
const listParams: Record<string, unknown>[] = [];

vi.mock('../hooks/useHarvestSchedules', () => ({
  useHarvestSchedules: (params: Record<string, unknown>) => {
    listParams.push(params);
    return {
      data: [
        {
          id: 'hs-1',
          pondId: 'p1',
          cycleId: 'c1',
          scheduledAt: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 8, 30).toISOString(),
          status: 'AGENDADA',
          note: 'Começar pela comporta norte',
          pond: { id: 'p1', code: 'V-01', name: 'Viveiro 01', areaHa: 1.4 },
          cycle: { id: 'c1', larvaeLotCode: 'L-99', plCount: 200000 },
          participants: [{ id: 'pa1', name: 'Ana', userId: null, role: 'Líder' }],
        },
        {
          id: 'hs-2',
          pondId: 'p2',
          cycleId: null,
          scheduledAt: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 6, 0).toISOString(),
          status: 'CONCLUIDA',
          note: null,
          pond: { id: 'p2', code: 'V-02', name: 'Viveiro 02', areaHa: 1.2 },
          cycle: null,
          participants: [],
        },
      ],
      isLoading: false,
    };
  },
  useCreateHarvestSchedule: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateHarvestSchedule: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useDeleteHarvestSchedule: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}));

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HarvestCalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Abre o modal de edição do agendamento das 08:30 no viveiro V-01. */
async function openFirstSchedule(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Editar despesca V-01 08:30' }));
  expect(await screen.findByRole('heading', { name: 'Editar agendamento' })).toBeInTheDocument();
}

describe('HarvestCalendarPage', () => {
  beforeEach(() => {
    createMutateAsync.mockClear();
    updateMutateAsync.mockClear();
    deleteMutateAsync.mockClear();
    listParams.length = 0;
  });

  it('renderiza o mês corrente com os agendamentos vindos da API', () => {
    renderPage();

    expect(screen.getByText('Calendário de despesca')).toBeInTheDocument();
    expect(screen.getByText('V-01')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('V-02')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    // A janela consultada cobre a grade inteira, não só os dias do mês.
    expect(listParams[0]).toMatchObject({ from: expect.any(String), to: expect.any(String) });
  });

  it('abre o modal de novo agendamento com a data do dia clicado', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: `Agendar despesca em 12/${pad(month + 1)}/${year}` }));

    expect(await screen.findByRole('heading', { name: 'Novo agendamento' })).toBeInTheDocument();
    expect(screen.getByLabelText('Data')).toHaveValue(isoKey(12));
  });

  it('envia data e hora combinadas ao criar um agendamento', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: `Agendar despesca em 12/${pad(month + 1)}/${year}` }));
    await screen.findByRole('heading', { name: 'Novo agendamento' });

    await user.selectOptions(screen.getByLabelText('Viveiro'), 'p2');
    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '07:15' } });
    await user.type(screen.getByLabelText('Participante'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledTimes(1));
    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        pondId: 'p2',
        status: 'AGENDADA',
        scheduledAt: new Date(`${isoKey(12)}T07:15:00`).toISOString(),
        participants: [{ name: 'Ana', userId: undefined, role: undefined }],
      }),
    );
  });

  it('envia a equipe inteira ao editar os participantes', async () => {
    const user = userEvent.setup();
    renderPage();

    await openFirstSchedule(user);

    await user.type(screen.getByLabelText('Participante'), 'Carla');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 'hs-1',
      data: expect.objectContaining({
        pondId: 'p1',
        scheduledAt: new Date(`${isoKey(15)}T08:30:00`).toISOString(),
        status: 'AGENDADA',
        participants: [
          { name: 'Ana', userId: undefined, role: 'Líder' },
          { name: 'Carla', userId: undefined, role: undefined },
        ],
      }),
    });
  });

  it('remove um participante da equipe antes de salvar', async () => {
    const user = userEvent.setup();
    renderPage();

    await openFirstSchedule(user);

    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledTimes(1));
    expect(updateMutateAsync.mock.calls[0][0].data.participants).toEqual([]);
  });

  it('exclui o agendamento após a confirmação', async () => {
    const user = userEvent.setup();
    renderPage();

    await openFirstSchedule(user);

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledTimes(1));
    expect(deleteMutateAsync).toHaveBeenCalledWith('hs-1');
  });

  it('navega entre os meses', async () => {
    const user = userEvent.setup();
    renderPage();

    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const proximo = new Date(year, month + 1, 1);

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));

    expect(
      screen.getByText(`${meses[proximo.getMonth()]} de ${proximo.getFullYear()}`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(screen.getByText(`${meses[month]} de ${year}`)).toBeInTheDocument();
  });

  it('mostra os dias da semana da grade mensal', () => {
    renderPage();

    const grade = screen.getByText('Dom').parentElement as HTMLElement;
    expect(within(grade).getByText('Sáb')).toBeInTheDocument();
  });


  it('escala um arraçoador cadastrado mantendo o vínculo', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: `Agendar despesca em 15/${pad(month + 1)}/${year}` }));
    await user.click(screen.getByRole('button', { name: 'Pedro Roger' }));
    await user.selectOptions(screen.getByLabelText('Viveiro'), 'p2');
    await user.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const payload = createMutateAsync.mock.calls[0][0];
    expect(payload.participants).toEqual([
      expect.objectContaining({ name: 'Pedro Roger', feederId: 'feeder-1' }),
    ]);
  });

  it('continua aceitando um nome digitado, sem arraçoador por trás', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: `Agendar despesca em 15/${pad(month + 1)}/${year}` }));
    await user.type(screen.getByLabelText('Participante'), 'Diarista');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    await user.selectOptions(screen.getByLabelText('Viveiro'), 'p2');
    await user.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    const payload = createMutateAsync.mock.calls[0][0];
    expect(payload.participants).toEqual([expect.objectContaining({ name: 'Diarista' })]);
    expect(payload.participants[0].feederId ?? null).toBeNull();
  });
});
