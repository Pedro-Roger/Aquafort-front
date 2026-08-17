import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectablePondChips } from './SelectablePondChips';
import { PondStatus, PondType } from '../../types';
import type { Pond } from '../../types';

function makePond(overrides: Partial<Pond> & { id: string; code: string }): Pond {
  return {
    name: overrides.code,
    type: PondType.BERCARIO,
    status: PondStatus.VAZIO,
    areaHa: 1,
    volumeM3: 100,
    farmId: 'farm-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const ponds: Pond[] = [
  makePond({ id: '1', code: 'VB101' }),
  makePond({ id: '2', code: 'VB102' }),
  makePond({ id: '3', code: 'VB201' }),
];

describe('SelectablePondChips', () => {
  it('shows "Sem viveiros cadastrados." when there are no ponds', () => {
    render(<SelectablePondChips ponds={[]} selectedIds={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText('Sem viveiros cadastrados.')).toBeInTheDocument();
  });

  it('renders every pond without pagination controls', () => {
    render(<SelectablePondChips ponds={ponds} selectedIds={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'VB101' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VB102' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VB201' })).toBeInTheDocument();
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByText('Próxima')).not.toBeInTheDocument();
  });

  it('filters the list by pond code as the user types in "Procurar"', async () => {
    const user = userEvent.setup();
    render(<SelectablePondChips ponds={ponds} selectedIds={new Set()} onToggle={vi.fn()} />);

    await user.type(screen.getByLabelText('Procurar'), 'VB1');

    expect(screen.getByRole('button', { name: 'VB101' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VB102' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'VB201' })).not.toBeInTheDocument();
  });

  it('shows a "nenhum resultado" message when the search matches nothing', async () => {
    const user = userEvent.setup();
    render(<SelectablePondChips ponds={ponds} selectedIds={new Set()} onToggle={vi.fn()} />);

    await user.type(screen.getByLabelText('Procurar'), 'ZZZ');

    expect(screen.getByText('Nenhum viveiro encontrado para "ZZZ".')).toBeInTheDocument();
  });

  it('allows selecting multiple items simultaneously', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(<SelectablePondChips ponds={ponds} selectedIds={new Set()} onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: 'VB101' }));
    expect(onToggle).toHaveBeenCalledWith('1');

    rerender(<SelectablePondChips ponds={ponds} selectedIds={new Set(['1'])} onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'VB102' }));
    expect(onToggle).toHaveBeenCalledWith('2');

    rerender(<SelectablePondChips ponds={ponds} selectedIds={new Set(['1', '2'])} onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: 'VB101' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'VB102' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'VB201' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps a previous selection when searching for another item, and after clearing the search back to empty', async () => {
    const user = userEvent.setup();
    const searchBox = () => screen.getByLabelText('Procurar');
    render(<SelectablePondChips ponds={ponds} selectedIds={new Set(['1'])} onToggle={vi.fn()} />);

    await user.type(searchBox(), 'VB1');

    expect(screen.getByRole('button', { name: 'VB101' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'VB102' })).toHaveAttribute('aria-pressed', 'false');

    // The real regression scenario: clearing the search back to empty must not clear the selection.
    await user.clear(searchBox());

    expect(screen.getByRole('button', { name: 'VB101' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'VB102' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'VB201' })).toHaveAttribute('aria-pressed', 'false');
  });
});
