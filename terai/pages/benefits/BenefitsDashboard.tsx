import React, { useState, useEffect } from 'react';
import {
  Shield, Heart, DollarSign, Users, TrendingUp, Calendar,
  Plus, Settings, Download, Upload, Eye, Edit, Trash2,
  CheckCircle2, AlertCircle, Clock, UserPlus, FileText
} from 'lucide-react';
import { benefitsService, EmployeeBenefit, BenefitsAnalytics, BenefitPlan, InsurancePlan, Allowance, FlexibleBenefit, RetirementPlan, InsuranceContinuation } from '../../services/benefits.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import SimpleCrudManager from '../../components/SimpleCrudManager';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const BenefitsDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
  const [analytics, setAnalytics] = useState<BenefitsAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Manage Plans tab state — the one tab in this page backed by real, working CRUD.
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', category: 'health', provider: '', coverageAmount: 0, employeeContribution: 0, employerContribution: 0 });
  const [savingPlan, setSavingPlan] = useState(false);

  // Insurance Plans sub-tab state (within "Manage Plans")
  const [plansSubTab, setPlansSubTab] = useState<'generic' | 'insurance' | 'allowances' | 'flexible' | 'retirement' | 'continuation'>('generic');
  const [continuations, setContinuations] = useState<InsuranceContinuation[]>([]);
  const [continuationsLoading, setContinuationsLoading] = useState(false);
  const [newContinuation, setNewContinuation] = useState({ employeeId: 0, terminationDate: '', monthlyPremium: 0 });
  const [savingContinuation, setSavingContinuation] = useState(false);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  const [insurancePlansLoading, setInsurancePlansLoading] = useState(false);
  const [newInsurancePlan, setNewInsurancePlan] = useState({ name: '', provider: '', type: 'health', coverageAmount: 0, premiumAmount: 0, premiumFrequency: 'monthly' });
  const [savingInsurancePlan, setSavingInsurancePlan] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
      fetchInsurancePlans();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'plans' && plansSubTab === 'continuation') fetchContinuations();
  }, [activeTab, plansSubTab]);

  const fetchContinuations = async () => {
    try {
      setContinuationsLoading(true);
      setContinuations(await benefitsService.getInsuranceContinuations());
    } catch (err) {
      console.error('Failed to fetch insurance continuations:', err);
      showToast('error', 'Failed to load insurance continuations');
    } finally {
      setContinuationsLoading(false);
    }
  };

  const handleInitiateContinuation = async () => {
    if (!newContinuation.employeeId || !newContinuation.terminationDate) {
      showToast('error', 'Employee ID dan tanggal terminasi wajib diisi');
      return;
    }
    try {
      setSavingContinuation(true);
      await benefitsService.initiateInsuranceContinuation(
        newContinuation.employeeId, newContinuation.terminationDate, undefined, newContinuation.monthlyPremium
      );
      showToast('success', 'Perpanjangan asuransi berhasil diinisiasi');
      setNewContinuation({ employeeId: 0, terminationDate: '', monthlyPremium: 0 });
      fetchContinuations();
    } catch (err) {
      console.error('Failed to initiate insurance continuation:', err);
      showToast('error', 'Gagal menginisiasi perpanjangan asuransi');
    } finally {
      setSavingContinuation(false);
    }
  };

  const handleRecordPayment = async (continuation: InsuranceContinuation) => {
    const amountStr = window.prompt(`Jumlah pembayaran premi untuk ${continuation.employeeName || 'karyawan ini'} (Rp):`, String(continuation.monthlyPremium));
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      showToast('error', 'Jumlah tidak valid');
      return;
    }
    try {
      await benefitsService.recordInsuranceContinuationPayment(continuation.id, amount);
      showToast('success', 'Pembayaran berhasil dicatat');
      fetchContinuations();
    } catch (err) {
      console.error('Failed to record payment:', err);
      showToast('error', 'Gagal mencatat pembayaran');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [benefitsData, analyticsData] = await Promise.all([
        benefitsService.getEmployeeBenefits(),
        benefitsService.getBenefitsAnalytics()
      ]);
      setBenefits(benefitsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch benefits data:', err);
      showToast('error', 'Failed to load benefits data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      setPlans(await benefitsService.getBenefitPlans());
    } catch (err) {
      console.error('Failed to fetch benefit plans:', err);
      showToast('error', 'Failed to load benefit plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name.trim()) {
      showToast('error', 'Nama plan wajib diisi');
      return;
    }
    try {
      setSavingPlan(true);
      await benefitsService.createBenefitPlan({ ...newPlan, isActive: true } as Partial<BenefitPlan>);
      showToast('success', 'Benefit plan berhasil dibuat');
      setNewPlan({ name: '', category: 'health', provider: '', coverageAmount: 0, employeeContribution: 0, employerContribution: 0 });
      fetchPlans();
    } catch (err) {
      console.error('Failed to create benefit plan:', err);
      showToast('error', 'Gagal membuat benefit plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (plan: BenefitPlan) => {
    if (!window.confirm(`Nonaktifkan plan "${plan.name}"?`)) return;
    try {
      await benefitsService.deleteBenefitPlan(plan.id);
      showToast('success', 'Benefit plan dinonaktifkan');
      fetchPlans();
    } catch (err) {
      console.error('Failed to delete benefit plan:', err);
      showToast('error', 'Gagal menonaktifkan benefit plan');
    }
  };

  const fetchInsurancePlans = async () => {
    try {
      setInsurancePlansLoading(true);
      setInsurancePlans(await benefitsService.getInsurancePlans());
    } catch (err) {
      console.error('Failed to fetch insurance plans:', err);
      showToast('error', 'Failed to load insurance plans');
    } finally {
      setInsurancePlansLoading(false);
    }
  };

  const handleCreateInsurancePlan = async () => {
    if (!newInsurancePlan.name.trim()) {
      showToast('error', 'Nama plan wajib diisi');
      return;
    }
    try {
      setSavingInsurancePlan(true);
      await benefitsService.createInsurancePlan({ ...newInsurancePlan, active: true } as Partial<InsurancePlan>);
      showToast('success', 'Insurance plan berhasil dibuat');
      setNewInsurancePlan({ name: '', provider: '', type: 'health', coverageAmount: 0, premiumAmount: 0, premiumFrequency: 'monthly' });
      fetchInsurancePlans();
    } catch (err) {
      console.error('Failed to create insurance plan:', err);
      showToast('error', 'Gagal membuat insurance plan');
    } finally {
      setSavingInsurancePlan(false);
    }
  };

  const handleDeleteInsurancePlan = async (plan: InsurancePlan) => {
    if (!window.confirm(`Nonaktifkan insurance plan "${plan.name}"?`)) return;
    try {
      await benefitsService.deleteInsurancePlan(plan.id);
      showToast('success', 'Insurance plan dinonaktifkan');
      fetchInsurancePlans();
    } catch (err) {
      console.error('Failed to delete insurance plan:', err);
      showToast('error', 'Gagal menonaktifkan insurance plan');
    }
  };

  const getStatusTone = (status: string): 'success' | 'neutral' | 'warning' | 'danger' => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'neutral';
      case 'pending': return 'warning';
      case 'terminated': return 'danger';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      case 'terminated': return 'Terminated';
      default: return status;
    }
  };

  const getBenefitTypeIcon = (type: string) => {
    switch (type) {
      case 'insurance': return <Shield className="w-5 h-5" />;
      case 'allowance': return <DollarSign className="w-5 h-5" />;
      case 'flexible': return <TrendingUp className="w-5 h-5" />;
      case 'retirement': return <Users className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getBenefitTypeColor = (type: string) => {
    switch (type) {
      case 'insurance': return 'bg-info-100 dark:bg-info-900/40 text-info-700 dark:text-info-400';
      case 'allowance': return 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-400';
      case 'flexible': return 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400';
      case 'retirement': return 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-400';
      default: return 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300';
    }
  };

  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch = benefit.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         benefit.planName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || benefit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = analytics ? {
    totalActive: analytics.totalActiveBenefits,
    monthlyCost: analytics.totalMonthlyCost,
    annualCost: analytics.totalAnnualCost,
    byType: analytics.benefitsByType,
    topBenefits: analytics.topBenefits.slice(0, 3)
  } : null;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <Heart size={32} />
            </div>
            Benefits Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Comprehensive employee benefits administration and management.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md">
            <Upload size={16} className="mr-2" />
            Import
          </Button>
          <Button variant="outline" size="md">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button variant="outline" size="md">
            <Settings size={16} className="mr-2" />
            Configure
          </Button>
          <Button variant="primary" size="md">
            <Plus size={16} className="mr-2" />
            Add Benefit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#000000] p-6 rounded-[32px] border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-success-500/10 group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 size={24} className="text-success-600" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Active Benefits</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalActive}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#000000] p-6 rounded-[32px] border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-info-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-info-500/10 group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={24} className="text-info-600" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Monthly Cost</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Rp {stats.monthlyCost.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#000000] p-6 rounded-[32px] border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Annual Cost</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Rp {stats.annualCost.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#000000] p-6 rounded-[32px] border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-warning-500/10 group-hover:scale-110 transition-transform duration-500">
                <Users size={24} className="text-warning-600" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Coverage Rate</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">87%</h3>
              <span className="text-xs font-bold text-warning-500">+5% from last month</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#000000] rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => { setActiveTab('plans'); setPlansSubTab('insurance'); }}
                className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-info-100 dark:bg-info-900/40 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-info-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Insurance Plans</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Manage health & life insurance</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success-100 dark:bg-success-900/40 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Allowances</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Configure employee allowances</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/40 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Flexible Benefits</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Cafeteria plan management</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/40 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Retirement Plans</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Pension & 401k management</p>
                  </div>
                </div>
              </button>

              <div className="border-t border-slate-200 dark:border-neutral-800 pt-4 mt-4">
                <button className="w-full p-3 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Open Enrollment
                </button>
              </div>
            </div>
          </div>

          {/* Top Benefits */}
          {stats?.topBenefits && (
            <div className="bg-white dark:bg-[#000000] rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Benefits</h2>
              <div className="space-y-3">
                {stats.topBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/40 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{benefit.name}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{benefit.count} employees</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{benefit.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#000000] rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-neutral-800">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('enrollments')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'enrollments'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-700'
                  }`}
                >
                  Employee Benefits
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-700'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'plans'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-700'
                  }`}
                >
                  Manage Plans
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-success-100 dark:bg-success-900/40 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-success-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">John Doe enrolled in Health Insurance Plan</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-info-100 dark:bg-info-900/40 rounded-full flex items-center justify-center">
                          <Plus className="w-5 h-5 text-info-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">New Dental Insurance Plan added</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">1 day ago</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/40 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Open enrollment period starts next week</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Renewals */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upcoming Renewals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-warning-200 dark:border-warning-900/60 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertCircle className="w-5 h-5 text-warning-600" />
                          <span className="font-semibold text-warning-900 dark:text-warning-300">Health Insurance</span>
                        </div>
                        <p className="text-sm text-warning-700 dark:text-warning-400">Annual renewal due in 15 days</p>
                        <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">12 employees affected</p>
                      </div>

                      <div className="p-4 border border-info-200 dark:border-info-900/60 bg-info-50 dark:bg-info-900/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="w-5 h-5 text-info-600" />
                          <span className="font-semibold text-info-900 dark:text-info-300">Life Insurance</span>
                        </div>
                        <p className="text-sm text-info-700 dark:text-info-400">Monthly renewal in 7 days</p>
                        <p className="text-xs text-info-600 dark:text-info-400 mt-1">8 employees affected</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'enrollments' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search employees or benefits..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-4">
                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="p-4 border border-slate-200 dark:border-neutral-800 rounded-lg">
                            <div className="animate-pulse">
                              <div className="h-4 bg-slate-200 dark:bg-neutral-700 rounded mb-2"></div>
                              <div className="h-3 bg-slate-200 dark:bg-neutral-700 rounded w-3/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredBenefits.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No benefits found</h3>
                        <p className="text-slate-700 dark:text-slate-300">Try adjusting your search or filter criteria</p>
                      </div>
                    ) : (
                      filteredBenefits.map((benefit) => (
                        <div key={benefit.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getBenefitTypeColor(benefit.benefitType)}`}>
                                {getBenefitTypeIcon(benefit.benefitType)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{benefit.employeeName}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{benefit.planName || benefit.benefitType}</p>
                                <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                                  <span>Rp {benefit.amount.toLocaleString()}</span>
                                  <span>•</span>
                                  <span>{benefit.frequency}</span>
                                  <span>•</span>
                                  <span>Since {new Date(benefit.effectiveDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge tone={getStatusTone(benefit.status)}>{getStatusLabel(benefit.status)}</Badge>

                              <div className="flex gap-2">
                                <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Benefits by Type */}
                    <div className="bg-slate-50 dark:bg-neutral-800/60 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Benefits by Type</h3>
                      <div className="space-y-3">
                        {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBenefitTypeColor(type)}`}>
                                {getBenefitTypeIcon(type)}
                              </div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{type}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enrollment Trends */}
                    <div className="bg-slate-50 dark:bg-neutral-800/60 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Enrollment Trends</h3>
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-700 dark:text-slate-300">Analytics chart will be displayed here</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Integration with charting library needed</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'plans' && (
                <div className="space-y-6">
                  <div className="flex gap-2 border-b border-slate-200 dark:border-neutral-800 pb-3">
                    <button
                      onClick={() => setPlansSubTab('generic')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        plansSubTab === 'generic' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Benefit Plans (BPJS, dll.)
                    </button>
                    <button
                      onClick={() => setPlansSubTab('insurance')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        plansSubTab === 'insurance' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Insurance Plans
                    </button>
                    <button
                      onClick={() => setPlansSubTab('allowances')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        plansSubTab === 'allowances' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Allowances
                    </button>
                    <button
                      onClick={() => setPlansSubTab('flexible')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        plansSubTab === 'flexible' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Flexible Benefits
                    </button>
                    <button
                      onClick={() => setPlansSubTab('retirement')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        plansSubTab === 'retirement' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Retirement Plans
                    </button>
                    <button
                      onClick={() => setPlansSubTab('continuation')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        plansSubTab === 'continuation' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Perpanjangan Asuransi
                    </button>
                  </div>

                  {plansSubTab === 'continuation' ? (
                    <>
                      <div className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Inisiasi Perpanjangan Asuransi Mandiri</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Untuk karyawan yang baru resign/terminated dan ingin melanjutkan asuransi secara mandiri (bayar sendiri) selama masa transisi.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="number" placeholder="Employee ID" value={newContinuation.employeeId || ''}
                            onChange={(e) => setNewContinuation({ ...newContinuation, employeeId: Number(e.target.value) })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          />
                          <input
                            type="date" placeholder="Tanggal terminasi" value={newContinuation.terminationDate}
                            onChange={(e) => setNewContinuation({ ...newContinuation, terminationDate: e.target.value })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          />
                          <input
                            type="number" placeholder="Premi bulanan" value={newContinuation.monthlyPremium || ''}
                            onChange={(e) => setNewContinuation({ ...newContinuation, monthlyPremium: Number(e.target.value) })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          />
                        </div>
                        <Button variant="primary" size="sm" onClick={handleInitiateContinuation} disabled={savingContinuation}>
                          <Plus size={14} className="mr-2" /> {savingContinuation ? 'Menyimpan...' : 'Inisiasi'}
                        </Button>
                      </div>

                      <div className="space-y-3 mt-4">
                        {continuationsLoading ? (
                          <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
                        ) : continuations.length === 0 ? (
                          <div className="text-center py-8 text-sm text-slate-600 dark:text-slate-400">Belum ada perpanjangan asuransi.</div>
                        ) : (
                          continuations.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">{c.employeeName || `Employee #${c.employeeId}`}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  Berakhir {new Date(c.continuationEndDate).toLocaleDateString()} · Terakhir bayar {c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString() : '—'}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge tone={c.status === 'active' ? 'success' : c.status === 'expired' ? 'neutral' : 'danger'}>{c.status}</Badge>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Rp {c.monthlyPremium.toLocaleString()}/bln</span>
                                <button
                                  onClick={() => handleRecordPayment(c)}
                                  className="px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors"
                                >
                                  Catat Pembayaran
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : plansSubTab === 'allowances' ? (
                    <SimpleCrudManager<Allowance>
                      title="Allowance"
                      active={activeTab === 'plans' && plansSubTab === 'allowances'}
                      fields={[
                        { key: 'name', label: 'Nama allowance', type: 'text' },
                        { key: 'category', label: 'Kategori', type: 'select', defaultValue: 'transport', options: [
                          { value: 'transport', label: 'Transport' }, { value: 'meal', label: 'Meal' },
                          { value: 'housing', label: 'Housing' }, { value: 'education', label: 'Education' },
                          { value: 'health', label: 'Health' }, { value: 'other', label: 'Other' },
                        ]},
                        { key: 'amount', label: 'Jumlah', type: 'number' },
                        { key: 'frequency', label: 'Frekuensi', type: 'select', defaultValue: 'monthly', options: [
                          { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' },
                        ]},
                      ]}
                      fetchItems={() => benefitsService.getAllowances()}
                      createItem={(data) => benefitsService.createAllowance({ ...data, active: true, taxable: true })}
                      deleteItem={(id) => benefitsService.deleteAllowance(id)}
                      renderTitle={(a) => a.name}
                      renderSubtitle={(a) => `${a.category} · ${a.frequency}`}
                      renderValue={(a) => `Rp ${a.amount.toLocaleString()}`}
                    />
                  ) : plansSubTab === 'flexible' ? (
                    <SimpleCrudManager<FlexibleBenefit>
                      title="Flexible Benefit"
                      active={activeTab === 'plans' && plansSubTab === 'flexible'}
                      fields={[
                        { key: 'name', label: 'Nama benefit', type: 'text' },
                        { key: 'category', label: 'Kategori', type: 'select', defaultValue: 'health', options: [
                          { value: 'health', label: 'Health' }, { value: 'wellness', label: 'Wellness' },
                          { value: 'learning', label: 'Learning' }, { value: 'commuter', label: 'Commuter' }, { value: 'other', label: 'Other' },
                        ]},
                        { key: 'maxAmount', label: 'Maksimal jumlah', type: 'number' },
                        { key: 'provider', label: 'Provider', type: 'text' },
                      ]}
                      fetchItems={() => benefitsService.getFlexibleBenefits()}
                      createItem={(data) => benefitsService.createFlexibleBenefit({ ...data, active: true, taxAdvantaged: false })}
                      deleteItem={(id) => benefitsService.updateFlexibleBenefit(id, { active: false })}
                      renderTitle={(f) => f.name}
                      renderSubtitle={(f) => `${f.category} · ${f.provider || '—'}`}
                      renderValue={(f) => `Maks Rp ${f.maxAmount.toLocaleString()}`}
                    />
                  ) : plansSubTab === 'retirement' ? (
                    <SimpleCrudManager<RetirementPlan>
                      title="Retirement Plan"
                      active={activeTab === 'plans' && plansSubTab === 'retirement'}
                      fields={[
                        { key: 'name', label: 'Nama plan', type: 'text' },
                        { key: 'provider', label: 'Provider', type: 'text' },
                        { key: 'planType', label: 'Tipe', type: 'select', defaultValue: 'defined_contribution', options: [
                          { value: 'defined_benefit', label: 'Defined Benefit' },
                          { value: 'defined_contribution', label: 'Defined Contribution' },
                          { value: 'hybrid', label: 'Hybrid' },
                        ]},
                        { key: 'employeeContribution', label: 'Kontribusi karyawan (%)', type: 'number' },
                        { key: 'employerContribution', label: 'Kontribusi perusahaan (%)', type: 'number' },
                        { key: 'retirementAge', label: 'Usia pensiun', type: 'number', defaultValue: 55 },
                      ]}
                      fetchItems={() => benefitsService.getRetirementPlans()}
                      createItem={(data) => benefitsService.createRetirementPlan({ ...data, active: true })}
                      deleteItem={(id) => benefitsService.updateRetirementPlan(id, { active: false })}
                      renderTitle={(r) => r.name}
                      renderSubtitle={(r) => `${r.provider || '—'} · usia pensiun ${r.retirementAge}`}
                      renderValue={(r) => `${r.employeeContribution}% / ${r.employerContribution}%`}
                    />
                  ) : plansSubTab === 'insurance' ? (
                    <>
                      <div className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tambah Insurance Plan Baru</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text" placeholder="Nama plan" value={newInsurancePlan.name}
                            onChange={(e) => setNewInsurancePlan({ ...newInsurancePlan, name: e.target.value })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          />
                          <select
                            value={newInsurancePlan.type}
                            onChange={(e) => setNewInsurancePlan({ ...newInsurancePlan, type: e.target.value })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          >
                            <option value="health">Health</option>
                            <option value="dental">Dental</option>
                            <option value="life">Life</option>
                            <option value="disability">Disability</option>
                          </select>
                          <input
                            type="text" placeholder="Provider" value={newInsurancePlan.provider}
                            onChange={(e) => setNewInsurancePlan({ ...newInsurancePlan, provider: e.target.value })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          />
                          <input
                            type="number" placeholder="Coverage amount" value={newInsurancePlan.coverageAmount || ''}
                            onChange={(e) => setNewInsurancePlan({ ...newInsurancePlan, coverageAmount: Number(e.target.value) })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          />
                          <input
                            type="number" placeholder="Premi" value={newInsurancePlan.premiumAmount || ''}
                            onChange={(e) => setNewInsurancePlan({ ...newInsurancePlan, premiumAmount: Number(e.target.value) })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          />
                          <select
                            value={newInsurancePlan.premiumFrequency}
                            onChange={(e) => setNewInsurancePlan({ ...newInsurancePlan, premiumFrequency: e.target.value })}
                            className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                          </select>
                        </div>
                        <Button variant="primary" size="sm" onClick={handleCreateInsurancePlan} disabled={savingInsurancePlan}>
                          <Plus size={14} className="mr-2" /> {savingInsurancePlan ? 'Menyimpan...' : 'Simpan Plan'}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {insurancePlansLoading ? (
                          <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
                        ) : insurancePlans.length === 0 ? (
                          <div className="text-center py-8 text-sm text-slate-600 dark:text-slate-400">Belum ada insurance plan.</div>
                        ) : (
                          insurancePlans.map((plan) => (
                            <div key={plan.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">{plan.name}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{plan.type} · {plan.provider || '—'} · Premi {plan.premiumFrequency}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Rp {plan.coverageAmount.toLocaleString()}</span>
                                <button
                                  onClick={() => handleDeleteInsurancePlan(plan)}
                                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg transition-colors"
                                  title="Nonaktifkan plan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                  <>
                  <div className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tambah Benefit Plan Baru</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text" placeholder="Nama plan" value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <select
                        value={newPlan.category}
                        onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      >
                        <option value="health">Health</option>
                        <option value="life">Life</option>
                        <option value="dental">Dental</option>
                        <option value="vision">Vision</option>
                        <option value="pension">Pension</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="text" placeholder="Provider" value={newPlan.provider}
                        onChange={(e) => setNewPlan({ ...newPlan, provider: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <input
                        type="number" placeholder="Coverage amount" value={newPlan.coverageAmount || ''}
                        onChange={(e) => setNewPlan({ ...newPlan, coverageAmount: Number(e.target.value) })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <input
                        type="number" placeholder="Kontribusi karyawan" value={newPlan.employeeContribution || ''}
                        onChange={(e) => setNewPlan({ ...newPlan, employeeContribution: Number(e.target.value) })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <input
                        type="number" placeholder="Kontribusi perusahaan" value={newPlan.employerContribution || ''}
                        onChange={(e) => setNewPlan({ ...newPlan, employerContribution: Number(e.target.value) })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleCreatePlan} disabled={savingPlan}>
                      <Plus size={14} className="mr-2" /> {savingPlan ? 'Menyimpan...' : 'Simpan Plan'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {plansLoading ? (
                      <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
                    ) : plans.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-600 dark:text-slate-400">Belum ada benefit plan.</div>
                    ) : (
                      plans.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{plan.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{plan.category} · {plan.provider || '—'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Rp {plan.coverageAmount.toLocaleString()}</span>
                            <button
                              onClick={() => handleDeletePlan(plan)}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg transition-colors"
                              title="Nonaktifkan plan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsDashboard;