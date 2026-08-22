import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserFarmRolesPage } from './UserFarmRolesPage';

const linkMutate = vi.fn().mockResolvedValue({});
const unlinkMutate = vi.fn().mockResolvedValue({});

vi.mock('../hooks/useFarms', () => ({
  useFarms: () => ({
    data: [
      { id: 'f1', name: 'Fazenda Norte', timezone: 'America/Fortaleza', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'f2', name: 'Fazenda Sul', timezone: 'America/Fortaleza', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useUsers', () => ({
  useUsers: () => ({
    data: [
      { id: 'u1', name: 'João', email: 'joao@aq.com', role: 'TECNICO', createdAt: '2026-01-01' },
      { id: 'u2', name: 'Maria', email: 'maria@aq.com', role: 'OPERADOR', createdAt: '2026-01-01' },
    ],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useUserFarmRoles', () => ({
  useLinkUserFarmRole: () => ({ mutateAsync: linkMutate, isPending: false }),
  useUnlinkUserFarmRole: () => ({ mutateAsync: unlinkMutate, isPending: false }),
}));

describe('UserFarmRolesPage', () => {
  beforeEach(() => {
    linkMutate.mockClear();
    unlinkMutate.mockClear();
  });

  it('links a user to a farm with the chosen role', async () => {
    const user = userEvent.setup();
    render(<UserFarmRolesPage />);

    const [farmSelect] = screen.getAllByLabelText('Fazenda');
    const [userSelect] = screen.getAllByLabelText('Usuário');
    await user.selectOptions(farmSelect, 'f1');
    await user.selectOptions(userSelect, 'u1');
    await user.selectOptions(screen.getByLabelText('Papel na fazenda'), 'TECNICO');
    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(linkMutate).toHaveBeenCalledWith({ farmId: 'f1', userId: 'u1', role: 'TECNICO' });
    expect(await screen.findByText('Usuário vinculado com sucesso.')).toBeInTheDocument();
  });

  it('refuses to link without picking both a farm and a user', async () => {
    const user = userEvent.setup();
    render(<UserFarmRolesPage />);

    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(await screen.findByText('Escolha a fazenda e o usuário.')).toBeInTheDocument();
    expect(linkMutate).not.toHaveBeenCalled();
  });

  it('surfaces the backend conflict message when the user is already linked', async () => {
    const user = userEvent.setup();
    linkMutate.mockRejectedValueOnce({ response: { data: { message: 'Usuário já vinculado a esta fazenda' } } });
    render(<UserFarmRolesPage />);

    const [farmSelect] = screen.getAllByLabelText('Fazenda');
    const [userSelect] = screen.getAllByLabelText('Usuário');
    await user.selectOptions(farmSelect, 'f1');
    await user.selectOptions(userSelect, 'u1');
    await user.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(await screen.findByText('Usuário já vinculado a esta fazenda')).toBeInTheDocument();
  });

  it('unlinks a user from a farm', async () => {
    const user = userEvent.setup();
    render(<UserFarmRolesPage />);

    const [, unlinkFarmSelect] = screen.getAllByLabelText('Fazenda');
    const [, unlinkUserSelect] = screen.getAllByLabelText('Usuário');
    await user.selectOptions(unlinkFarmSelect, 'f2');
    await user.selectOptions(unlinkUserSelect, 'u2');
    await user.click(screen.getByRole('button', { name: 'Desvincular' }));

    expect(unlinkMutate).toHaveBeenCalledWith({ farmId: 'f2', userId: 'u2' });
    expect(await screen.findByText('Usuário desvinculado com sucesso.')).toBeInTheDocument();
  });
});
