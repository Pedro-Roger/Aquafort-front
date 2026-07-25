import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MaterialsPage } from './MaterialsPage';

const registerMutate = vi.fn().mockResolvedValue({});
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

vi.mock('../hooks/useMaterials', () => ({
  useMaterials: () => ({
    data: [{ id: 'mat-1', name: 'Cal virgem', unit: 'KG', unitPrice: 2.5, packageWeightKg: 25, active: true }],
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
});
