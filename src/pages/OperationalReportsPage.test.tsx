import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OperationalReportsPage } from './OperationalReportsPage';

const exportReport = vi.fn();

vi.mock('../hooks/useOperationalReports', () => ({
  useOperationalReports: () => ({
    data: {
      summary: {
        feedInKg: 1200,
        feedOutKg: 850,
        partialHarvests: 2,
        totalHarvests: 1,
      },
      rows: [
        {
          phase: 'BERCARIOS',
          label: 'PBC01',
          cycleLabel: 'Ciclo 01',
          feedInKg: 120,
          feedOutKg: 80,
          partialHarvests: 1,
          totalHarvests: 0,
        },
      ],
    },
    isLoading: false,
  }),
  useExportOperationalReports: () => ({
    mutateAsync: exportReport,
    isPending: false,
  }),
  useCreateHarvestRecord: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('OperationalReportsPage', () => {
  it('renders phase groups and triggers export', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OperationalReportsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /relatórios operacionais/i })).toBeInTheDocument();
    expect(screen.getAllByText('Berçários').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Viveiros').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reprodutores').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /exportar excel/i }));

    expect(exportReport).toHaveBeenCalled();
  });
});
