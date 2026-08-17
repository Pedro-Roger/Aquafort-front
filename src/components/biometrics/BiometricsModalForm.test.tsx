import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BiometricsModalForm } from './BiometricsModalForm';

function fillCommonFields(sampleCount: string) {
  return userEvent.type(screen.getByLabelText('Amostras'), sampleCount);
}

describe('BiometricsModalForm — RF-10 (revisado)/RN-12: toggle PL/g ⇄ Peso médio (g)', () => {
  it('opens a bercario cycle with PL/g pre-selected by default', () => {
    render(
      <BiometricsModalForm
        open
        onClose={vi.fn()}
        pondCode="B-02"
        isBercario
        onSubmit={vi.fn()}
      />,
    );

    const plButton = screen.getByRole('button', { name: 'PL/g' });
    const pesoButton = screen.getByRole('button', { name: 'Peso (g)' });
    expect(plButton).toHaveAttribute('aria-pressed', 'true');
    expect(pesoButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('PL/grama')).toBeInTheDocument();
    expect(screen.queryByLabelText('Peso médio (g)')).not.toBeInTheDocument();
  });

  it('switching to "Peso (g)" swaps the visible field and converts the typed value — never both fields at once (RN-12)', async () => {
    const user = userEvent.setup();
    render(
      <BiometricsModalForm
        open
        onClose={vi.fn()}
        pondCode="B-02"
        isBercario
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('PL/grama'), '250');
    await user.click(screen.getByRole('button', { name: 'Peso (g)' }));

    expect(screen.queryByLabelText('PL/grama')).not.toBeInTheDocument();
    const weightField = screen.getByLabelText('Peso médio (g)') as HTMLInputElement;
    expect(weightField.value).toBe('0.004');

    // Switching back converts again instead of leaving a stale value.
    await user.click(screen.getByRole('button', { name: 'PL/g' }));
    const plField = screen.getByLabelText('PL/grama') as HTMLInputElement;
    expect(plField.value).toBe('250');
  });

  it('persists averageWeightG correctly when entered in PL/g', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BiometricsModalForm
        open
        onClose={vi.fn()}
        pondCode="B-02"
        isBercario
        onSubmit={onSubmit}
      />,
    );

    await fillCommonFields('20');
    await user.type(screen.getByLabelText('PL/grama'), '250');
    await user.click(screen.getByText('Salvar leitura'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.averageWeightG).toBeCloseTo(0.004, 6);
  });

  it('persists averageWeightG correctly when entered directly in grams (office launch, RF-10 reabertura)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BiometricsModalForm
        open
        onClose={vi.fn()}
        pondCode="B-02"
        isBercario
        onSubmit={onSubmit}
      />,
    );

    await fillCommonFields('20');
    await user.click(screen.getByRole('button', { name: 'Peso (g)' }));
    await user.type(screen.getByLabelText('Peso médio (g)'), '0.29');
    await user.click(screen.getByText('Salvar leitura'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    // RF-11: no RN-09 formula applied — stored exactly as typed.
    expect(payload.averageWeightG).toBe(0.29);
  });

  it('shows no toggle for engorda/reprodutor cycles — behavior unchanged, grams only', () => {
    render(
      <BiometricsModalForm
        open
        onClose={vi.fn()}
        pondCode="V-01"
        isBercario={false}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByRole('group', { name: 'Unidade de entrada' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'PL/g' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Peso médio (g)')).toBeInTheDocument();
  });

  it('persists averageWeightG as typed for engorda cycles, no conversion', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BiometricsModalForm
        open
        onClose={vi.fn()}
        pondCode="V-01"
        isBercario={false}
        onSubmit={onSubmit}
      />,
    );

    await fillCommonFields('10');
    await user.type(screen.getByLabelText('Peso médio (g)'), '12.5');
    await user.click(screen.getByText('Salvar leitura'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].averageWeightG).toBe(12.5);
  });
});
