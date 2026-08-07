import React, { useState, useEffect } from 'react';
import {
  Users, Target, TrendingUp, Award, AlertTriangle,
  UserCheck, BarChart3, Plus, Settings, Download,
  Eye, Edit, ChevronRight, Star, Calendar
} from 'lucide-react';
import { successionService, SuccessionPlan, SuccessionCandidate, NineBoxGrid, CareerPath, LeadershipDevelopment } from '../../services/succession.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const SuccessionDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [candidates, setCandidates] = useState<SuccessionCandidate[]>([]);
  const [nineBox, setNineBox] = useState<NineBoxGrid[][]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  // Career Paths tab state
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [careerPathsLoading, setCareerPathsLoading] = useState(false);
  const [newCareerPath, setNewCareerPath] = useState({ employeeId: 0, currentPosition: '', targetPositionsInput: '' });
  const [savingCareerPath, setSavingCareerPath] = useState(false);

  // Leadership Programs tab state
  const [leadershipPrograms, setLeadershipPrograms] = useState<LeadershipDevelopment[]>([]);
  const [leadershipProgramsLoading, setLeadershipProgramsLoading] = useState(false);
  const [newLeadershipProgram, setNewLeadershipProgram] = useState({ programName: '', duration: 4, budget: 0 });
  const [savingLeadershipProgram, setSavingLeadershipProgram] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'careerpaths') fetchCareerPaths();
    if (activeTab === 'leadership') fetchLeadershipPrograms();
  }, [activeTab]);

  const fetchCareerPaths = async () => {
    try {
      setCareerPathsLoading(true);
      setCareerPaths(await successionService.getCareerPaths());
    } catch (err) {
      console.error('Failed to fetch career paths:', err);
      showToast('error', 'Failed to load career paths');
    } finally {
      setCareerPathsLoading(false);
    }
  };

  const handleCreateCareerPath = async () => {
    if (!newCareerPath.employeeId) {
      showToast('error', 'Employee ID wajib diisi');
      return;
    }
    try {
      setSavingCareerPath(true);
      const targetPositions = newCareerPath.targetPositionsInput.split(',').map(s => s.trim()).filter(Boolean);
      await successionService.createCareerPath({
        employeeId: newCareerPath.employeeId,
        currentPosition: newCareerPath.currentPosition,
        targetPositions,
        timeline: [],
      } as Partial<CareerPath>);
      showToast('success', 'Career path berhasil dibuat');
      setNewCareerPath({ employeeId: 0, currentPosition: '', targetPositionsInput: '' });
      fetchCareerPaths();
    } catch (err) {
      console.error('Failed to create career path:', err);
      showToast('error', 'Gagal membuat career path');
    } finally {
      setSavingCareerPath(false);
    }
  };

  const fetchLeadershipPrograms = async () => {
    try {
      setLeadershipProgramsLoading(true);
      setLeadershipPrograms(await successionService.getLeadershipPrograms());
    } catch (err) {
      console.error('Failed to fetch leadership programs:', err);
      showToast('error', 'Failed to load leadership programs');
    } finally {
      setLeadershipProgramsLoading(false);
    }
  };

  const handleCreateLeadershipProgram = async () => {
    if (!newLeadershipProgram.programName.trim()) {
      showToast('error', 'Nama program wajib diisi');
      return;
    }
    try {
      setSavingLeadershipProgram(true);
      await successionService.createLeadershipProgram({
        ...newLeadershipProgram,
        status: 'planning',
        startDate: new Date().toISOString().slice(0, 10),
      } as Partial<LeadershipDevelopment>);
      showToast('success', 'Program leadership berhasil dibuat');
      setNewLeadershipProgram({ programName: '', duration: 4, budget: 0 });
      fetchLeadershipPrograms();
    } catch (err) {
      console.error('Failed to create leadership program:', err);
      showToast('error', 'Gagal membuat program leadership');
    } finally {
      setSavingLeadershipProgram(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, candidatesData, nineBoxData] = await Promise.all([
        successionService.getSuccessionPlans(),
        successionService.getSuccessionCandidates(),
        successionService.getNineBoxGrid()
      ]);
      setPlans(plansData);
      setCandidates(candidatesData);
      setNineBox(nineBoxData);
    } catch (err) {
      console.error('Failed to fetch succession data:', err);
      showToast('error', 'Failed to load succession data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskTone = (risk: string): 'danger' | 'warning' | 'success' => {
    switch (risk) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  const getReadinessTone = (level: number): 'success' | 'warning' | 'danger' => {
    if (level >= 4) return 'success';
    if (level >= 2) return 'warning';
    return 'danger';
  };

  const getPotentialLabel = (rating: string | undefined) => {
    switch ((rating || '').toLowerCase()) {
      case 'a': return 'High Potential';
      case 'b': return 'Medium Potential';
      case 'c': return 'Low Potential';
      case 'd': return 'Development Needed';
      default: return rating || 'Unrated';
    }
  };

  // NOTE: the real backend (models.SuccessionPlan) only returns id/positionId/
  // incumbentId/priority/notes/positionName/incumbentName/candidates — fields like
  // department, riskLevel, criticalPosition, timeToFill, currentIncumbent don't exist
  // server-side yet. Every access below falls back to a safe default instead of
  // crashing on undefined, until those fields are either added to the backend or
  // removed from this richer aspirational frontend model.
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = (plan.positionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plan.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || plan.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const stats = {
    totalPlans: plans.length,
    criticalPositions: plans.filter(p => p.criticalPosition).length,
    totalCandidates: candidates.length,
    highPotential: candidates.filter(c => c.potentialRating === 'A').length,
    avgReadiness: candidates.length > 0 ?
      Math.round(candidates.reduce((sum, c) => sum + (c.readinessLevel || 0), 0) / candidates.length * 10) / 10 : 0
  };

  const riskDistribution = {
    critical: plans.filter(p => p.riskLevel === 'critical').length,
    high: plans.filter(p => p.riskLevel === 'high').length,
    medium: plans.filter(p => p.riskLevel === 'medium').length,
    low: plans.filter(p => p.riskLevel === 'low').length
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <Users size={32} />
            </div>
            Succession Planning
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Talent management, career development, and leadership succession.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<BarChart3 size={16} />}>
            Analytics
          </Button>
          <Button variant="outline" icon={<Download size={16} />}>
            Export
          </Button>
          <Button variant="outline" icon={<Settings size={16} />}>
            Configure
          </Button>
          <Button icon={<Plus size={16} />}>
            New Plan
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-success-500/10 group-hover:scale-110 transition-transform duration-500">
                <Target size={24} className="text-success-600 dark:text-success-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Succession Plans</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalPlans}</h3>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{stats.criticalPositions} critical</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                <Users size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Talent Pool</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalCandidates}</h3>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{stats.highPotential} high potential</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-info-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-info-500/10 group-hover:scale-110 transition-transform duration-500">
                <Star size={24} className="text-info-600 dark:text-info-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Avg Readiness</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.avgReadiness}</h3>
              <span className="text-xs font-bold text-info-600 dark:text-info-400">out of 5.0</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900/60 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-warning-500/10 group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle size={24} className="text-warning-600 dark:text-warning-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Critical Risks</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{riskDistribution.critical}</h3>
              <span className="text-xs font-bold text-warning-600 dark:text-warning-500">high priority</span>
            </div>
          </div>
        </div>
      )}

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
                    <Target size={20} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Nine Box Grid</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Performance vs Potential</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success-50 dark:bg-success-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award size={20} className="text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Talent Pool</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">High-potential employees</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-info-50 dark:bg-info-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp size={20} className="text-info-600 dark:text-info-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Career Paths</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Development planning</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-warning-50 dark:bg-warning-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar size={20} className="text-warning-600 dark:text-warning-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Assessments</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Readiness evaluations</p>
                  </div>
                </div>
              </button>

              <div className="border-t border-slate-200 dark:border-neutral-800 pt-4 mt-4">
                <button className="w-full p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Assessment
                </button>
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white dark:bg-neutral-900/60 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Risk Distribution</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Critical</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{riskDistribution.critical}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-danger-400 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">High</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{riskDistribution.high}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Medium</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{riskDistribution.medium}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Low</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{riskDistribution.low}</span>
              </div>
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
                  onClick={() => setActiveTab('plans')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'plans'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Succession Plans
                </button>
                <button
                  onClick={() => setActiveTab('talent')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'talent'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Talent Pool
                </button>
                <button
                  onClick={() => setActiveTab('ninebox')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'ninebox'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  9-Box Grid
                </button>
                <button
                  onClick={() => setActiveTab('careerpaths')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'careerpaths'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Career Paths
                </button>
                <button
                  onClick={() => setActiveTab('leadership')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'leadership'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Leadership Programs
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Succession Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-success-50 dark:bg-success-500/10 rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">John Doe added to Senior Manager succession plan</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">2 hours ago • High potential candidate</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Leadership development program completed</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">1 day ago • 5 participants graduated</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-warning-50 dark:bg-warning-500/10 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Critical position identified: VP Engineering</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">3 days ago • No ready successors</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Talent Pool */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Talent Pool</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {candidates.slice(0, 6).map((candidate) => (
                        <div key={candidate.id} className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{candidate.employeeName}</h4>
                              <p className="text-xs text-slate-700 dark:text-slate-300">{candidate.position}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Readiness:</span>
                              <Badge tone={getReadinessTone(candidate.readinessLevel)}>{candidate.readinessLevel}/5</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Potential:</span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {getPotentialLabel(candidate.potentialRating)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'plans' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search positions or departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-300 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="all">All Risk Levels</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {/* Succession Plans */}
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
                    ) : filteredPlans.length === 0 ? (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No succession plans found</h3>
                        <p className="text-slate-700 dark:text-slate-300">Create your first succession plan to identify critical positions</p>
                      </div>
                    ) : (
                      filteredPlans.map((plan) => (
                        <div key={plan.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                                  <Target className="w-6 h-6 text-brand-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.positionName}</h3>
                                  <p className="text-slate-600 dark:text-slate-400">{plan.department || '—'}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Risk Level</p>
                                  <Badge tone={getRiskTone(plan.riskLevel)}>{plan.riskLevel || '—'}</Badge>
                                </div>

                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Candidates</p>
                                  <p className="text-lg font-bold text-slate-900 dark:text-white">{plan.candidates?.length ?? 0}</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time to Fill</p>
                                  <p className="text-lg font-bold text-slate-900 dark:text-white">{plan.timeToFill != null ? `${plan.timeToFill} months` : '—'}</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-neutral-800/40 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</p>
                                  <Badge tone={plan.status === 'active' ? 'success' : plan.status === 'in_progress' ? 'info' : 'neutral'}>
                                    {(plan.status || 'unknown').replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>

                              {plan.criticalPosition && (
                                <div className="flex items-center gap-2 text-sm text-warning-700 dark:text-warning-500 bg-warning-50 dark:bg-warning-500/10 px-3 py-2 rounded-lg">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="font-medium">Critical Position</span>
                                  <span className="text-warning-600 dark:text-warning-500">• Requires immediate attention</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 ml-6">
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-lg transition-colors">
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

              {activeTab === 'talent' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Talent Pool Management</h3>
                    <Button size="sm">
                      Add to Talent Pool
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{candidate.employeeName}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{candidate.position}</p>
                            </div>
                          </div>
                          <Badge tone={
                            candidate.potentialRating === 'A' ? 'success' :
                            candidate.potentialRating === 'B' ? 'info' :
                            candidate.potentialRating === 'C' ? 'warning' :
                            'danger'
                          }>
                            {candidate.potentialRating}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600 dark:text-slate-400">Readiness Level</span>
                              <span className="font-medium text-slate-900 dark:text-white">{candidate.readinessLevel}/5</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  candidate.readinessLevel >= 4 ? 'bg-success-500' :
                                  candidate.readinessLevel >= 2 ? 'bg-info-500' : 'bg-danger-500'
                                }`}
                                style={{ width: `${(candidate.readinessLevel / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Experience:</span> {candidate.experience} years
                          </div>

                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Performance:</span> {candidate.performanceRating}/5
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium">
                            View Profile
                          </button>
                          <button className="px-3 py-2 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors text-sm font-medium">
                            Develop
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ninebox' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Nine Box Grid</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Performance vs Potential matrix for talent assessment</p>
                  </div>

                  {/* Nine Box Grid */}
                  <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {/* Row labels */}
                      <div className="text-center">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">High Performance</h4>
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Medium Performance</h4>
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Low Performance</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* High Potential */}
                      <div className="bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-success-800 dark:text-success-400 mb-2">High Potential</h5>
                        <div className="space-y-1">
                          <div className="text-xs bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400 px-2 py-1 rounded">
                            John Doe - Senior Developer
                          </div>
                          <div className="text-xs bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400 px-2 py-1 rounded">
                            Sarah Wilson - Product Manager
                          </div>
                        </div>
                      </div>

                      <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-brand-800 dark:text-brand-400 mb-2">High Potential</h5>
                        <div className="space-y-1">
                          <div className="text-xs bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 px-2 py-1 rounded">
                            Mike Johnson - QA Lead
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-slate-900 dark:text-white mb-2">High Potential</h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300">No employees</p>
                      </div>

                      {/* Medium Potential */}
                      <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-warning-800 dark:text-warning-500 mb-2">Medium Potential</h5>
                        <div className="space-y-1">
                          <div className="text-xs bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-500 px-2 py-1 rounded">
                            Lisa Chen - UX Designer
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-slate-900 dark:text-white mb-2">Medium Potential</h5>
                        <div className="space-y-1">
                          <div className="text-xs bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                            Tom Brown - DevOps Engineer
                          </div>
                          <div className="text-xs bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                            Anna Lee - HR Specialist
                          </div>
                        </div>
                      </div>

                      <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-danger-800 dark:text-danger-400 mb-2">Medium Potential</h5>
                        <p className="text-xs text-danger-600 dark:text-danger-400">Needs development</p>
                      </div>

                      {/* Low Potential */}
                      <div className="bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-slate-900 dark:text-white mb-2">Low Potential</h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300">Monitor performance</p>
                      </div>

                      <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-danger-800 dark:text-danger-400 mb-2">Low Potential</h5>
                        <div className="space-y-1">
                          <div className="text-xs bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400 px-2 py-1 rounded">
                            Performance improvement needed
                          </div>
                        </div>
                      </div>

                      <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg p-4 min-h-[120px]">
                        <h5 className="font-medium text-danger-800 dark:text-danger-400 mb-2">Low Potential</h5>
                        <div className="space-y-1">
                          <div className="text-xs bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400 px-2 py-1 rounded">
                            Requires immediate action
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                      <div><h4 className="font-semibold text-slate-900 dark:text-white">High Potential</h4></div>
                      <div><h4 className="font-semibold text-slate-900 dark:text-white">Medium Potential</h4></div>
                      <div><h4 className="font-semibold text-slate-900 dark:text-white">Low Potential</h4></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'careerpaths' && (
                <div className="space-y-6">
                  <div className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Buat Career Path Baru</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="number" placeholder="Employee ID" value={newCareerPath.employeeId || ''}
                        onChange={(e) => setNewCareerPath({ ...newCareerPath, employeeId: Number(e.target.value) })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <input
                        type="text" placeholder="Posisi saat ini" value={newCareerPath.currentPosition}
                        onChange={(e) => setNewCareerPath({ ...newCareerPath, currentPosition: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <input
                        type="text" placeholder="Target posisi (pisah koma)" value={newCareerPath.targetPositionsInput}
                        onChange={(e) => setNewCareerPath({ ...newCareerPath, targetPositionsInput: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleCreateCareerPath} disabled={savingCareerPath}>
                      <Plus size={14} className="mr-2" /> {savingCareerPath ? 'Menyimpan...' : 'Simpan Career Path'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {careerPathsLoading ? (
                      <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
                    ) : careerPaths.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-600 dark:text-slate-400">Belum ada career path.</div>
                    ) : (
                      careerPaths.map((cp) => (
                        <div key={cp.id} className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{cp.employeeName || `Employee #${cp.employeeId}`}</p>
                            {!!cp.performanceScore && (
                              <Badge tone={cp.performanceScore >= 4 ? 'success' : cp.performanceScore >= 3 ? 'warning' : 'danger'}>
                                Performa: {cp.performanceScore.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {cp.currentPosition || '—'} → {(cp.targetPositions || []).join(', ') || '—'}
                          </p>
                          {cp.milestones && cp.milestones.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cp.milestones.map((m, idx) => (
                                <Badge key={idx} tone={m.status === 'completed' ? 'success' : m.status === 'overdue' ? 'danger' : 'neutral'}>{m.title}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'leadership' && (
                <div className="space-y-6">
                  <div className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Buat Program Leadership Baru</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text" placeholder="Nama program" value={newLeadershipProgram.programName}
                        onChange={(e) => setNewLeadershipProgram({ ...newLeadershipProgram, programName: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <input
                        type="number" placeholder="Durasi (minggu)" value={newLeadershipProgram.duration || ''}
                        onChange={(e) => setNewLeadershipProgram({ ...newLeadershipProgram, duration: Number(e.target.value) })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                      <input
                        type="number" placeholder="Budget" value={newLeadershipProgram.budget || ''}
                        onChange={(e) => setNewLeadershipProgram({ ...newLeadershipProgram, budget: Number(e.target.value) })}
                        className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
                      />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleCreateLeadershipProgram} disabled={savingLeadershipProgram}>
                      <Plus size={14} className="mr-2" /> {savingLeadershipProgram ? 'Menyimpan...' : 'Simpan Program'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {leadershipProgramsLoading ? (
                      <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
                    ) : leadershipPrograms.length === 0 ? (
                      <div className="text-center py-8 text-sm text-slate-600 dark:text-slate-400">Belum ada program leadership.</div>
                    ) : (
                      leadershipPrograms.map((lp) => (
                        <div key={lp.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{lp.programName}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{lp.duration} minggu · {lp.participants?.length || 0} peserta</p>
                          </div>
                          <Badge tone={lp.status === 'active' ? 'success' : lp.status === 'completed' ? 'neutral' : 'warning'}>{lp.status}</Badge>
                        </div>
                      ))
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

export default SuccessionDashboard;