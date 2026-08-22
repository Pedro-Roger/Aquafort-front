import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FarmSwitcher } from './FarmSwitcher';

const switchFarm = vi.fn().mockResolvedValue(undefined);
const useFarmMock = vi.fn();

vi.mock('../../hooks/useFarm', () => ({
  useFarm: () => useFarmMock(),
}));

function baseFarmState(overrides: Record<string, unknown> = {}) {
  return {
    farms: [
      { farmId: 'f1', farmName: 'Fazenda Norte', role: 'OPERADOR', status: 'ACTIVE' },
      { farmId: 'f2', farmName: 'Fazenda Sul', role: 'TECNICO', status: 'ACTIVE' },
    ],
    farmsLoading: false,
    activeFarmId: 'f1',
    activeFarmName: 'Fazenda Norte',
    activeFarmRole: 'OPERADOR',
    isSwitchingFarm: false,
    switchFarm,
    ...overrides,
  };
}

describe('FarmSwitcher', () => {
  beforeEach(() => {
    switchFarm.mockClear();
    useFarmMock.mockReset();
  });

  it('shows the active farm name and effective role', () => {
    useFarmMock.mockReturnValue(baseFarmState());
    render(<FarmSwitcher />);

    expect(screen.getByText('Fazenda Norte')).toBeInTheDocument();
    expect(screen.getByText('Operador')).toBeInTheDocument();
  });

  it('opens the dropdown and switches to the farm the user picks', async () => {
    const user = userEvent.setup();
    useFarmMock.mockReturnValue(baseFarmState());
    render(<FarmSwitcher />);

    await user.click(screen.getByTitle('Trocar de fazenda'));
    await user.click(screen.getByTestId('farm-option-f2'));

    expect(switchFarm).toHaveBeenCalledWith('f2');
  });

  it('filters the farm list as the user types (busca incremental)', async () => {
    const user = userEvent.setup();
    useFarmMock.mockReturnValue(baseFarmState());
    render(<FarmSwitcher />);

    await user.click(screen.getByTitle('Trocar de fazenda'));
    await user.type(screen.getByPlaceholderText('Buscar fazenda...'), 'sul');

    expect(screen.queryByTestId('farm-option-f1')).not.toBeInTheDocument();
    expect(screen.getByTestId('farm-option-f2')).toBeInTheDocument();
  });

  it('does not call switchFarm when reselecting the already active farm', async () => {
    const user = userEvent.setup();
    useFarmMock.mockReturnValue(baseFarmState());
    render(<FarmSwitcher />);

    await user.click(screen.getByTitle('Trocar de fazenda'));
    await user.click(screen.getByTestId('farm-option-f1'));

    expect(switchFarm).not.toHaveBeenCalled();
  });

  it('renders as a plain label, without a dropdown trigger, when the user only has one farm', () => {
    useFarmMock.mockReturnValue(
      baseFarmState({ farms: [{ farmId: 'f1', farmName: 'Fazenda Norte', role: 'OPERADOR', status: 'ACTIVE' }] }),
    );
    render(<FarmSwitcher />);

    expect(screen.getByText('Fazenda Norte')).toBeInTheDocument();
    expect(screen.queryByTitle('Trocar de fazenda')).not.toBeInTheDocument();
  });
});
