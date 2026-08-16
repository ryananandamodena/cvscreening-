import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OrgChart from '../../pages/organization/OrgChart';

vi.mock('../../services/organization.service', () => ({
  organizationService: { getDepartments: vi.fn() },
}));

import { organizationService } from '../../services/organization.service';

const DEPARTMENTS = [
  { id: 1, name: 'Executive', code: 'EXEC', description: '', isActive: true, headName: 'Ryan Ananda', employeeCount: 3 },
  { id: 2, name: 'Engineering', code: 'ENG', parentId: 1, description: '', isActive: true, headName: 'Jane Doe', employeeCount: 20 },
  { id: 3, name: 'Finance', code: 'FIN', parentId: 1, description: '', isActive: true, headName: '', employeeCount: 5 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OrgChart', () => {
  it('renders a real department tree from the API — no MOCK_ORG_DATA in the component', async () => {
    (organizationService.getDepartments as any).mockResolvedValue(DEPARTMENTS);

    render(<OrgChart />);

    await waitFor(() => expect(screen.getByText('Executive')).toBeInTheDocument());
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Ryan Ananda')).toBeInTheDocument();

    // No fabricated names from the removed MOCK_ORG_DATA.
    expect(screen.queryByText('Eleanor Vance')).not.toBeInTheDocument();
    expect(screen.queryByText('Dr. John Richards')).not.toBeInTheDocument();
    expect(screen.queryByText('Diana Prince')).not.toBeInTheDocument();
  });

  it('shows "No head assigned" rather than fabricating a name when headName is empty', async () => {
    (organizationService.getDepartments as any).mockResolvedValue(DEPARTMENTS);
    render(<OrgChart />);
    await waitFor(() => expect(screen.getByText('Finance')).toBeInTheDocument());
    expect(screen.getByText('No head assigned')).toBeInTheDocument();
  });

  it('computes real headcount/department-count/hierarchy-depth stats from the API data', async () => {
    (organizationService.getDepartments as any).mockResolvedValue(DEPARTMENTS);
    render(<OrgChart />);

    await waitFor(() => expect(screen.getByText('Executive')).toBeInTheDocument());
    // Total headcount = 3 + 20 + 5 = 28 (real sum, not a hardcoded "124").
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.queryByText('124')).not.toBeInTheDocument();
    // 3 departments (real count, not a hardcoded "8").
    expect(screen.getByText('3')).toBeInTheDocument();
    // Depth: Executive -> {Engineering, Finance} = 2 levels, not a hardcoded "4 Levels".
    expect(screen.getByText('2 Levels')).toBeInTheDocument();
  });

  it('shows an empty state when there are no departments', async () => {
    (organizationService.getDepartments as any).mockResolvedValue([]);
    render(<OrgChart />);
    await waitFor(() => expect(screen.getByText('No departments have been set up yet.')).toBeInTheDocument());
  });

  it('shows an error state with retry on API failure, not a fake chart', async () => {
    (organizationService.getDepartments as any).mockRejectedValue(new Error('down'));
    render(<OrgChart />);
    await waitFor(() => expect(screen.getByText(/Failed to load organization structure/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
