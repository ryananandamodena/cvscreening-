import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Users, BarChart3, PieChart,
  Plus, Settings, Download, Calculator, Target, Award,
  AlertTriangle, CheckCircle2, Clock, UserCheck, Eye
} from 'lucide-react';
import { compensationService, CompensationStructure, CompensationAnalytics, SalaryGrade } from '../../services/compensation.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const CompensationDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [structures, setStructures] = useState<CompensationStructure[]>([]);
  const [grades, setGrades] = useState<SalaryGrade[]>([]);
  const [analytics, setAnalytics] = useState<CompensationAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [structuresData, gradesData, analyticsData] = await Promise.all([
        compensationService.getCompensationStructures(),
        compensationService.getSalaryGrades(),
        compensationService.getCompensationAnalytics()
      ]);
      setStructures(structuresData);
      setGrades(gradesData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch compensation data:', err);
      showToast('error', 'Failed to load compensation data');
    } finally {
      setLoading(false);
    }
  };

  const filteredStructures = structures.filter(structure => {
    const matchesSearch = structure.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         structure.positionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || structure.gradeName === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const stats = analytics ? {
    totalEmployees: analytics.totalEmployees,
    averageSalary: analytics.averageSalary,
    medianSalary: analytics.medianSalary,
    compaRatio: analytics.compaRatio,
    budgetUtilization: analytics.budgetUtilization
  } : null;

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
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Comprehensive salary structures, bonuses, and compensation analysis.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<Calculator size={16} />}>
            Salary Calculator
          </Button>
          <Button variant="outline" icon={<Download size={16} />}>
            Export Report
          </Button>
          <Button variant="outline" icon={<Settings size={16} />}>
            Configure
          </Button>
          <Button icon={<Plus size={16} />}>
            Add Structure
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
          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-success-500/10 group-hover:scale-110 transition-transform duration-500">
                <Users size={24} className="text-success-600 dark:text-success-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Employees</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalEmployees}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Average Salary</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Rp {(stats.averageSalary ?? 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-info-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-info-500/10 group-hover:scale-110 transition-transform duration-500">
                <Target size={24} className="text-info-600 dark:text-info-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Compa Ratio</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{(stats.compaRatio ?? 0).toFixed(2)}</h3>
              <span className="text-xs font-bold text-info-500">vs market</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-warning-500/10 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp size={24} className="text-warning-600 dark:text-warning-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Budget Utilization</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.budgetUtilization}%</h3>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900/60 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Salary Grades</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Manage pay structures</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success-50 dark:bg-success-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-5 h-5 text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Bonuses</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Performance incentives</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-info-50 dark:bg-info-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calculator className="w-5 h-5 text-info-600 dark:text-info-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Salary Reviews</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Compensation adjustments</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-warning-50 dark:bg-warning-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-warning-600 dark:text-warning-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Market Data</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Competitive benchmarking</p>
                  </div>
                </div>
              </button>

              <div className="border-t border-slate-200 dark:border-neutral-800 pt-4 mt-4">
                <button className="w-full p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Budget Planning
                </button>
              </div>
            </div>
          </div>

          {/* Salary Grades Overview */}
          <div className="bg-white dark:bg-neutral-900/60 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Salary Grades</h2>
            <div className="space-y-3">
              {grades.slice(0, 5).map((grade) => (
                <div key={grade.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-neutral-800/40 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{grade.name || '-'}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      Rp {(grade.minSalary ?? 0).toLocaleString()} - {(grade.maxSalary ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Rp {(grade.midpoint ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">midpoint</p>
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
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('structures')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'structures'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Compensation Structures
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Salary Reviews
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Compensation Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Salary increase approved for John Doe</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">+8% increase • 2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Performance bonus paid to Sarah Wilson</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">Rp 5,000,000 • 1 day ago</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-warning-50 dark:bg-warning-500/10 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning-600 dark:text-warning-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Annual salary review cycle started</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">Due in 30 days</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Salary Distribution</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Below Market</span>
                          <span className="text-sm font-bold text-danger-600 dark:text-danger-400">12%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">At Market</span>
                          <span className="text-sm font-bold text-brand-600 dark:text-brand-400">68%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Above Market</span>
                          <span className="text-sm font-bold text-success-600 dark:text-success-400">20%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Budget Status</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Utilized</span>
                            <span className="text-slate-900 font-medium">78%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-3">
                            <div className="bg-brand-600 h-3 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">Rp 2.8B</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">of Rp 3.6B budget</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'structures' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search employees or positions..."
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

                  {/* Compensation Structures */}
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
                    ) : filteredStructures.length === 0 ? (
                      <div className="text-center py-12">
                        <DollarSign className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No compensation structures found</h3>
                        <p className="text-slate-700 dark:text-slate-300">Try adjusting your search or filter criteria</p>
                      </div>
                    ) : (
                      filteredStructures.map((structure) => (
                        <div key={structure.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center">
                                  <UserCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{structure.employeeName}</h3>
                                  <p className="text-slate-600 dark:text-slate-400">{structure.positionName} • {structure.gradeName}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base Salary</p>
                                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    Rp {structure.baseSalary.toLocaleString()}
                                  </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Allowances</p>
                                  <p className="text-lg font-bold text-success-600 dark:text-success-400">
                                    Rp {structure.allowances.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
                                  </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-4 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Compensation</p>
                                  <p className="text-lg font-bold text-brand-600">
                                    Rp {structure.totalCompensation.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                                <span>Effective: {new Date(structure.effectiveDate).toLocaleDateString()}</span>
                                {structure.endDate && (
                                  <>
                                    <span>•</span>
                                    <span>Expires: {new Date(structure.endDate).toLocaleDateString()}</span>
                                  </>
                                )}
                                <span>•</span>
                                <Badge tone={structure.status === 'active' ? 'success' : structure.status === 'pending' ? 'warning' : 'neutral'}>
                                  {structure.status}
                                </Badge>
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

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Salary Reviews</h3>
                    <Button size="sm">
                      Start Review Cycle
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Mock salary reviews */}
                    {[
                      { id: 1, employee: 'John Doe', current: 12000000, proposed: 13200000, increase: 10, status: 'pending' },
                      { id: 2, employee: 'Sarah Wilson', current: 15000000, proposed: 16500000, increase: 10, status: 'approved' },
                      { id: 3, employee: 'Mike Johnson', current: 18000000, proposed: 19800000, increase: 10, status: 'submitted' }
                    ].map((review) => (
                      <div key={review.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{review.employee}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Annual Review 2024</p>
                          </div>
                          <Badge tone={review.status === 'approved' ? 'success' : review.status === 'pending' ? 'warning' : 'info'}>
                            {review.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Salary</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">Rp {review.current.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proposed Salary</p>
                            <p className="text-lg font-bold text-brand-600">Rp {review.proposed.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Increase</p>
                            <p className="text-lg font-bold text-success-600 dark:text-success-400">+{review.increase}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Department Comparison */}
                    <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">By Department</h3>
                      <div className="space-y-3">
                        {analytics?.byDepartment.slice(0, 5).map((dept) => (
                          <div key={dept.department} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{dept.department}</span>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                Rp {(dept.averageSalary / 1000000).toFixed(1)}M
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300">{dept.employeeCount} employees</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grade Distribution */}
                    <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">By Grade</h3>
                      <div className="space-y-3">
                        {analytics?.byGrade.slice(0, 5).map((grade) => (
                          <div key={grade.grade} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{grade.grade}</span>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                Rp {(grade.averageSalary / 1000000).toFixed(1)}M
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300">{grade.utilization}% utilized</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
