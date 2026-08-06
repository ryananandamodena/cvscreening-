import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Users, Target, AlertTriangle,
  Brain, LineChart, PieChart, Activity, Download,
  Settings, Filter, Calendar, Zap, Award, DollarSign,
  Clock, UserCheck, Eye, RefreshCw
} from 'lucide-react';
import { analyticsService, WorkforceMetrics, PerformanceAnalytics, PredictiveAnalytics } from '../../services/analytics.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdvancedAnalyticsDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('12months');
  const [loading, setLoading] = useState(true);

  // Data states
  const [workforceMetrics, setWorkforceMetrics] = useState<WorkforceMetrics | null>(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<PredictiveAnalytics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
    // Set up real-time updates
    const unsubscribe = analyticsService.subscribeToRealTimeUpdates((data) => {
      setRealTimeMetrics(data);
    });
    return unsubscribe;
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [workforce, performance, predictive, realtime] = await Promise.all([
        analyticsService.getWorkforceMetrics({ dateRange: getDateRange() }),
        analyticsService.getPerformanceAnalytics({ period: timeRange }),
        analyticsService.getPredictiveAnalytics(timeRange),
        analyticsService.getRealTimeMetrics()
      ]);

      setWorkforceMetrics(workforce);
      setPerformanceAnalytics(performance);
      setPredictiveAnalytics(predictive);
      setRealTimeMetrics(realtime);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      showToast('error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (timeRange) {
      case '3months':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(end.getMonth() - 6);
        break;
      case '12months':
        start.setMonth(end.getMonth() - 12);
        break;
      case '24months':
        start.setMonth(end.getMonth() - 24);
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const calculateDiversityScore = (diversity: any) => {
    // Simple diversity calculation - in real implementation would be more sophisticated
    if (!diversity || !diversity.genderDistribution) return 0;
    const genderRatio = (diversity.genderDistribution.female || 1) / (diversity.genderDistribution.male || 1);
    return Math.min(100, Math.abs(genderRatio - 1) * 50);
  };

  // Computed metrics
  const keyMetrics = useMemo(() => {
    if (!workforceMetrics || !performanceAnalytics || !predictiveAnalytics) return null;

    return {
      headcount: workforceMetrics.totalEmployees,
      turnoverRisk: predictiveAnalytics.turnoverPrediction.riskCategories.high,
      avgPerformance: performanceAnalytics.averagePerformanceRating,
      diversityScore: calculateDiversityScore(workforceMetrics.diversityMetrics),
      hiringNeeds: predictiveAnalytics.hiringNeeds.departmentsNeedingHire.length,
      skillGaps: predictiveAnalytics.skillDemand.skillGapAnalysis.length,
      pendingApprovals: realTimeMetrics?.pendingApprovals || 0
    };
  }, [workforceMetrics, performanceAnalytics, predictiveAnalytics, realTimeMetrics]);

  const predictiveInsights = useMemo(() => {
    if (!predictiveAnalytics) return [];

    const insights = [];

    if (predictiveAnalytics.turnoverPrediction.riskCategories.high > 5) {
      insights.push({
        type: 'warning',
        title: 'High Turnover Risk',
        description: `${predictiveAnalytics.turnoverPrediction.riskCategories.high} employees at high risk of leaving`,
        action: 'Implement retention strategies'
      });
    }

    if (predictiveAnalytics.hiringNeeds.departmentsNeedingHire.length > 0) {
      insights.push({
        type: 'info',
        title: 'Hiring Needs Identified',
        description: `${predictiveAnalytics.hiringNeeds.departmentsNeedingHire.length} departments need new hires`,
        action: 'Review hiring plans'
      });
    }

    if (predictiveAnalytics.skillDemand.skillGapAnalysis.length > 3) {
      insights.push({
        type: 'alert',
        title: 'Critical Skill Gaps',
        description: `${predictiveAnalytics.skillDemand.skillGapAnalysis.length} skills have significant gaps`,
        action: 'Develop training programs'
      });
    }

    return insights;
  }, [predictiveAnalytics]);

  if (loading) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <Brain size={32} />
            </div>
            Advanced Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">AI-powered HR insights, predictive analytics, and workforce intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="24months">Last 24 Months</option>
          </select>
          <Button variant="secondary" size="md" icon={<RefreshCw size={16} />} onClick={fetchAnalyticsData}>
            Refresh
          </Button>
          <Button variant="secondary" size="md" icon={<Download size={16} />}>
            Export
          </Button>
          <Button variant="primary" size="md" icon={<Settings size={16} />}>
            Configure
          </Button>
        </div>
      </div>

      {/* Workforce/performance/turnover-risk/hiring-need numbers below are now computed
          live from the database (see analytics_extended_repository.go). Predictive
          numbers are a simple rule-based heuristic, not a trained ML model. Skill-gap
          and growth-forecast analytics are not implemented yet and render empty. */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-info-300 dark:border-info-700 bg-info-50 dark:bg-info-950/40 text-info-800 dark:text-info-300">
        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
        <div className="text-sm font-medium">
          Data workforce, performa, dan kebutuhan hiring di halaman ini sudah live dari database.
          Prediksi turnover menggunakan aturan sederhana (heuristik), <span className="font-bold">bukan model machine learning</span> —
          gunakan sebagai indikasi awal, bukan angka pasti. Analisis skill-gap & proyeksi pertumbuhan belum tersedia.
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      {keyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                <Users size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Headcount</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{keyMetrics.headcount}</h3>
              <span className="text-xs font-bold text-brand-500">+2.1% from last month</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-danger-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-danger-500/10 group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle size={24} className="text-danger-600 dark:text-danger-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Turnover Risk</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{keyMetrics.turnoverRisk}</h3>
              <span className="text-xs font-bold text-danger-500">high risk employees</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-success-500/10 group-hover:scale-110 transition-transform duration-500">
                <Award size={24} className="text-success-600 dark:text-success-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Avg Performance</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{keyMetrics.avgPerformance.toFixed(1)}</h3>
              <span className="text-xs font-bold text-success-500">out of 5.0</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-info-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-info-500/10 group-hover:scale-110 transition-transform duration-500">
                <Activity size={24} className="text-info-600 dark:text-info-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Approvals</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{keyMetrics.pendingApprovals}</h3>
              <span className="text-xs font-bold text-info-500">live</span>
            </div>
          </div>
        </div>
      )}

      {/* AI-Powered Insights */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
              <p className="text-brand-100">Predictive analytics and intelligent recommendations</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{predictiveInsights.length}</div>
            <div className="text-sm text-brand-200">Active Insights</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictiveInsights.map((insight, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  insight.type === 'warning' ? 'bg-warning-500/20' :
                  insight.type === 'alert' ? 'bg-danger-500/20' : 'bg-info-500/20'
                }`}>
                  {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-warning-300" />}
                  {insight.type === 'alert' && <AlertTriangle className="w-4 h-4 text-danger-300" />}
                  {insight.type === 'info' && <TrendingUp className="w-4 h-4 text-info-300" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-brand-100 mb-2">{insight.description}</p>
                  <button className="text-sm text-brand-200 hover:text-white transition-colors underline">
                    {insight.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Charts & Analytics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Workforce Overview */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workforce Overview</h2>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Live Data</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department Distribution */}
              <div className="bg-slate-50 dark:bg-neutral-800 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">By Department</h3>
                <div className="space-y-3">
                  {workforceMetrics?.headcountByDepartment && Object.entries(workforceMetrics.headcountByDepartment)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{dept}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
                            <div
                              className="bg-brand-600 h-2 rounded-full"
                              style={{ width: `${(count / workforceMetrics.totalEmployees) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Performance Trends */}
              <div className="bg-slate-50 dark:bg-neutral-800 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Performance Trends</h3>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 dark:text-slate-300">Performance trend chart</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Interactive chart component needed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Predictive Analytics */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Predictive Analytics</h2>
              <button className="px-4 py-2 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors text-sm font-medium">
                View Full Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Turnover Prediction */}
              <div className="text-center p-4 border border-slate-200 dark:border-neutral-700 rounded-xl">
                <div className="w-12 h-12 bg-danger-50 dark:bg-danger-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-500" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Turnover Risk</h4>
                <p className="text-2xl font-bold text-danger-600 dark:text-danger-500 mb-1">
                  {predictiveAnalytics?.turnoverPrediction.predictedTurnoverRate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Predicted next 12 months</p>
              </div>

              {/* Hiring Needs */}
              <div className="text-center p-4 border border-slate-200 dark:border-neutral-700 rounded-xl">
                <div className="w-12 h-12 bg-info-50 dark:bg-info-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="w-6 h-6 text-info-600 dark:text-info-500" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Hiring Needs</h4>
                <p className="text-2xl font-bold text-info-600 dark:text-info-500 mb-1">
                  {predictiveAnalytics?.hiringNeeds.departmentsNeedingHire.length}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Departments need hires</p>
              </div>

              {/* Skill Gaps */}
              <div className="text-center p-4 border border-slate-200 dark:border-neutral-700 rounded-xl">
                <div className="w-12 h-12 bg-warning-50 dark:bg-warning-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-warning-600 dark:text-warning-500" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Skill Gaps</h4>
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-500 mb-1">
                  {predictiveAnalytics?.skillDemand.skillGapAnalysis.length}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Critical skill shortages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Insights & Actions */}
        <div className="space-y-8">
          {/* Key Insights */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Key Insights</h2>
            <div className="space-y-4">
              <div className="p-4 bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-success-600 dark:text-success-400" />
                  <span className="font-semibold text-success-800 dark:text-success-400">Performance Improving</span>
                </div>
                <p className="text-sm text-success-700 dark:text-success-400">Average performance rating increased by 8% this quarter</p>
              </div>

              <div className="p-4 bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-info-600 dark:text-info-500" />
                  <span className="font-semibold text-info-800 dark:text-info-400">Training ROI</span>
                </div>
                <p className="text-sm text-info-700 dark:text-info-400">Training programs showing 240% ROI on investment</p>
              </div>

              <div className="p-4 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span className="font-semibold text-brand-800 dark:text-brand-400">Cost Optimization</span>
                </div>
                <p className="text-sm text-brand-700 dark:text-brand-400">15% reduction in recruitment costs through predictive hiring</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full p-4 border border-slate-200 dark:border-neutral-700 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/40 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Generate Report</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Create comprehensive analytics report</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-700 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success-50 dark:bg-success-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5 text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Predictive Models</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Run advanced predictive analytics</p>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 border border-slate-200 dark:border-neutral-700 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors text-left group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Configure Dashboards</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Customize analytics dashboards</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Real-time Status */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Employees Clocked In Today</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{realTimeMetrics?.employeesClockedInToday || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Pending Leave Requests</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{realTimeMetrics?.pendingLeaveRequests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Last Update</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {realTimeMetrics?.lastUpdate ? new Date(realTimeMetrics.lastUpdate).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Tabs */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-neutral-700">
          <nav className="flex overflow-x-auto">
            {[
              { id: 'workforce', label: 'Workforce Planning', icon: Users },
              { id: 'performance', label: 'Performance Analytics', icon: Award },
              { id: 'compensation', label: 'Compensation Intelligence', icon: DollarSign },
              { id: 'predictive', label: 'Predictive Models', icon: Brain },
              { id: 'benchmarking', label: 'Industry Benchmarking', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'workforce' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Workforce Planning Scenarios</h3>
                <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                  Create Scenario
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Growth Scenario (20% YoY)</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">Projected headcount growth scenario</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>2024:</span>
                      <span className="font-bold">245 employees</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>2025:</span>
                      <span className="font-bold">294 employees</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>2026:</span>
                      <span className="font-bold">353 employees</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Optimization Scenario</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">Efficiency improvement scenario</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Productivity Gain:</span>
                      <span className="font-bold text-success-600 dark:text-success-400">+15%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost Savings:</span>
                      <span className="font-bold text-success-600 dark:text-success-400">Rp 2.1B</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Headcount Reduction:</span>
                      <span className="font-bold text-info-600 dark:text-info-500">12 positions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Performance Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Top Performers</h4>
                  <div className="space-y-3">
                    {performanceAnalytics?.topPerformers.map((employee, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-3 rounded-lg border border-slate-100 dark:border-neutral-800 shadow-sm">
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-white">{employee.employeeName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{employee.department}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400 px-2 py-1 rounded text-xs font-bold">
                          <Award size={12} /> {employee.rating}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">By Department</h4>
                  <div className="space-y-3">
                    {performanceAnalytics?.performanceByDepartment.map((dept, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-3 rounded-lg border border-slate-100 dark:border-neutral-800 shadow-sm">
                        <span className="font-medium text-sm text-slate-900 dark:text-white">{dept.department}</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{dept.averageRating.toFixed(1)} / 5.0</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{dept.employeeCount} employees</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compensation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Compensation Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Pay Equity by Department</h4>
                  <div className="space-y-3">
                    {['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'].map((dept, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{dept}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
                            <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${Math.random() * 20 + 80}%` }}></div>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white w-8 text-right">A+</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-neutral-800/40 p-6 rounded-xl border border-slate-200 dark:border-neutral-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Salary Trends</h4>
                  <div className="text-center py-8">
                    <LineChart className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Stable growth across all 5 departments</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictive' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Predictive Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl">
                  <div className="w-12 h-12 bg-info-50 dark:bg-info-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6 text-info-600 dark:text-info-500" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Turnover Prediction</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">AI-powered employee turnover forecasting</p>
                  <div className="text-2xl font-bold text-info-600 dark:text-info-500 mb-1">87%</div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">Model accuracy</p>
                </div>

                <div className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl">
                  <div className="w-12 h-12 bg-success-50 dark:bg-success-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-success-600 dark:text-success-400" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Hiring Optimization</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Predictive hiring needs and candidate success</p>
                  <div className="text-2xl font-bold text-success-600 dark:text-success-400 mb-1">92%</div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">Prediction accuracy</p>
                </div>

                <div className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl">
                  <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Performance Forecasting</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Future performance trends and development needs</p>
                  <div className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-1">89%</div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">Forecast accuracy</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'benchmarking' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Industry Benchmarking</h3>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                <p className="text-slate-700 dark:text-slate-300">Industry benchmarking and competitive analysis</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Compare against industry standards and competitors</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;