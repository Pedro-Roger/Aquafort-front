import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CycleWorkspacePanel } from './CycleWorkspacePanel';

describe('CycleWorkspacePanel', () => {
  it('renders the cycle panel and forwards selection changes', async () => {
    const user = userEvent.setup();
    const onCycleChange = vi.fn();

    render(
      <CycleWorkspacePanel
        eyebrow="Ciclo ativo"
        title="Painel de leitura"
        description="Resumo do ciclo"
        cycleOptions={[
          { value: 'cycle-1', label: 'Tanque 1' },
          { value: 'cycle-2', label: 'Tanque 2' },
        ]}
        selectedCycleId="cycle-1"
        onCycleChange={onCycleChange}
        metrics={[
          { label: 'Leituras', value: '5', detail: 'salvas' },
          { label: 'Última', value: '09/07/2026' },
        ]}
        actions={[
          { label: 'Nova leitura', kind: 'primary', onClick: vi.fn() },
        ]}
        status={{ tone: 'success', text: 'Projeção atualizada às 13:57.' }}
      />,
    );

    expect(screen.getByText('Painel de leitura')).toBeInTheDocument();
    expect(screen.getByText('Projeção atualizada às 13:57.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Ciclo ativo'), 'cycle-2');
    expect(onCycleChange).toHaveBeenCalledWith('cycle-2');
  });
});
