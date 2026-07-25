import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MaterialsPage } from './MaterialsPage';

const registerMutate = vi.fn().mockResolvedValue({});
const createMutate = vi.fn().mockResolvedValue({});
const updateMutate = vi.fn().mockResolvedValue({});
const addStockMutate = vi.fn().mockResolvedValue({});

vi.mock('../hooks/usePonds', () => ({
  usePonds: () => ({
    data: [
      { id: 'p1', code: 'VE-01', name: 'Viveiro 01', status: 'POVOADO', type: 'ENGORDA', areaHa: 3 },
      { id: 'p2', code: 'BRC-01', name: 'Berçário 01', status: 'VAZIO', type: 'BERCARIO', areaHa: 0.05 },
    ],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useMaterials', () => ({
  useMaterials: () => ({
    data: [{ id: 'mat-1', name: 'Cal virgem', unit: 'KG', unitPrice: 2.5, packageWeightKg: 25, stockQuantity: 120, active: true }],
    isLoading: false,
  }),
  useMaterialUsages: () => ({
    data: [
      {
        id: 'u1',
        pondId: 'p1',
        materialId: 'mat-1',
        quantity: 40,
        totalCost: 100,
        usedAt: '2026-07-20T10:00:00.000Z',
        responsible: 'João',
        pond: { id: 'p1', code: 'VE-01', name: 'Viveiro 01' },
        material: { id: 'mat-1', name: 'Cal virgem', unit: 'KG', unitPrice: 2.5 },
      },
    ],
    isLoading: false,
  }),
  useCreateMaterial: () => ({ mutateAsync: createMutate, isPending: false }),
  useUpdateMaterial: () => ({ mutateAsync: updateMutate, isPending: false }),
  useAddStock: () => ({ mutateAsync: addStockMutate, isPending: false }),
  useRegisterUsage: () => ({ mutateAsync: registerMutate, isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MaterialsPage />
    </MemoryRouter>,
  );
}

describe('MaterialsPage', () => {
  beforeEach(() => {
    registerMutate.mockClear();
    createMutate.mockClear();
    updateMutate.mockClear();
    addStockMutate.mockClear();
  });

  it('shows what each pond already consumed', () => {
    renderPage();

    expect(screen.getByText(/1 lançamento\(s\)/)).toBeInTheDocument();
    expect(screen.getByText('Nenhum material lançado ainda.')).toBeInTheDocument();
  });

  it('opens the usage form for the pond that was clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /VE-01/ }));

    expect(await screen.findByText('Material utilizado — VE-01')).toBeInTheDocument();
  });

  it('prices the line from the quantity before saving', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /VE-01/ }));
    await user.selectOptions(screen.getByLabelText('Material'), 'mat-1');
    await user.type(screen.getByLabelText(/Quantidade/), '40');

    // 40 kg x R$ 2,50
    expect(await screen.findByText(/Custo do lançamento: R\$\s*100,00/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Registrar uso' }));

    await waitFor(() => expect(registerMutate).toHaveBeenCalledTimes(1));
    expect(registerMutate).toHaveBeenCalledWith(
      expect.objectContaining({ pondId: 'p1', materialId: 'mat-1', quantity: 40 }),
    );
  });

  it('refuses to register without a material and a quantity', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /VE-01/ }));
    await user.click(screen.getByRole('button', { name: 'Registrar uso' }));

    expect(await screen.findByText('Escolha o material e informe a quantidade.')).toBeInTheDocument();
    expect(registerMutate).not.toHaveBeenCalled();
  });

  it('shows what is on hand for each product', () => {
    renderPage();

    expect(screen.getByText('Em estoque')).toBeInTheDocument();
    expect(screen.getByText(/120,00 kg/)).toBeInTheDocument();
  });

  it('saves a corrected price', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Editar preço' }));
    const field = screen.getByLabelText(/Preço por kg/);
    await user.clear(field);
    await user.type(field, '3.1');
    await user.click(screen.getByRole('button', { name: 'Salvar preço' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate).toHaveBeenCalledWith({ id: 'mat-1', data: { unitPrice: 3.1 } });
  });

  it('adds a stock entry instead of overwriting the balance', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Lançar entrada' }));
    await user.type(screen.getByLabelText('Quantidade recebida'), '200');
    await user.click(screen.getAllByRole('button', { name: /^Lançar entrada$/ })[1]);

    await waitFor(() => expect(addStockMutate).toHaveBeenCalledTimes(1));
    expect(addStockMutate).toHaveBeenCalledWith({ id: 'mat-1', quantity: 200 });
  });

  it('refuses a stock entry that is not above zero', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Lançar entrada' }));
    await user.type(screen.getByLabelText('Quantidade recebida'), '0');
    await user.click(screen.getAllByRole('button', { name: /^Lançar entrada$/ })[1]);

    expect(await screen.findByText('Informe uma quantidade maior que zero.')).toBeInTheDocument();
    expect(addStockMutate).not.toHaveBeenCalled();
  });
});
