import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Briefcase, Mail, Phone, Calendar,
  CheckCircle2, ShieldAlert, FileText, UserCircle, Clock, AlertCircle
} from 'lucide-react';
import { employeeService } from '../../services/employee.service';
import { Employee } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

import EmployeeContracts from './EmployeeContracts';
import { onboardingService, OnboardingSession, OnboardingTask } from '../../services/onboarding.service';

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [onboardingSession, setOnboardingSession] = useState<OnboardingSession | null>(null);
  const [candidateHistory, setCandidateHistory] = useState<Awaited<ReturnType<typeof employeeService.getEmployeeCandidateHistory>> | null>(null);
  const [candidateHistoryLoading, setCandidateHistoryLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const empId = parseInt(id);
      fetchEmployeeDetail(empId);
      fetchOnboardingStatus(empId);
      fetchCandidateHistory(empId);
    }
  }, [id]);

  const fetchCandidateHistory = async (empId: number) => {
    try {
      setCandidateHistoryLoading(true);
      setCandidateHistory(await employeeService.getEmployeeCandidateHistory(empId));
    } catch (err) {
      console.error('Failed to fetch candidate history', err);
    } finally {
      setCandidateHistoryLoading(false);
    }
  };

  const fetchEmployeeDetail = async (empId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getEmployeeById(empId);
      setEmployee(data);
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
      setError('Gagal memuat detail karyawan. Kembali ke daftar karyawan...');
      setTimeout(() => navigate('/employees'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingStatus = async (empId: number) => {
    try {
      const sessions = await onboardingService.getSessions();
      const empSession = sessions.find((s: any) => s.employeeId === empId);
      if (empSession) {
        setOnboardingSession(empSession);
      }
    } catch (err) {
      console.error('Failed to fetch onboarding session', err);
    }
  };


  const getStatusBadgeTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'active': return 'success';
      case 'resigned': return 'warning';
      case 'terminated': return 'danger';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
         <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-8">
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-danger-500 flex-shrink-0" />
            <div>
              <h3 className="text-danger-800 dark:text-danger-300 font-semibold">Error Loading Employee</h3>
              <p className="text-danger-700 dark:text-danger-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all font-bold text-sm"
        >
          <ArrowLeft size={18} />
          Back to Directory
        </button>
        <div className="flex items-center gap-3">
          <Button
             variant="secondary"
             size="md"
             onClick={() => navigate(`/employees/${employee.id}/edit`)}
             className="flex items-center gap-2 shadow-lg shadow-black/20"
          >
            <Edit size={16} />
            <span>Edit Profile</span>
          </Button>
        </div>
      </div>

      {/* Employee Profile Header Card */}
      <div className="bg-slate-50/40 dark:bg-[#000000]/40 backdrop-blur-3xl border border-slate-200/50 dark:border-white/5 rounded-2xl overflow-hidden relative shadow-2xl">
        <div className="h-40 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 opacity-90 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-neutral-900/80 to-transparent"></div>
        </div>
        <div className="px-10 pb-10">
          <div className="flex flex-col md:flex-row gap-8 items-start relative -mt-16">
            <div className="w-32 h-32 rounded-2xl bg-white dark:bg-[#000000] border-4 border-white dark:border-neutral-900 shadow-2xl overflow-hidden shrink-0 flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt={employee.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-5xl font-black text-white">
                  {employee.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 pt-20 md:pt-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {employee.fullName}
                    </h1>
                    <Badge tone={getStatusBadgeTone(employee.employmentStatus)} className="uppercase tracking-[0.2em]">
                        {employee.employmentStatus}
                    </Badge>
                  </div>
                  <p className="text-brand-600 dark:text-brand-400 font-bold text-xl mt-2 flex items-center gap-2">
                    <Briefcase size={20} className="text-brand-500/50" />
                    {employee.positionName || 'No Position Assigned'}
                  </p>
                </div>

                <div className="flex flex-col gap-3 bg-white/50 dark:bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-xl">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                    <div className="p-1.5 bg-brand-500/20 rounded-lg text-brand-600 dark:text-brand-400"><UserCircle size={14} /></div>
                    <span className="font-bold opacity-60">ID:</span> <span className="font-mono text-brand-600 dark:text-brand-300 font-black">{employee.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                    <div className="p-1.5 bg-brand-500/20 rounded-lg text-brand-600 dark:text-brand-400"><Briefcase size={14} /></div>
                    <span className="font-bold opacity-60">Dept:</span> <span className="text-slate-900 dark:text-white font-black">{employee.departmentName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3 overflow-x-auto layout-scrollbar pb-2 px-1">
        {['profile', 'contracts', 'documents', 'onboarding', ...(candidateHistory?.candidateId ? ['recruitment'] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/30 -translate-y-0.5'
                : 'bg-white/50 dark:bg-[#000000]/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-slate-300 border border-slate-200/50 dark:border-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-50/30 dark:bg-[#000000]/30 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/5 p-10 min-h-[500px] shadow-inner ring-1 ring-black/5 dark:ring-white/5">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Contact Intel</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent"></div>
              </div>
              <div className="grid gap-4">
                <div className="group flex items-center gap-5 p-5 bg-white/50 dark:bg-[#000000]/50 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:border-brand-500/30 transition-all">
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-2xl text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-500/10 transition-all shadow-inner"><Mail size={22} /></div>
                  <div>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest mb-1">Company Email</p>
                    <p className="text-slate-900 dark:text-slate-200 font-bold text-lg">{employee.email}</p>
                  </div>
                </div>
                <div className="group flex items-center gap-5 p-5 bg-white/50 dark:bg-[#000000]/50 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:border-brand-500/30 transition-all">
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-2xl text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-500/10 transition-all shadow-inner"><Phone size={22} /></div>
                  <div>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest mb-1">Direct Line</p>
                    <p className="text-slate-900 dark:text-slate-200 font-bold text-lg">{employee.phone || 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Deployment Status</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent"></div>
              </div>
              <div className="grid gap-4">
                <div className="group flex items-center gap-5 p-5 bg-white/50 dark:bg-[#000000]/50 rounded-2xl border border-slate-200/50 dark:border-white/5 transition-all">
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-2xl text-slate-700 dark:text-slate-300 shadow-inner"><Calendar size={22} /></div>
                  <div>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest mb-1">Service Inception</p>
                    <p className="text-slate-900 dark:text-slate-200 font-bold text-lg">
                      {new Date(employee.joinDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="group flex items-center gap-5 p-5 bg-white/50 dark:bg-[#000000]/50 rounded-2xl border border-slate-200/50 dark:border-white/5 transition-all">
                  <div className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-2xl text-slate-700 dark:text-slate-300 shadow-inner"><ShieldAlert size={22} /></div>
                  <div>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest mb-1">Contract Class</p>
                    <p className="text-slate-900 dark:text-slate-200 font-bold text-lg capitalize">{employee.employmentType}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recruitment' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {candidateHistoryLoading ? (
              <p className="text-slate-600 dark:text-slate-400">Loading...</p>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Riwayat Screening CV</h3>
                  {(candidateHistory?.screenings || []).length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Tidak ada data screening.</p>
                  ) : (
                    <div className="space-y-3">
                      {candidateHistory!.screenings.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-[#000000]/50 rounded-2xl border border-slate-200/50 dark:border-white/5">
                          <div>
                            <p className="text-slate-900 dark:text-white font-bold">Skor: {s.score}/100</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge tone={s.status === 'passed' ? 'success' : s.status === 'failed' ? 'danger' : 'neutral'}>{s.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Riwayat Interview</h3>
                  {(candidateHistory?.interviews || []).length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Tidak ada data interview.</p>
                  ) : (
                    <div className="space-y-3">
                      {candidateHistory!.interviews.map((iv) => (
                        <div key={iv.id} className="p-4 bg-white/50 dark:bg-[#000000]/50 rounded-2xl border border-slate-200/50 dark:border-white/5">
                          <div className="flex items-center justify-between">
                            <p className="text-slate-900 dark:text-white font-bold capitalize">{iv.interviewType} interview</p>
                            <Badge tone={iv.status === 'completed' ? 'success' : iv.status === 'cancelled' || iv.status === 'no-show' ? 'danger' : 'neutral'}>{iv.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : 'Belum dijadwalkan'}
                            {iv.rating ? ` · Rating: ${iv.rating}/5` : ''}
                          </p>
                          {iv.interviewerNotes && <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{iv.interviewerNotes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'contracts' && employee.id && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EmployeeContracts employeeId={employee.id} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="text-center py-20 animate-in fade-in duration-700">
            <div className="inline-flex justify-center p-8 bg-white/50 dark:bg-[#000000]/50 ring-1 ring-black/5 dark:ring-white/10 rounded-full mb-8 shadow-2xl">
              <FileText size={48} className="text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-widest">Encrypted Document Vault</h3>
            <p className="text-slate-700 dark:text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
              Store and manage sensitive military-grade encrypted files for this employee. Feature is currently being audited for security.
            </p>
            <Button variant="ghost" size="lg" className="mt-10 uppercase tracking-widest">
              Upload Files
            </Button>
          </div>
        )}

      {activeTab === 'onboarding' && (
        <div className="animate-in fade-in duration-500">
          {onboardingSession ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4 p-8 bg-brand-500/10 border border-brand-500/20 rounded-2xl shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-inner">
                    <Clock size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">Active Onboarding Plan</h4>
                    <p className="text-brand-600 dark:text-brand-400 font-medium">Session started on {new Date(onboardingSession.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">Core Progress</p>
                  <p className="text-5xl font-black text-slate-900 dark:text-white">{onboardingSession.progress}%</p>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-neutral-800 h-4 rounded-full overflow-hidden p-1 shadow-inner">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-1000"
                  style={{ width: `${onboardingSession.progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                  <h5 className="font-black text-slate-700 dark:text-slate-300 uppercase text-xs tracking-widest mb-4">Journey Stats</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">Status</span>
                      <Badge tone={onboardingSession.status === 'completed' ? 'success' : 'warning'}>{onboardingSession.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">Due Date</span>
                      <span className="text-slate-900 dark:text-white font-bold">{onboardingSession.dueDate ? new Date(onboardingSession.dueDate).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">Tasks Completed</span>
                      <span className="text-slate-900 dark:text-white font-bold">{onboardingSession.tasks?.filter((t: OnboardingTask) => t.status === 'completed').length || 0}/{onboardingSession.tasks?.length || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl flex items-center justify-center group cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all shadow-sm" onClick={() => navigate('/onboarding')}>
                  <div className="text-center">
                     <p className="text-brand-600 dark:text-brand-400 font-black uppercase text-xs tracking-widest group-hover:scale-110 transition-transform">Control System Dashboard</p>
                     <p className="text-slate-700 dark:text-slate-300 text-xs mt-1">Manage journey tasks & items</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex justify-center p-8 bg-slate-50 dark:bg-neutral-900 rounded-full mb-8 shadow-sm">
                <CheckCircle2 size={48} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-widest">New Hire Journey</h3>
              <p className="text-slate-700 dark:text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
                Initiate the standard onboarding checklist for this employee to begin their journey at the organization.
              </p>
              <Button variant="primary" size="lg" onClick={() => navigate('/onboarding')} className="mt-10 uppercase tracking-widest text-xs">
                Launch Journey Command
              </Button>
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
};

export default EmployeeDetail;
