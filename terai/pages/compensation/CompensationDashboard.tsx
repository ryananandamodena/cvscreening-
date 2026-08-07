import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, Users, BarChart3,
  Eye, Settings
} from 'lucide-react';
import { payrollService, SalaryConfiguration, PayGrade } from '../../services/payroll.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { Badge } from '../../components/ui/Badge';

// NOTE: this dashboard used to call compensationService (/compensation/structures,
// /compensation/grades, /compensation/analytics) — none of those endpoints exist
// anywhere in the backend, so the page was entirely non-functional against the
// real API (confirmed during cross-module integration research). Rewired to use
// payrollService, which is genuinely wired to GetSalaryConfigurations/GetPayGrades
// (/payroll/configurations, /payroll/grades). Market benchmarking, budget
// tracking, bonuses, and a dedicated salary-review workflow remain unbuilt —
// there's no backend for them — so those sections were removed rather than kept
// as fake/mock data. Salary-increase requests are handled from PayrollDashboard.tsx
// instead, which already submits into the existing salary_change approval flow.
const CompensationDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<SalaryConfiguration[]>([]);
  const [grades, setGrades] = useState<PayGrade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configsData, gradesData] = await Promise.all([
        payrollService.getSalaryConfigs(),
        payrollService.getPayGrades()
      ]);
      setConfigs(configsData);
      setGrades(gradesData);
    } catch (err) {
      console.error('Failed to fetch compensation data:', err);
      showToast('error', 'Failed to load compensation data');
    } finally {
      setLoading(false);
    }
  };

  const filteredConfigs = configs.filter(c => {
    const matchesSearch = (c.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || c.gradeName === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // Computed directly from real salary configuration data — no server-side
  // analytics endpoint exists for this yet.
  const stats = useMemo(() => {
    if (configs.length === 0) return null;
    const salaries = configs.map(c => c.baseSalary).sort((a, b) => a - b);
    const total = salaries.reduce((sum, s) => sum + s, 0);
    const mid = Math.floor(salaries.length / 2);
    const median = salaries.length % 2 === 0 ? (salaries[mid - 1] + salaries[mid]) / 2 : salaries[mid];
    return {
      totalEmployees: configs.length,
      averageSalary: total / configs.length,
      medianSalary: median,
      totalMonthlyCost: configs.reduce((sum, c) => sum + c.baseSalary + c.transportAllowance + c.mealAllowance + c.positionAllowance, 0),
    };
  }, [configs]);

  const byGrade = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    configs.forEach(c => {
      const key = c.gradeName || 'Unassigned';
      const entry = map.get(key) || { count: 0, total: 0 };
      entry.count += 1;
      entry.total += c.baseSalary;
      map.set(key, entry);
    });
    return Array.from(map.entries()).map(([grade, v]) => ({ grade, count: v.count, average: v.total / v.count }));
  }, [configs]);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <DollarSign size={32} />
            </div>
            Compensation Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Salary configuration and grade distribution, backed by real payroll data.</p>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
            <div className="p-4 rounded-2xl bg-success-500/10 w-fit mb-6">
              <Users size={24} className="text-success-600 dark:text-success-400" />
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Employees</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalEmployees}</h3>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
            <div className="p-4 rounded-2xl bg-brand-500/10 w-fit mb-6">
              <DollarSign size={24} className="text-brand-600 dark:text-brand-400" />
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Average Base Salary</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Rp {Math.round(stats.averageSalary).toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm">
            <div className="p-4 rounded-2xl bg-info-500/10 w-fit mb-6">
              <TrendingUp size={24} className="text-info-600 dark:text-info-400" />
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Monthly Cost</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Rp {Math.round(stats.totalMonthlyCost).toLocaleString()}</h3>
          </div>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Salary Grades */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900/60 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Salary Grades</h2>
            <div className="space-y-3">
              {grades.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">Belum ada grade.</p>
              ) : grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-neutral-800/40 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{grade.name}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      Rp {grade.minSalary.toLocaleString()} - {grade.maxSalary.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-neutral-900/60 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-neutral-800">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Salary Configurations
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  By Grade
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-neutral-800/40 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-neutral-800/40 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="all">All Grades</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.name}>{grade.name}</option>
                      ))}
                    </select>
                  </div>

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
                    ) : filteredConfigs.length === 0 ? (
                      <div className="text-center py-12">
                        <DollarSign className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No salary configurations found</h3>
                        <p className="text-slate-700 dark:text-slate-300">Try adjusting your search or filter criteria</p>
                      </div>
                    ) : (
                      filteredConfigs.map((c) => (
                        <div key={c.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center">
                                  <BarChart3 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{c.employeeName}</h3>
                                  <p className="text-slate-600 dark:text-slate-400">{c.gradeName || 'No Grade'}</p>
                                </div>
                                {!!c.latestPerformanceRating && (
                                  <Badge tone={c.latestPerformanceRating >= 4 ? 'success' : c.latestPerformanceRating >= 3 ? 'warning' : 'danger'}>
                                    Performa: {c.latestPerformanceRating.toFixed(1)}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base Salary</p>
                                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    Rp {c.baseSalary.toLocaleString()}
                                  </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Allowances</p>
                                  <p className="text-lg font-bold text-success-600 dark:text-success-400">
                                    Rp {(c.transportAllowance + c.mealAllowance + c.positionAllowance).toLocaleString()}
                                  </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Compensation</p>
                                  <p className="text-lg font-bold text-brand-600">
                                    Rp {(c.baseSalary + c.transportAllowance + c.mealAllowance + c.positionAllowance).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 ml-6">
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                                <Settings className="w-4 h-4" />
                              </button>
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
                  <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">By Grade</h3>
                    {byGrade.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">Belum ada data.</p>
                    ) : (
                      <div className="space-y-3">
                        {byGrade.map((g) => (
                          <div key={g.grade} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{g.grade}</span>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                Rp {Math.round(g.average / 1_000_000)}M avg
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300">{g.count} employees</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompensationDashboard;
