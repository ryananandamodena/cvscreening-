import React, { useState, useEffect } from 'react';
import { Users, Search, CalendarDays, RefreshCw } from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface TeamRow {
  employeeId: number;
  employeeName: string;
  department: string;
  position: string;
  status: 'present' | 'late' | 'absent' | 'leave' | 'holiday';
  clockIn?: string;
  clockOut?: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
  leave: 'info',
  holiday: 'neutral',
};

const TeamAttendance: React.FC = () => {
  const { showToast } = useToast();
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, late: 0, absent: 0, leave: 0, holiday: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getTeamAttendance(date);
      setRows(res.data || []);
      setSummary(res.summary || { total: 0, present: 0, late: 0, absent: 0, leave: 0, holiday: 0 });
    } catch (err) {
      showToast('error', (err as any).message || 'Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const filteredRows = rows.filter(r =>
    r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    r.department.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Present</p>
          <p className="text-2xl font-black text-success-600 dark:text-success-500">{summary.present}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Late</p>
          <p className="text-2xl font-black text-warning-600 dark:text-warning-500">{summary.late}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Absent</p>
          <p className="text-2xl font-black text-danger-600 dark:text-danger-500">{summary.absent}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Leave</p>
          <p className="text-2xl font-black text-info-600 dark:text-info-500">{summary.leave}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Holiday</p>
          <p className="text-2xl font-black text-slate-600 dark:text-slate-400">{summary.holiday}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or department..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw size={14} />}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-800/60 text-left">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Clock In</th>
                <th className="px-5 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Clock Out</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                    <Users className="mx-auto mb-2 opacity-40" size={28} />
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr key={row.employeeId} className="border-t border-slate-100 dark:border-neutral-800 hover:bg-slate-50/60 dark:hover:bg-neutral-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{row.employeeName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{row.position}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{row.department}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={STATUS_TONE[row.status] || 'neutral'}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{formatTime(row.clockIn)}</td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{formatTime(row.clockOut)}</td>
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

export default TeamAttendance;
