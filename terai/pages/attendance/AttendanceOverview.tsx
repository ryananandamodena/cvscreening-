import React, { useState, useEffect } from 'react';
import {
  Clock, MapPin, Camera, AlertCircle, CheckCircle2, History,
  CalendarDays, Coffee, Sunrise, Sunset, Users
} from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { employeeService } from '../../services/employee.service';
import { Attendance, Shift } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../guards/AuthGuard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import TeamAttendance from './TeamAttendance';
import ClockInModal from './ClockInModal';
import QRScanModal from './QRScanModal';
import MyCorrections from './MyCorrections';
import MonthlyReport from './MonthlyReport';
import FaceEnrollmentModal from './FaceEnrollmentModal';
import { faceRecognitionService } from '../../services/faceRecognition.service';

// Backend gate for GET /attendance/team and /attendance/reports/monthly is HiringManagerOrAdmin()
// (routes_attendance.go) — 'hr'/'hr_admin'/'hr_manager'/'manager' are not real backend roles.
const HR_ROLES = ['admin', 'hiring_manager'];

const AttendanceOverview: React.FC = () => {
  const { showToast } = useToast();
  const { role } = useAuth();
  const canViewTeam = !!role && HR_ROLES.includes(role.toLowerCase());
  const [activeTab, setActiveTab] = useState<'mine' | 'team' | 'reports'>('mine');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [clockModal, setClockModal] = useState<'in' | 'out' | null>(null);
  const [qrModal, setQrModal] = useState<'in' | 'out' | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [breaks, setBreaks] = useState<Array<{ id: number; breakStart: string; breakEnd?: string }>>([]);
  const [breakBusy, setBreakBusy] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  useEffect(() => {
    faceRecognitionService.getEnrollmentStatus().then((res) => setFaceEnrolled(res.enrolled)).catch(() => setFaceEnrolled(null));
  }, []);

  const onBreak = breaks.some((b) => !b.breakEnd);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    employeeService.getMyEmployee()
      .then((emp: any) => setEmployeeId(emp.id))
      .catch(() => {
        setError('Akun Anda belum terhubung dengan data karyawan.');
        setLoading(false);
      });

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (employeeId) fetchDailyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const fetchDailyStatus = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const [attRes, shiftRes, histRes, breaksRes] = await Promise.all([
        attendanceService.getTodayAttendance(employeeId).catch(() => null),
        attendanceService.getEmployeeShift(employeeId).catch(() => null),
        attendanceService.getHistory(employeeId).catch(() => []),
        attendanceService.getTodayBreaks().catch(() => [])
      ]);
      setBreaks(breaksRes || []);

      if (attRes && attRes.status !== 'not_clocked_in') {
        setTodayRecord(attRes);
      }

      if (shiftRes && shiftRes.status !== 'no_shift') {
        setActiveShift(shiftRes);
      }

      setHistory(histRes || []);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
      const errorMessage = 'Gagal memuat data kehadiran. Silakan refresh halaman.';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClockSuccess = async () => {
    setClockModal(null);
    showToast('success', clockModal === 'in' ? 'Clock in berhasil dicatat' : 'Clock out berhasil dicatat');
    await fetchDailyStatus();
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleBreakAction = async () => {
    setBreakBusy(true);
    try {
      if (onBreak) {
        await attendanceService.breakEnd();
        showToast('success', 'Istirahat selesai');
      } else {
        await attendanceService.breakStart();
        showToast('success', 'Istirahat dimulai');
      }
      await fetchDailyStatus();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal mencatat istirahat');
    } finally {
      setBreakBusy(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger-500 flex-shrink-0" />
            <span className="text-danger-700 dark:text-danger-400 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-danger-600 dark:text-danger-400 hover:text-danger-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Clock className="text-brand-500" size={32} />
            Time & Attendance
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Manage your daily clock-ins and monitor shift schedules.</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-fit flex-wrap">
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'mine' ? 'bg-white dark:bg-neutral-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Clock size={16} /> My Attendance
          </button>
          {canViewTeam && (
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'team' ? 'bg-white dark:bg-neutral-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users size={16} /> Team Attendance
            </button>
          )}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'reports' ? 'bg-white dark:bg-neutral-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CalendarDays size={16} /> Monthly Report
          </button>
        </div>
      </div>

      {activeTab === 'team' && canViewTeam ? (
        <TeamAttendance />
      ) : activeTab === 'reports' ? (
        <MonthlyReport />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Clock In/Out Panel */}
        <div className="lg:col-span-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Coffee size={120} /></div>
          
          <div className="text-center z-10 w-full mb-8">
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' })}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-2">{currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="w-full space-y-4 z-10">
            {!todayRecord?.clockIn ? (
              <Button
                onClick={() => setClockModal('in')}
                size="lg"
                className="w-full !py-5 !text-xl !rounded-2xl bg-gradient-to-r from-success-500 to-success-600 hover:from-success-400 hover:to-success-500 shadow-lg shadow-success-500/20"
                icon={<Sunrise size={28} />}
              >
                CLOCK IN
              </Button>
            ) : null}
            {!todayRecord?.clockIn && (
              <button onClick={() => setQrModal('in')} className="w-full text-center text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
                Scan QR Kiosk untuk Clock In
              </button>
            )}
            {todayRecord?.clockIn && !todayRecord?.clockOut ? (
              <>
                <Button
                  onClick={() => setClockModal('out')}
                  size="lg"
                  className="w-full !py-5 !text-xl !rounded-2xl bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-400 hover:to-danger-500 shadow-lg shadow-danger-500/20"
                  icon={<Sunset size={28} />}
                >
                  CLOCK OUT
                </Button>
                <button onClick={() => setQrModal('out')} className="w-full text-center text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
                  Scan QR Kiosk untuk Clock Out
                </button>
                <Button
                  onClick={handleBreakAction}
                  loading={breakBusy}
                  variant={onBreak ? 'danger' : 'outline'}
                  size="md"
                  className="w-full !rounded-xl"
                  icon={<Coffee size={18} />}
                >
                  {onBreak ? 'Selesai Istirahat' : 'Mulai Istirahat'}
                </Button>
                {todayRecord?.breakMinutes ? (
                  <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Total istirahat hari ini: {todayRecord.breakMinutes} menit
                  </p>
                ) : null}
              </>
            ) : todayRecord?.clockIn && todayRecord?.clockOut ? (
              <div className="w-full py-5 bg-white dark:bg-neutral-800 border-2 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 font-bold text-lg rounded-2xl flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={24} className="text-success-500" />
                Shift Completed
              </div>
            ) : null}

            {/* Face enrollment status — separate from clock-in itself (Module 15 §U). Shown
                regardless of whether today's shift is done, so an employee can always see their
                status and (re-)enroll on demand, not only as a side effect of clocking in. */}
            {faceEnrolled !== null && (
              <div className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl text-sm ${
                faceEnrolled ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500'
                : 'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-500'
              }`}>
                <span className="flex items-center gap-2 font-semibold">
                  {faceEnrolled ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {faceEnrolled ? 'Wajah Terdaftar' : 'Wajah Belum Terdaftar'}
                </span>
                <button
                  onClick={() => setEnrollModalOpen(true)}
                  className="font-bold underline underline-offset-2 shrink-0"
                >
                  {faceEnrolled ? 'Daftar Ulang' : 'Daftarkan Wajah'}
                </button>
              </div>
            )}

            {todayRecord && (todayRecord.status === 'late' || !!todayRecord.earlyLeaveMinutes || !!todayRecord.overtimeHours) && (
              <div className="flex flex-wrap gap-2 justify-center">
                {todayRecord.status === 'late' && (
                  <Badge tone="warning">Telat {todayRecord.lateMinutes} menit</Badge>
                )}
                {!!todayRecord.earlyLeaveMinutes && (
                  <Badge tone="warning">Pulang cepat {todayRecord.earlyLeaveMinutes} menit</Badge>
                )}
                {!!todayRecord.overtimeHours && (
                  <Badge tone="info">Lembur {todayRecord.overtimeHours.toFixed(1)} jam</Badge>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-neutral-900/50 py-2 px-4 rounded-full">
            <MapPin size={14} className="text-brand-600 dark:text-brand-400"/> Location Services Active
          </div>
        </div>

        {/* Shift Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <CalendarDays size={20} className="text-brand-600 dark:text-brand-400" /> Today's Shift
             </h3>
             {loading ? (
                <div className="animate-pulse h-20 bg-slate-200 dark:bg-neutral-700/50 rounded-xl"></div>
             ) : activeShift ? (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-slate-50/50 dark:bg-neutral-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-neutral-700/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Shift Name</p>
                    <p className="text-lg text-slate-900 dark:text-white font-semibold mt-1">{activeShift.name}</p>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-neutral-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-neutral-700/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Start Time</p>
                    <p className="text-lg text-slate-900 dark:text-white font-semibold mt-1">{activeShift.startTime.substring(0,5)}</p>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-neutral-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-neutral-700/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">End Time</p>
                    <p className="text-lg text-slate-900 dark:text-white font-semibold mt-1">{activeShift.endTime.substring(0,5)}</p>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-neutral-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-neutral-700/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Tolerance</p>
                    <p className="text-lg text-slate-900 dark:text-white font-semibold mt-1">{activeShift.toleranceMinutes} min</p>
                 </div>
               </div>
             ) : (
                <div className="p-4 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-xl flex items-center gap-3 text-warning-700 dark:text-warning-500">
                  <AlertCircle size={20}/>
                  <p className="font-medium text-sm">No scheduled shift for today.</p>
                </div>
             )}
          </div>

          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
               <History size={20} className="text-brand-600 dark:text-brand-400" /> Recent Activity
             </h3>
             <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-slate-700 dark:text-slate-300 text-sm">No recent attendance records found.</p>
                ) : (
                  history.slice(0, 5).map(record => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl hover:border-slate-300 dark:hover:border-neutral-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${record.status === 'late' ? 'bg-warning-500' : 'bg-success-500'}`}></div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-bold">{new Date(record.date).toLocaleDateString()}</p>
                          <Badge tone={record.status === 'late' ? 'warning' : 'success'} className="mt-1">{record.status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-8 text-sm">
                        <div>
                          <p className="text-slate-700 dark:text-slate-300 text-xs mb-1">Clock In</p>
                          <p className="text-slate-900 dark:text-white font-medium">{formatTime(record.clockIn)}</p>
                        </div>
                        <div>
                          <p className="text-slate-700 dark:text-slate-300 text-xs mb-1">Clock Out</p>
                          <p className="text-slate-900 dark:text-white font-medium">{formatTime(record.clockOut)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

      </div>
      )}

      {activeTab === 'mine' && employeeId && <MyCorrections />}

      {clockModal && (
        <ClockInModal
          mode={clockModal}
          onClose={() => setClockModal(null)}
          onSuccess={handleClockSuccess}
        />
      )}

      {enrollModalOpen && (
        <FaceEnrollmentModal
          onClose={() => setEnrollModalOpen(false)}
          onEnrolled={() => {
            setFaceEnrolled(true);
            setEnrollModalOpen(false);
          }}
        />
      )}

      {qrModal && (
        <QRScanModal
          mode={qrModal}
          onClose={() => setQrModal(null)}
          onSuccess={async () => {
            setQrModal(null);
            showToast('success', qrModal === 'in' ? 'Clock in via QR berhasil' : 'Clock out via QR berhasil');
            await fetchDailyStatus();
          }}
        />
      )}
    </div>
  );
};

export default AttendanceOverview;
