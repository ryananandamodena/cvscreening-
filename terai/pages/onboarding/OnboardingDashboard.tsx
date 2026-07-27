import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, CircleDashed, Clock, Calendar, 
  ChevronRight, Filter, AlertCircle, Plus
} from 'lucide-react';
import { onboardingService, OnboardingSession, OnboardingTask } from '../../services/onboarding.service';
import { employeeService } from '../../services/employee.service';
import { Employee } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const OnboardingDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<OnboardingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSessionData, setNewSessionData] = useState({ employeeId: '', templateId: '' });
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchSessions();
    fetchEmployees();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await onboardingService.getSessions();
      const sessionsWithTasks = await Promise.all(
        (data || []).map(async (s) => {
          try {
             const tasks = await onboardingService.getTasks(s.id);
             return { ...s, tasks: tasks || [] };
          } catch {
             return { ...s, tasks: [] };
          }
        })
      );
      setSessions(sessionsWithTasks);
    } catch (err) {
      console.error('Failed to get sessions', err);
      showToast('error', 'Failed to load onboarding sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeeService.getEmployees({ limit: 100, employmentStatus: 'active' });
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Compute stats from real data
  const activeCount = sessions.filter(s => s.status === 'in_progress' || s.status === 'pending').length;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = sessions.filter(s => 
    s.status === 'completed' && s.completedAt && new Date(s.completedAt) >= startOfMonth
  ).length;
  const overdueTasksCount = sessions.reduce((acc, s) => {
    if (!s.tasks) return acc;
    return acc + s.tasks.filter(t => 
      t.status === 'pending' && t.dueDate && new Date(t.dueDate) < now
    ).length;
  }, 0);

  const getStatusTone = (status: string): 'success' | 'warning' | 'neutral' => {
    if (status === 'completed') return 'success';
    if (status === 'in_progress') return 'warning';
    return 'neutral';
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionData.employeeId) return;
    
    setSubmitting(true);
    try {
      await onboardingService.createSession({
        employeeId: parseInt(newSessionData.employeeId),
        templateId: newSessionData.templateId ? parseInt(newSessionData.templateId) : undefined,
        startDate: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewSessionData({ employeeId: '', templateId: '' });
      fetchSessions();
      showToast('success', 'Onboarding session created successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create onboarding session');
    } finally {
      setSubmitting(false);
    }
  };

  return (

    <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            Onboarding Command Center
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Track and manage new hire journey progressions across departments.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md" className="flex items-center gap-2">
             <Filter size={18} /> Filter
          </Button>
          <Button
             variant="primary"
             size="md"
             onClick={() => setIsModalOpen(true)}
          >
            + New Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Users size={80} /></div>
          <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Active Onboardings</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-500"><CheckCircle2 size={80} /></div>
          <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Completed (This Month)</p>
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{completedThisMonth}</p>
        </div>
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-amber-500"><Clock size={80} /></div>
          <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Overdue Tasks</p>
          <p className={`text-4xl font-black ${overdueTasksCount > 0 ? 'text-danger-600 dark:text-danger-500' : 'text-amber-600 dark:text-amber-400'}`}>{overdueTasksCount}</p>
        </div>
      </div>


      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Active Sessions</h2>

        {loading ? (
           <div className="flex justify-center py-12">
             <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-slate-700 dark:text-slate-300">
                <CircleDashed size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No onboarding sessions yet.</p>
                <p className="text-sm mt-1">Click <span className="text-brand-600 dark:text-brand-400 font-bold">+ New Session</span> to get started.</p>
              </div>
            ) : (
              sessions.map((session) => (
              <div key={session.id} className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{session.employeeName || `Employee #${session.employeeId}`}</h3>
                       <Badge tone={getStatusTone(session.status)}>
                         {session.status.replace('_', ' ')}
                       </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                       <span className="flex items-center gap-1.5"><Calendar size={14} /> Started: {new Date(session.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex-[1.5] w-full">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      <span>Progress</span>
                      <span>{session.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full ${session.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-brand-700'}`}
                        style={{ width: `${session.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                     <button className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all">
                       <ChevronRight size={20} />
                     </button>
                  </div>

                </div>

                {/* Sub-tasks quick view */}
                {session.tasks && session.tasks.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-neutral-800">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3">Pending Action Items</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {session.tasks.filter(t => t.status === 'pending').map(task => (
                         <div key={task.id} className="flex flex-col gap-1 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
                           <div className="flex items-start justify-between">
                             <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.title}</span>
                             <Badge tone="neutral">{task.assignedRole}</Badge>
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
            )}
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Start New Onboarding</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleCreateSession} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Employee</label>
                <select
                  required
                  value={newSessionData.employeeId}
                  onChange={(e) => setNewSessionData({...newSessionData, employeeId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 appearance-none transition-colors"
                >
                  <option value="">-- Choose New Hire --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName || `Employee #${emp.id}`} ({emp.departmentName || 'No Dept'})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Onboarding Template</label>
                <select
                  disabled
                  value=""
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-700 dark:text-slate-300 outline-none appearance-none transition-colors opacity-50 cursor-not-allowed"
                >
                  <option value="">-- Template Feature Coming Soon --</option>
                </select>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Sessions will be created as Blank Templates for now.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {submitting ? 'Creating...' : 'Start Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingDashboard;
