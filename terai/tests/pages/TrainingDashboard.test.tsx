import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrainingDashboard from '../../pages/training/TrainingDashboard';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../guards/AuthGuard';
import { fakeTokenForRole } from '../fixtures/auth';

vi.mock('../../services/training.service', () => ({
  trainingService: { getPrograms: vi.fn(), getEmployeeTrainings: vi.fn(), enrollEmployee: vi.fn() },
}));
vi.mock('../../services/employee.service', () => ({
  employeeService: { getMyEmployee: vi.fn() },
}));

import { trainingService } from '../../services/training.service';
import { employeeService } from '../../services/employee.service';

const CERT_PROGRAM = { id: 1, title: 'React Development', description: 'Learn React', category: 'Tech', duration: 20, cost: 0, provider: 'Internal', maxParticipants: 30, prerequisites: [], skills: [], certification: true, format: 'online', level: 'intermediate', language: 'en', active: true, createdAt: '', updatedAt: '' };
const NON_CERT_PROGRAM = { id: 2, title: 'Team Lunch Etiquette', description: 'Soft skills', category: 'Soft Skills', duration: 2, cost: 0, provider: 'Internal', maxParticipants: 30, prerequisites: [], skills: [], certification: false, format: 'offline', level: 'beginner', language: 'en', active: true, createdAt: '', updatedAt: '' };

function renderDashboard() {
  return render(
    <AuthProvider>
      <ToastProvider>
        <TrainingDashboard />
      </ToastProvider>
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Default to a plain self-service role unless a test overrides it — matches the common case
  // (enrollment/catalog-browsing), while the RBAC UX tests below set 'admin'/'recruiter'.
  localStorage.setItem('access_token', fakeTokenForRole('viewer'));
});

describe('TrainingDashboard', () => {
  it('loads and lists real training programs from the API', async () => {
    (trainingService.getPrograms as any).mockResolvedValue([CERT_PROGRAM, NON_CERT_PROGRAM]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => expect(screen.getByText('React Development')).toBeInTheDocument());
    expect(screen.getByText('Team Lunch Etiquette')).toBeInTheDocument();
  });

  it('shows an empty state when no programs match', async () => {
    (trainingService.getPrograms as any).mockResolvedValue([]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => expect(screen.getByText('No training programs found')).toBeInTheDocument());
  });

  it('resolves the real employee id (not hardcoded 1) before enrolling', async () => {
    (trainingService.getPrograms as any).mockResolvedValue([CERT_PROGRAM]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([]);
    (employeeService.getMyEmployee as any).mockResolvedValue({ id: 77 });
    (trainingService.enrollEmployee as any).mockResolvedValue({});

    renderDashboard();
    await waitFor(() => expect(screen.getByText('React Development')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Enroll/i }));

    await waitFor(() => expect(trainingService.enrollEmployee).toHaveBeenCalledWith({ employeeId: 77, programId: 1 }));
  });

  it('shows an error toast (not a crash or fake success) when enrollment fails', async () => {
    (trainingService.getPrograms as any).mockResolvedValue([CERT_PROGRAM]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([]);
    (employeeService.getMyEmployee as any).mockResolvedValue({ id: 77 });
    (trainingService.enrollEmployee as any).mockRejectedValue(new Error('full'));

    renderDashboard();
    await waitFor(() => expect(screen.getByText('React Development')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /Enroll/i }));

    // Still shows the Enroll button (not falsely marked Enrolled) after failure.
    await waitFor(() => expect(screen.getByRole('button', { name: /Enroll/i })).toBeInTheDocument());
  });

  it('shows a completed certification-program enrollment under Certificates, with no fake issuer/expiry', async () => {
    (trainingService.getPrograms as any).mockResolvedValue([CERT_PROGRAM, NON_CERT_PROGRAM]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([
      { id: 1, employeeId: 77, employeeName: '', programId: 1, programTitle: 'React Development', status: 'completed', createdAt: '2026-01-01', completedAt: '2026-02-01' },
    ]);

    renderDashboard();
    await waitFor(() => expect(screen.getByText('React Development')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Certificates' }));

    expect(screen.getAllByText('React Development').length).toBeGreaterThan(0);
    expect(screen.queryByText('Internal Training')).not.toBeInTheDocument(); // old fake issuer
    expect(screen.queryByText(/Download Certificate/)).not.toBeInTheDocument(); // no real download endpoint
  });

  it('does NOT show a completed but non-certification program in Certificates', async () => {
    (trainingService.getPrograms as any).mockResolvedValue([CERT_PROGRAM, NON_CERT_PROGRAM]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([
      { id: 2, employeeId: 77, employeeName: '', programId: 2, programTitle: 'Team Lunch Etiquette', status: 'completed', enrollmentDate: '2026-01-01', completionDate: '2026-01-10', progress: 100 },
    ]);

    renderDashboard();
    await waitFor(() => expect(screen.getByText('Team Lunch Etiquette')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Certificates' }));

    expect(screen.getByText('Data belum tersedia')).toBeInTheDocument();
  });
});

// Backend gate for POST /training/programs is RecruiterOrAdmin() (routes_hr.go) — a plain
// employee's browser must never render a "Create Program" control the backend would 403 on
// (Module 13 RBAC UX hardening).
describe('TrainingDashboard RBAC UX', () => {
  it('does not show "Create Program" for a viewer (self-service only)', async () => {
    (trainingService.getPrograms as any).mockResolvedValue([]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([]);

    renderDashboard();
    await waitFor(() => expect(trainingService.getPrograms).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: /Create Program/i })).not.toBeInTheDocument();
  });

  it('shows "Create Program" for a recruiter (matches backend RecruiterOrAdmin gate)', async () => {
    localStorage.setItem('access_token', fakeTokenForRole('recruiter'));
    (trainingService.getPrograms as any).mockResolvedValue([]);
    (trainingService.getEmployeeTrainings as any).mockResolvedValue([]);

    renderDashboard();
    await waitFor(() => expect(trainingService.getPrograms).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: /Create Program/i })).toBeInTheDocument();
  });
});
