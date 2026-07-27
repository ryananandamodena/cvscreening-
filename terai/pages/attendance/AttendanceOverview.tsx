import React, { useState, useEffect } from 'react';
import {
  Clock, MapPin, Camera, AlertCircle, CheckCircle2, History,
  CalendarDays, Coffee, Sunrise, Sunset
} from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { Attendance, Shift } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const AttendanceOverview: React.FC = () => {
  const { showToast } = useToast();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);

  // We hardcode employee ID 1 for MVP test
  const MOCK_EMPLOYEE_ID = 1;

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    fetchDailyStatus();

    return () => clearInterval(timer);
  }, []);

  const fetchDailyStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [attRes, shiftRes, histRes] = await Promise.all([
        attendanceService.getTodayAttendance(MOCK_EMPLOYEE_ID).catch(() => null),
        attendanceService.getEmployeeShift(MOCK_EMPLOYEE_ID).catch(() => null),
        attendanceService.getHistory(MOCK_EMPLOYEE_ID).catch(() => [])
      ]);

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

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported by browser"));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      }
    });
  };

  const handleClockAction = async (type: 'in' | 'out') => {
    try {
      // Simulate getting location
      let locationData = { lat: -6.2088, lng: 106.8456, address: "Jakarta (Simulated Area)" };
      
      try {
        const pos = await getLocation();
        locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: "Current Network Location" };
      } catch (locErr) {
        console.warn("Using default location due to error", locErr);
      }

      // Simulated photo
      const mockPhoto = "data:image/png;base64,...(photo data)...";

      if (type === 'in') {
        await attendanceService.clockIn({
          employeeId: MOCK_EMPLOYEE_ID,
          location: locationData,
          photo: mockPhoto
        });
      } else {
        await attendanceService.clockOut({
          employeeId: MOCK_EMPLOYEE_ID,
          location: locationData,
          photo: mockPhoto,
          notes: "End of scheduled shift"
        });
      }
      
      // Refresh status
      await fetchDailyStatus();
    } catch (err) {
      alert("Failed to record attendance: " + (err as any).message);
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      </div>

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
                onClick={() => handleClockAction('in')}
                size="lg"
                className="w-full !py-5 !text-xl !rounded-2xl bg-gradient-to-r from-success-500 to-success-600 hover:from-success-400 hover:to-success-500 shadow-lg shadow-success-500/20"
                icon={<Sunrise size={28} />}
              >
                CLOCK IN
              </Button>
            ) : !todayRecord?.clockOut ? (
              <Button
                onClick={() => handleClockAction('out')}
                size="lg"
                className="w-full !py-5 !text-xl !rounded-2xl bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-400 hover:to-danger-500 shadow-lg shadow-danger-500/20"
                icon={<Sunset size={28} />}
              >
                CLOCK OUT
              </Button>
            ) : (
              <div className="w-full py-5 bg-white dark:bg-neutral-800 border-2 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 font-bold text-lg rounded-2xl flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={24} className="text-success-500" />
                Shift Completed
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
    </div>
  );
};

export default AttendanceOverview;
