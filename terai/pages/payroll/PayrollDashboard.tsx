import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Calendar, Briefcase, FileText, Plus, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Filter, Search, Download, RefreshCw, Layers, ShieldCheck, Wallet2
} from 'lucide-react';
import { payrollService, PayrollPeriod, SalaryConfiguration, Payslip, PayGrade } from '../../services/payroll.service';
import { useToast } from '../../contexts/ToastContext';
import { PageSkeleton } from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import TaxConfigPanel from './TaxConfigPanel';
import DeductionManagementPanel from './DeductionManagementPanel';

const PayrollDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('periods');
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [configs, setConfigs] = useState<SalaryConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  // Modal States
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ name: '', startDate: '', endDate: '' });
  
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SalaryConfiguration | null>(null);

  const [grades, setGrades] = useState<PayGrade[]>([]);
  const [editingGrade, setEditingGrade] = useState<PayGrade | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [periodData, configData, gradeData] = await Promise.all([
        payrollService.getPeriods(),
        payrollService.getSalaryConfigs(),
        payrollService.getPayGrades()
      ]);
      setPeriods(periodData || []);
      setConfigs(configData || []);
      setGrades(gradeData || []);
    } catch (err) {
      console.error('Failed to fetch payroll data', err);
      setError('Gagal memuat data payroll. Silakan refresh halaman atau coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const submitPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) return;

    try {
      await payrollService.createPeriod({
        name: newPeriod.name,
        startDate: new Date(newPeriod.startDate).toISOString(),
        endDate: new Date(newPeriod.endDate).toISOString(),
      });
      setIsPeriodModalOpen(false);
      setNewPeriod({ name: '', startDate: '', endDate: '' });
      fetchData();
      showToast('success', 'Periode payroll berhasil dibuat');
    } catch (err) {
      console.error('Failed to create period', err);
      const errorMessage = 'Gagal membuat periode payroll. Silakan coba lagi.';
      setError(errorMessage);
      showToast('error', errorMessage);
    }
  };

  const submitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    try {
      const res: any = await payrollService.updateSalaryConfig(editingConfig);
      setIsConfigModalOpen(false);
      setEditingConfig(null);
      fetchData();
      if (res?.message?.includes('memerlukan approval')) {
        showToast('success', res.message);
      } else {
        showToast('success', 'Data komponen gaji berhasil diperbarui');
      }
    } catch (err) {
      console.error('Failed to update config', err);
      const errorMessage = 'Gagal memperbarui konfigurasi gaji.';
      setError(errorMessage);
      showToast('error', errorMessage);
    }
  };

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;
    try {
      await payrollService.updatePayGrade(editingGrade);
      setEditingGrade(null);
      fetchData();
      showToast('success', `Grade ${editingGrade.name} berhasil diperbarui`);
    } catch (err) {
      console.error('Failed to update grade', err);
      showToast('error', 'Gagal memperbarui salary grade');
    }
  };

  const updatePeriodStatus = async (id: number, status: 'closed' | 'cancelled') => {
    try {
      await payrollService.updatePeriodStatus(id, status);
      fetchData();
      showToast('success', `Status periode diubah menjadi ${status}`);
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('error', 'Gagal merubah status periode');
    }
  };

  const handleGenerate = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await payrollService.generatePayroll(id);
      fetchData();
      showToast('success', 'Payroll berhasil digenerate');
    } catch (err) {
      console.error('Failed to generate payroll', err);
      const errorMessage = 'Gagal generate payroll. Silakan coba lagi.';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const viewPayslips = async (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    try {
      setError(null);
      const data = await payrollService.getPayslips(period.id);
      setPayslips(data || []);
      setActiveTab('payslips');
      showToast('success', `Berhasil memuat ${(data || []).length} payslip`);
    } catch (err) {
      console.error('Failed to view payslips', err);
      const errorMessage = 'Gagal memuat data payslip. Silakan coba lagi.';
      setError(errorMessage);
      showToast('error', errorMessage);
    }
  };

  const getStatusTone = (status: string): 'success' | 'brand' | 'neutral' => {
    switch (status) {
      case 'closed': return 'success';
      case 'processing': return 'brand';
      case 'draft': return 'neutral';
      default: return 'neutral';
    }
  };

  // Processed data with memoization
  const processedPayrollData = useMemo(() => {
    return periods.map(period => ({
      ...period,
      totalEmployees: payslips.filter(p => p.periodId === period.id).length,
      totalSalary: payslips
        .filter(p => p.periodId === period.id)
        .reduce((sum, p) => sum + p.netSalary, 0)
    }));
  }, [periods, payslips]);

  if (loading && periods.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger-500 flex-shrink-0" />
            <span className="text-danger-700 dark:text-danger-400 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <DollarSign size={32} />
            </div>
            Payroll HQ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Financial operations control center & disbursement management.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-3 bg-white dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl border border-slate-200 dark:border-neutral-800 transition-all active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button
            onClick={() => setIsPeriodModalOpen(true)}
            size="lg"
            icon={<Plus size={18} />}
            className="uppercase tracking-widest text-xs"
          >
            New Cycle
          </Button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-brand-500/10 group-hover:scale-110 transition-transform duration-500">
            <Calendar size={80} />
          </div>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-[0.2em] mb-4">Active Cycle</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{periods[0]?.name || 'N/A'}</h3>
          <div className="mt-4 flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold">
             <Clock size={16} />
             <span>Ends in 12 days</span>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-success-500/10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign size={80} />
          </div>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-[0.2em] mb-4">Estimated Burn</p>
          <h3 className="text-3xl font-black text-success-600 dark:text-success-400">
            {periods[0]?.totalDisbursement ? `Rp ${periods[0].totalDisbursement.toLocaleString()}` : 'Rp 0'}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
             <CheckCircle2 size={16} className="text-success-500" />
             <span>Budget confirmed</span>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-info-500/10 group-hover:scale-110 transition-transform duration-500">
            <Briefcase size={80} />
          </div>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-[0.2em] mb-4">Staff Count</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{configs.length} Personnel</h3>
          <div className="mt-4 flex items-center gap-2 text-info-600 dark:text-info-400 font-bold">
             <AlertCircle size={16} />
             <span>2 pending config</span>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-slate-200 dark:border-neutral-800 pb-1">
          {[
            { id: 'periods', label: 'Cycle Management', icon: Calendar },
            { id: 'configs', label: 'Salary Architect', icon: Briefcase },
            { id: 'grades', label: 'Salary Grades', icon: Layers },
            { id: 'tax', label: 'Pajak & BPJS', icon: ShieldCheck },
            { id: 'deductions', label: 'Potongan Lain', icon: Wallet2 },
            { id: 'payslips', label: 'Disbursement Archive', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 font-black text-xs uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 to-brand-400 rounded-full animate-in slide-in-from-left duration-300"></div>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'periods' && (
            <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-500">
              {periods.map(p => (
                <div key={p.id} className="group flex items-center justify-between p-6 bg-slate-50/60 dark:bg-neutral-900/30 border border-slate-200/60 dark:border-neutral-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-brand-500/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white">{p.name}</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {new Date(p.startDate).toLocaleDateString()} — {new Date(p.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="hidden md:block h-10 w-px bg-slate-200 dark:bg-slate-700/60 mx-4"></div>
                    <div className="hidden md:block">
                      <Badge tone={getStatusTone(p.status)}>{p.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-6">
                       <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest">Total Pay</p>
                       <p className="text-lg font-black text-slate-900 dark:text-white">Rp {p.totalDisbursement.toLocaleString()}</p>
                    </div>
                    {p.status === 'draft' && (
                      <Button
                        onClick={() => handleGenerate(p.id)}
                        size="sm"
                        className="uppercase tracking-widest text-[10px]"
                      >
                        Launch Generate
                      </Button>
                    )}
                    {p.status === 'processing' && (
                      <button
                        onClick={() => updatePeriodStatus(p.id, 'closed')}
                        className="px-5 py-2.5 bg-success-600/10 text-success-600 dark:text-success-500 border border-success-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-success-600 hover:text-white transition-all"
                      >
                        Close Period
                      </button>
                    )}
                    <button 
                      onClick={() => viewPayslips(p)}
                      className="p-3 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-neutral-800 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'configs' && (
            <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Employee</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Grade</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Performa Terakhir</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Base Salary</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Total Allowance</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Insurance Type</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                    {configs.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400 font-black">
                                {c.employeeName?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{c.employeeName}</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 uppercase tracking-tighter">EMP-{c.employeeId}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          {c.gradeName && c.gradeName !== 'Unassigned' ? (
                            <Badge tone={(c.gradeLevel || 0) >= 5 ? 'brand' : 'neutral'}>{c.gradeName}</Badge>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">No Position</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          {c.latestPerformanceRating ? (
                            <Badge tone={c.latestPerformanceRating >= 4 ? 'success' : c.latestPerformanceRating >= 3 ? 'warning' : 'danger'}>
                              {c.latestPerformanceRating.toFixed(1)}/5
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">Belum ada review</span>
                          )}
                        </td>
                        <td className="px-8 py-6 font-black text-slate-900 dark:text-white">Rp {c.baseSalary.toLocaleString()}</td>
                        <td className="px-8 py-6 text-success-600 dark:text-success-400 font-bold">Rp {(c.transportAllowance + c.mealAllowance + c.positionAllowance).toLocaleString()}</td>
                        <td className="px-8 py-6">
                           <Badge tone="neutral">Standard BPJS</Badge>
                        </td>
                        <td className="px-8 py-6">
                           <button
                             onClick={() => { setEditingConfig(c); setIsConfigModalOpen(true); }}
                             className="text-brand-600 dark:text-brand-400 font-black text-xs uppercase tracking-widest hover:text-brand-700 dark:hover:text-brand-300"
                           >
                             Modify Data
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="px-8 py-5 border-b border-slate-200 dark:border-neutral-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">Rentang gaji &amp; kebijakan per level jabatan — dari Staff sampai C-Level/CEO.</p>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Level</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Rentang Gaji</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Lembur</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Perubahan Gaji</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                  {grades.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900 dark:text-white">{g.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Level {g.level}</p>
                      </td>
                      <td className="px-8 py-6 text-slate-700 dark:text-slate-300 font-medium">
                        Rp {g.minSalary.toLocaleString()} — Rp {g.maxSalary.toLocaleString()}
                      </td>
                      <td className="px-8 py-6">
                        <Badge tone={g.isOvertimeEligible ? 'success' : 'neutral'}>{g.isOvertimeEligible ? 'Eligible' : 'Exempt'}</Badge>
                      </td>
                      <td className="px-8 py-6">
                        {g.requiresApprovalForChange ? (
                          <span className="flex items-center gap-1.5 text-warning-600 dark:text-warning-400 font-bold text-xs">
                            <ShieldCheck size={14} /> Perlu Approval
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">Langsung Diterapkan</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <button
                          onClick={() => setEditingGrade(g)}
                          className="text-brand-600 dark:text-brand-400 font-black text-xs uppercase tracking-widest hover:text-brand-700 dark:hover:text-brand-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'tax' && <TaxConfigPanel />}

          {activeTab === 'deductions' && <DeductionManagementPanel employees={configs} />}

          {activeTab === 'payslips' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Disbursement Audit: <span className="text-brand-600 dark:text-brand-400">{selectedPeriod?.name || 'Bulk List'}</span>
                 </h3>
                 <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-neutral-800 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                       <Download size={14} /> Export CSV
                    </button>
                 </div>
              </div>

              <div className="grid gap-3">
                {payslips.map(ps => (
                  <div key={ps.id} className="p-5 bg-slate-50 dark:bg-neutral-900/50 border border-slate-200/60 dark:border-neutral-800 rounded-2xl flex items-center justify-between group hover:border-brand-500/20 transition-all">
                    <div className="flex items-center gap-5">
                       <div className="text-brand-500 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                       <div>
                          <p className="font-black text-slate-900 dark:text-white text-lg">{ps.employeeName}</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium tracking-wide">Ref: {ps.employeeIdStr} • {ps.status === 'paid' ? 'Disbursed' : 'Pending Verification'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <p className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest mb-1">Net Payout</p>
                          <p className="text-xl font-black text-brand-600 dark:text-brand-400">Rp {ps.netSalary.toLocaleString()}</p>
                       </div>
                       <button className="p-3 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-neutral-800 transition-all">
                          <ChevronRight size={18} />
                       </button>
                    </div>
                  </div>
                ))}
                {payslips.length === 0 && (
                  <div className="text-center py-20 bg-slate-50/20 dark:bg-neutral-900/20 rounded-2xl border border-dashed border-slate-300 dark:border-neutral-800">
                     <AlertCircle size={48} className="text-slate-700 mx-auto mb-4" />
                     <h4 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">No Records Found</h4>
                     <p className="text-slate-600 max-w-xs mx-auto text-sm font-medium">Select a completed payroll cycle or execute a generation command to view payslips.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Period Modal */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200/80 dark:border-neutral-800/80 flex justify-between items-center bg-white/50 dark:bg-neutral-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-brand-600 dark:text-brand-400" /> New Payroll Cycle
              </h2>
              <button onClick={() => setIsPeriodModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={submitPeriod} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. May 2026"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({...newPeriod, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newPeriod.startDate}
                    onChange={(e) => setNewPeriod({...newPeriod, startDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={newPeriod.endDate}
                    onChange={(e) => setNewPeriod({...newPeriod, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsPeriodModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Cycle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Config Modal */}
      {isConfigModalOpen && editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200/80 dark:border-neutral-800/80 flex justify-between items-center bg-white/50 dark:bg-neutral-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="text-brand-600 dark:text-brand-400" /> Modify Components
              </h2>
              <button onClick={() => { setIsConfigModalOpen(false); setEditingConfig(null); }} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={submitConfig} className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-neutral-800 mb-4">
                 <p className="text-xs text-slate-700 dark:text-slate-300 uppercase tracking-widest font-black mb-1">Employee</p>
                 <p className="text-lg text-slate-900 dark:text-white font-bold">{editingConfig.employeeName}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Base Salary (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingConfig.baseSalary || 0}
                    onChange={(e) => setEditingConfig({...editingConfig, baseSalary: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Transport Allowance</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingConfig.transportAllowance || 0}
                      onChange={(e) => setEditingConfig({...editingConfig, transportAllowance: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meal Allowance</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingConfig.mealAllowance || 0}
                      onChange={(e) => setEditingConfig({...editingConfig, mealAllowance: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Position Allowance</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingConfig.positionAllowance || 0}
                    onChange={(e) => setEditingConfig({...editingConfig, positionAllowance: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => { setIsConfigModalOpen(false); setEditingConfig(null); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Grade Modal */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200/80 dark:border-neutral-800/80 flex justify-between items-center bg-white/50 dark:bg-neutral-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="text-brand-600 dark:text-brand-400" /> Edit Grade: {editingGrade.name}
              </h2>
              <button onClick={() => setEditingGrade(null)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={submitGrade} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gaji Minimum (Rp)</label>
                  <input
                    type="number" required min="0"
                    value={editingGrade.minSalary || 0}
                    onChange={(e) => setEditingGrade({ ...editingGrade, minSalary: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gaji Maksimum (Rp)</label>
                  <input
                    type="number" required min="0"
                    value={editingGrade.maxSalary || 0}
                    onChange={(e) => setEditingGrade({ ...editingGrade, maxSalary: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Transport Default</label>
                  <input
                    type="number" min="0"
                    value={editingGrade.defaultTransportAllowance || 0}
                    onChange={(e) => setEditingGrade({ ...editingGrade, defaultTransportAllowance: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meal Default</label>
                  <input
                    type="number" min="0"
                    value={editingGrade.defaultMealAllowance || 0}
                    onChange={(e) => setEditingGrade({ ...editingGrade, defaultMealAllowance: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Position Default</label>
                  <input
                    type="number" min="0"
                    value={editingGrade.defaultPositionAllowance || 0}
                    onChange={(e) => setEditingGrade({ ...editingGrade, defaultPositionAllowance: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGrade.isOvertimeEligible}
                    onChange={(e) => setEditingGrade({ ...editingGrade, isOvertimeEligible: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Eligible Lembur
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGrade.requiresApprovalForChange}
                    onChange={(e) => setEditingGrade({ ...editingGrade, requiresApprovalForChange: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Perubahan Gaji Perlu Approval
                </label>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingGrade(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Grade
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDashboard;
