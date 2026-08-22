import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FarmsAdminPage } from './FarmsAdminPage';

const createMutate = vi.fn().mockResolvedValue({});
const updateMutate = vi.fn().mockResolvedValue({});

vi.mock('../hooks/useFarms', () => ({
  useFarms: () => ({
    data: [
      { id: 'f1', name: 'Fazenda Norte', cnpj: '12345678000199', location: 'Aquiraz-CE', totalHa: 12.5, timezone: 'America/Fortaleza', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'f2', name: 'Fazenda Sul', cnpj: null, location: null, totalHa: null, timezone: 'America/Fortaleza', status: 'INACTIVE', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ],
    isLoading: false,
  }),
  useCreateFarm: () => ({ mutateAsync: createMutate, isPending: false }),
  useUpdateFarm: () => ({ mutateAsync: updateMutate, isPending: false }),
}));

describe('FarmsAdminPage', () => {
  beforeEach(() => {
    createMutate.mockClear();
    updateMutate.mockClear();
  });

  it('lists the registered farms with status', () => {
    render(<FarmsAdminPage />);

    expect(screen.getByText('Fazenda Norte')).toBeInTheDocument();
    expect(screen.getByText('Fazenda Sul')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText('Inativa')).toBeInTheDocument();
  });

  it('refuses to create a farm without a name', async () => {
    const user = userEvent.setup();
    render(<FarmsAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar fazenda' }));
    await user.click(screen.getByRole('button', { name: 'Salvar fazenda' }));

    expect(await screen.findByText('Informe o nome da fazenda.')).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('creates a farm with the fields the create endpoint accepts', async () => {
    const user = userEvent.setup();
    render(<FarmsAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar fazenda' }));
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Leste');
    await user.click(screen.getByRole('button', { name: 'Salvar fazenda' }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fazenda Leste', timezone: 'America/Fortaleza' }),
    );
  });

  it('rejects an invalid CNPJ before calling the API', async () => {
    const user = userEvent.setup();
    render(<FarmsAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar fazenda' }));
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Leste');
    await user.type(screen.getByLabelText('CNPJ (opcional)'), '123');
    await user.click(screen.getByRole('button', { name: 'Salvar fazenda' }));

    expect(await screen.findByText('CNPJ deve conter 14 dígitos numéricos.')).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('edits a farm without offering cnpj/legalName fields (backend does not accept them on PATCH)', async () => {
    const user = userEvent.setup();
    render(<FarmsAdminPage />);

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(screen.queryByLabelText('CNPJ (opcional)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Razão social (opcional)')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(updateMutate).toHaveBeenCalledWith({
      id: 'f1',
      data: expect.objectContaining({ name: 'Fazenda Norte', status: 'ACTIVE' }),
    });
  });

  it('surfaces the backend message when creating a farm fails', async () => {
    createMutate.mockRejectedValueOnce({ response: { data: { message: 'CNPJ já cadastrado.' } } });
    const user = userEvent.setup();
    render(<FarmsAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar fazenda' }));
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Leste');
    await user.click(screen.getByRole('button', { name: 'Salvar fazenda' }));

    expect(await screen.findByText('CNPJ já cadastrado.')).toBeInTheDocument();
  });

  it('falls back to a generic message when creating a farm fails without a backend message', async () => {
    createMutate.mockRejectedValueOnce(new Error('network error'));
    const user = userEvent.setup();
    render(<FarmsAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Cadastrar fazenda' }));
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Leste');
    await user.click(screen.getByRole('button', { name: 'Salvar fazenda' }));

    expect(await screen.findByText('network error')).toBeInTheDocument();
  });

  it('surfaces the backend message when updating a farm fails', async () => {
    updateMutate.mockRejectedValueOnce({ response: { data: { message: 'Fazenda inativa não pode ser editada.' } } });
    const user = userEvent.setup();
    render(<FarmsAdminPage />);

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Fazenda inativa não pode ser editada.')).toBeInTheDocument();
  });
});
