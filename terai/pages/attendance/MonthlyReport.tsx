import React, { useEffect, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { attendanceService } from '../../services/attendance.service';
import { useToast } from '../../contexts/ToastContext';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface ReportRow {
  employeeId: number;
  employeeName: string;
  department: string;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  leaveDays: number;
  absentDays: number;
  totalLateMinutes: number;
  totalOvertimeHours: number;
}

const MonthlyReport: React.FC = () => {
  const { showToast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getMonthlyReport(year, month);
      setRows(res.data || []);
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memuat laporan bulanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleExportCSV = () => {
    const header = ['Nama', 'Departemen', 'Hari Kerja', 'Hadir', 'Telat', 'Cuti', 'Absen', 'Total Menit Telat', 'Total Jam Lembur'];
    const csvRows = rows.map((r) => [
      r.employeeName, r.department, r.workingDays, r.presentDays, r.lateDays, r.leaveDays, r.absentDays, r.totalLateMinutes, r.totalOvertimeHours,
    ]);
    const csv = [header, ...csvRows].map((r) => r.map((v) => `"${String(v ?? '')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-absensi-${year}-${String(month).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totals = rows.reduce(
    (acc, r) => ({
      present: acc.present + r.presentDays,
      late: acc.late + r.lateDays,
      leave: acc.leave + r.leaveDays,
      absent: acc.absent + r.absentDays,
      overtime: acc.overtime + r.totalOvertimeHours,
    }),
    { present: 0, late: 0, leave: 0, absent: 0, overtime: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300">
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-bold text-slate-900 dark:text-white w-40 text-center">{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300">
            <ChevronRight size={18} />
          </button>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Hadir</p>
          <p className="text-2xl font-black text-success-600 dark:text-success-500">{totals.present}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Telat</p>
          <p className="text-2xl font-black text-warning-600 dark:text-warning-500">{totals.late}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Cuti</p>
          <p className="text-2xl font-black text-info-600 dark:text-info-500">{totals.leave}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Absen</p>
          <p className="text-2xl font-black text-danger-600 dark:text-danger-500">{totals.absent}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Lembur (jam)</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{totals.overtime.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={16} className="text-brand-600 dark:text-brand-400" /> Rekap Per Karyawan
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Karyawan</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Hari Kerja</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Hadir</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Telat</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Cuti</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Absen</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Lembur (jam)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">Tidak ada data.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.employeeId} className="border-t border-slate-100 dark:border-neutral-800 hover:bg-slate-50/60 dark:hover:bg-neutral-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{r.employeeName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.department}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{r.workingDays}</td>
                    <td className="px-5 py-3.5 font-semibold text-success-600 dark:text-success-500">{r.presentDays}</td>
                    <td className="px-5 py-3.5 font-semibold text-warning-600 dark:text-warning-500">{r.lateDays}</td>
                    <td className="px-5 py-3.5 font-semibold text-info-600 dark:text-info-500">{r.leaveDays}</td>
                    <td className="px-5 py-3.5 font-semibold text-danger-600 dark:text-danger-500">{r.absentDays}</td>
                    <td className="px-5 py-3.5 font-semibold text-brand-600 dark:text-brand-400">{r.totalOvertimeHours.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
