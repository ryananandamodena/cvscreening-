import React, { useEffect, useMemo, useState } from 'react';
import { Search, Globe, AlertCircle } from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { employeeService } from '../../services/employee.service';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/ui/Card';

interface EmployeeRow {
  id: number;
  fullName: string;
  employeeId: string;
}

interface ExemptionRow {
  employeeId: number;
  enabled: boolean;
  reason: string;
  startDate: string | null;
  endDate: string | null;
}

// HR/Admin page to dynamically allow a specific employee to clock in/out from outside the
// office geofencing radius — e.g. permanent remote workers, field staff, or a temporary WFH
// arrangement — without touching the shared office location every other employee is still
// checked against (see ClockInModal.tsx's "Jadikan Lokasi Ini sebagai Kantor" for that).
// Backend gate: HROrAdmin() on PUT /attendance/location-exemptions/:employeeId
// (routes_attendance.go) — matches the route-level `roles` restriction below.
const RemoteWorkExemptions: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [exemptions, setExemptions] = useState<ExemptionRow[]>([]);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [employeesRes, exemptionsRes] = await Promise.all([
        employeeService.getEmployees({ limit: 500 }),
        attendanceService.getLocationExemptions(),
      ]);
      setEmployees(employeesRes.data || []);
      setExemptions(exemptionsRes.exemptions || []);
    } catch (err) {
      console.error('Failed to fetch remote work exemptions:', err);
      const msg = 'Gagal memuat data remote work exemption. Silakan refresh halaman.';
      setError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exemptionByEmployeeId = useMemo(() => {
    const map = new Map<number, ExemptionRow>();
    exemptions.forEach((e) => map.set(e.employeeId, e));
    return map;
  }, [exemptions]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) => e.fullName?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const toggle = async (employee: EmployeeRow, nextEnabled: boolean) => {
    const existing = exemptionByEmployeeId.get(employee.id);
    setSavingId(employee.id);
    try {
      await attendanceService.setLocationExemption(employee.id, {
        enabled: nextEnabled,
        reason: existing?.reason || (nextEnabled ? 'Remote work allowed' : ''),
        startDate: existing?.startDate ?? null,
        endDate: existing?.endDate ?? null,
      });
      setExemptions((prev) => {
        const others = prev.filter((e) => e.employeeId !== employee.id);
        return [
          ...others,
          {
            employeeId: employee.id,
            enabled: nextEnabled,
            reason: existing?.reason || (nextEnabled ? 'Remote work allowed' : ''),
            startDate: existing?.startDate ?? null,
            endDate: existing?.endDate ?? null,
          },
        ];
      });
      showToast('success', `${employee.fullName} ${nextEnabled ? 'sekarang boleh' : 'tidak lagi boleh'} absen dari luar kantor.`);
    } catch (err) {
      console.error('Failed to update location exemption:', err);
      showToast('error', 'Gagal memperbarui pengecualian lokasi untuk karyawan ini.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="text-brand-600" size={24} />
          Remote Work Exemptions
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Karyawan yang di-toggle di sini bisa clock in/out dari mana saja — radius geofencing
          kantor di-skip khusus untuk mereka. Karyawan lain tetap diperiksa terhadap Office Location.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl flex items-center gap-3 text-sm text-danger-700 dark:text-danger-400">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari karyawan berdasarkan nama atau ID"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Memuat...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Tidak ada karyawan ditemukan.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-neutral-800">
            {filteredEmployees.map((employee) => {
              const exemption = exemptionByEmployeeId.get(employee.id);
              const enabled = !!exemption?.enabled;
              return (
                <div key={employee.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{employee.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {employee.employeeId}
                      {exemption?.reason ? ` · ${exemption.reason}` : ''}
                    </p>
                  </div>
                  <label className={`relative inline-flex items-center ${savingId === employee.id ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={enabled}
                      onChange={(e) => toggle(employee, e.target.checked)}
                    />
                    <div className="w-14 h-8 bg-slate-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RemoteWorkExemptions;