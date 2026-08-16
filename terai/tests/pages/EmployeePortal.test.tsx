import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmployeePortal from '../../pages/employee/EmployeePortal';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock the service layer — never the production component. These are the exact functions
// EmployeePortal.tsx calls per Module 10's rewrite.
vi.mock('../../services/employee.service', () => ({
  employeeService: { getMyEmployee: vi.fn() },
}));
vi.mock('../../services/leave.service', () => ({
  leaveService: { getBalances: vi.fn() },
}));
vi.mock('../../services/approvalEngine.service', () => ({
  approvalEngineService: { getMine: vi.fn() },
  MODULE_LABELS: { leave_request: 'Pengajuan Cuti', overtime_request: 'Pengajuan Lembur' },
}));

import { employeeService } from '../../services/employee.service';
import { leaveService } from '../../services/leave.service';
import { approvalEngineService } from '../../services/approvalEngine.service';

const FIXTURE_EMPLOYEE = {
  id: 42,
  employeeId: 'EMP-042',
  fullName: 'Budi Santoso',
  email: 'budi@company.com',
  phone: '',
  gender: '',
  employmentType: 'permanent',
  employmentStatus: 'active',
  joinDate: '2023-01-15',
  departmentName: 'Engineering',
  positionName: 'Software Engineer',
};

function renderPortal() {
  return render(
    <ToastProvider>
      <EmployeePortal />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EmployeePortal', () => {
  it('shows a loading state before data resolves', async () => {
    (employeeService.getMyEmployee as any).mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderPortal();
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('renders real employee data from the API — no hardcoded "Sarah Johnson" / "Senior Software Engineer"', async () => {
    (employeeService.getMyEmployee as any).mockResolvedValue(FIXTURE_EMPLOYEE);
    (leaveService.getBalances as any).mockResolvedValue([
      { id: 1, employeeId: 42, leaveTypeId: 1, year: 2026, totalDays: 12, usedDays: 2, carriedForward: 0, remainingDays: 10, leaveTypeName: 'Annual Leave' },
    ]);
    (approvalEngineService.getMine as any).mockResolvedValue([]);

    renderPortal();

    await waitFor(() => expect(screen.getByText(/Budi Santoso/)).toBeInTheDocument());
    expect(screen.getByText(/Software Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/Engineering/)).toBeInTheDocument();
    expect(screen.getAllByText(/10 days/).length).toBeGreaterThan(0);

    expect(screen.queryByText(/Sarah Johnson/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Senior Software Engineer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/15,000,000/)).not.toBeInTheDocument(); // old fake salary figure
    expect(screen.queryByText(/4\.2\/5/)).not.toBeInTheDocument(); // old fake performance rating
  });

  it('shows real pending requests from approvalEngineService.getMine(), filtered to pending only', async () => {
    (employeeService.getMyEmployee as any).mockResolvedValue(FIXTURE_EMPLOYEE);
    (leaveService.getBalances as any).mockResolvedValue([]);
    (approvalEngineService.getMine as any).mockResolvedValue([
      { id: 1, moduleName: 'leave_request', referenceId: 1, requesterEmployeeId: 42, currentLevel: 1, status: 'pending', summary: '', createdAt: '2026-01-10T00:00:00Z' },
      { id: 2, moduleName: 'overtime_request', referenceId: 2, requesterEmployeeId: 42, currentLevel: 1, status: 'approved', summary: '', createdAt: '2026-01-05T00:00:00Z' },
    ]);

    renderPortal();

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument()); // Pending Requests count
    expect(screen.getByText('Pengajuan Cuti')).toBeInTheDocument();
    expect(screen.queryByText('Pengajuan Lembur')).not.toBeInTheDocument(); // approved, filtered out
  });

  it('shows an empty state when there are no pending requests', async () => {
    (employeeService.getMyEmployee as any).mockResolvedValue(FIXTURE_EMPLOYEE);
    (leaveService.getBalances as any).mockResolvedValue([]);
    (approvalEngineService.getMine as any).mockResolvedValue([]);

    renderPortal();

    await waitFor(() => expect(screen.getByText('No pending requests.')).toBeInTheDocument());
  });

  it('shows an error state with a retry button when the employee fetch fails, not a fake fallback', async () => {
    (employeeService.getMyEmployee as any).mockRejectedValue(new Error('network down'));

    renderPortal();

    await waitFor(() => expect(screen.getByText(/Gagal memuat data karyawan/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    // Never renders a profile despite the error.
    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument();
  });

  it('retry re-calls the API and recovers into the success state', async () => {
    (employeeService.getMyEmployee as any)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(FIXTURE_EMPLOYEE);
    (leaveService.getBalances as any).mockResolvedValue([]);
    (approvalEngineService.getMine as any).mockResolvedValue([]);

    renderPortal();
    await waitFor(() => expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => expect(screen.getByText(/Budi Santoso/)).toBeInTheDocument());
    expect(employeeService.getMyEmployee).toHaveBeenCalledTimes(2);
  });
});
