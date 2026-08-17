import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BiometricSection } from './BiometricSection';

const { useBiometricsMock, createBioMutateAsync } = vi.hoisted(() => ({
  useBiometricsMock: vi.fn(),
  createBioMutateAsync: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../hooks/useBiometrics', () => ({
  useBiometrics: (...args: unknown[]) => useBiometricsMock(...args),
  useCreateBiometric: () => ({ mutateAsync: createBioMutateAsync, isPending: false }),
  useDeleteBiometric: () => ({ mutate: vi.fn(), isPending: false }),
}));

beforeEach(() => {
  useBiometricsMock.mockReset();
  useBiometricsMock.mockReturnValue({ data: [], isLoading: false });
  createBioMutateAsync.mockClear();
  createBioMutateAsync.mockResolvedValue({});
});

describe('BiometricSection — RF-16: "Amostras" field removed', () => {
  it('does not render an "AMOSTRAS" field in the inline form', () => {
    render(<BiometricSection cycleId="c1" />);

    fireEvent.click(screen.getByText('+ Registrar'));

    expect(screen.queryByText('AMOSTRAS')).not.toBeInTheDocument();
    expect(screen.getByText('PESO MÉDIO (g)')).toBeInTheDocument();
  });

  it('saves without requiring sampleCount and never sends it in the payload', async () => {
    const { container } = render(<BiometricSection cycleId="c1" />);

    fireEvent.click(screen.getByText('+ Registrar'));

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-08-17' } });
    fireEvent.change(screen.getByPlaceholderText('5.5'), { target: { value: '12.5' } });

    fireEvent.click(screen.getByText('Salvar biometria'));

    expect(createBioMutateAsync).toHaveBeenCalledTimes(1);
    const payload = createBioMutateAsync.mock.calls[0][0];
    expect(payload).not.toHaveProperty('sampleCount');
    expect(payload.averageWeightG).toBe(12.5);
  });

  it('shows the reading date without "amostras: undefined" when sampleCount is null', () => {
    useBiometricsMock.mockReturnValue({
      data: [
        { id: 'b1', cycleId: 'c1', measuredAt: '2026-08-10T00:00:00.000Z', averageWeightG: 15, sampleCount: null, survivalRatePct: null },
      ],
      isLoading: false,
    });

    render(<BiometricSection cycleId="c1" />);

    expect(screen.queryByText(/amostras/)).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('still shows the sample count when it is present (historical readings)', () => {
    useBiometricsMock.mockReturnValue({
      data: [
        { id: 'b1', cycleId: 'c1', measuredAt: '2026-08-10T00:00:00.000Z', averageWeightG: 15, sampleCount: 30, survivalRatePct: null },
      ],
      isLoading: false,
    });

    render(<BiometricSection cycleId="c1" />);

    expect(screen.getByText(/30 amostras/)).toBeInTheDocument();
  });
});
