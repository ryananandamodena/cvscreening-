import React, { useState, useEffect, useMemo } from 'react';
import {
  Target, TrendingUp, Users, Star, Calendar, Plus, Filter,
  BarChart3, PieChart, Award, AlertTriangle, CheckCircle2,
  Clock, UserCheck, ChevronRight, Download, Settings, Sparkles
} from 'lucide-react';
import { performanceService, PerformanceReview, PerformanceGoal } from '../../services/performance.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const PerformanceDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  // Data states
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Filters
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reviewsData, goalsData, analyticsData] = await Promise.all([
        performanceService.getReviews({ limit: 50 }),
        performanceService.getGoals(),
        performanceService.getPerformanceAnalytics()
      ]);

      setReviews(Array.isArray(reviewsData) ? reviewsData : reviewsData.data);
      setGoals(goalsData);
      setAnalytics(analyticsData);

    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      const errorMessage = 'Gagal memuat data performance. Silakan refresh halaman.';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (id: number) => {
    try {
      setAnalyzingId(id);
      const res = await performanceService.analyzeReview(id);
      // Update local state
      setReviews(prev => prev.map(r => 
        r.id === id 
          ? { ...r, aiSentimentScore: res.aiSentimentScore, aiSummary: res.aiSummary }
          : r
      ));
      showToast('success', 'AI Analysis Complete');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to analyze review');
    } finally {
      setAnalyzingId(null);
    }
  };

  // Computed values
  const stats = useMemo(() => {
    if (!reviews.length) return null;

    const totalReviews = reviews.length;
    const completedReviews = reviews.filter(r => r.status === 'completed').length;
    const pendingReviews = reviews.filter(r => ['draft', 'self_assessment', 'manager_review'].includes(r.status)).length;
    const avgRating = reviews.filter(r => r.overallRating).reduce((sum, r) => sum + r.overallRating, 0) / reviews.filter(r => r.overallRating).length || 0;

    const goalStats = {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      inProgress: goals.filter(g => g.status === 'in_progress').length,
      overdue: goals.filter(g => g.status === 'overdue').length
    };

    return {
      totalReviews,
      completedReviews,
      pendingReviews,
      avgRating: avgRating.toFixed(1),
      completionRate: ((completedReviews / totalReviews) * 100).toFixed(1),
      goalStats
    };
  }, [reviews, goals]);

  const recentReviews = useMemo(() => {
    return reviews
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [reviews]);

  const getStatusTone = (status: string): 'success' | 'info' | 'warning' | 'brand' | 'neutral' => {
    switch (status) {
      case 'completed': return 'success';
      case 'approved': return 'info';
      case 'manager_review': return 'warning';
      case 'self_assessment': return 'brand';
      case 'draft': return 'neutral';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'approved': return 'Disetujui';
      case 'manager_review': return 'Review Manager';
      case 'self_assessment': return 'Self Assessment';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  const getGoalStatusTone = (status: string): 'success' | 'info' | 'danger' | 'neutral' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'overdue': return 'danger';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <Target size={32} />
            </div>
            Performance HQ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Performance management, goal tracking, and employee development.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="flex items-center gap-2">
            <Download size={16} />
            Export
          </Button>
          <Button variant="outline" size="md" className="flex items-center gap-2">
            <Settings size={16} />
            Settings
          </Button>
          <Button variant="primary" size="md" className="flex items-center gap-2">
            <Plus size={16} />
            New Review
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger-500 flex-shrink-0" />
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                <Users size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
              <Badge tone="brand">ACTIVE</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Reviews</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalReviews}</h3>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{stats.pendingReviews} pending</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-success-500/10 group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 size={24} className="text-success-600 dark:text-success-400" />
              </div>
              <Badge tone="success">COMPLETED</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Completion Rate</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.completionRate}%</h3>
              <span className="text-xs font-bold text-success-600 dark:text-success-400">+12% from last month</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-warning-500/10 group-hover:scale-110 transition-transform duration-500">
                <Star size={24} className="text-warning-600 dark:text-warning-400" />
              </div>
              <Badge tone="warning">AVG RATING</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Average Rating</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.avgRating}</h3>
              <span className="text-xs font-bold text-warning-600 dark:text-warning-400">out of 5.0</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                <Target size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
              <Badge tone="brand">GOALS</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Active Goals</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.goalStats.total}</h3>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{stats.goalStats.completed} completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reviews */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Reviews</h2>
            <button className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium text-sm flex items-center gap-2">
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {recentReviews.map((review) => (
             <React.Fragment key={review.id}>
              <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-neutral-800 rounded-t-xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/40 rounded-full flex items-center justify-center">
                    <UserCheck size={20} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{review.employeeName}</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{review.reviewPeriod} • {review.reviewType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {review.aiSentimentScore && (
                    <Badge tone={
                      review.aiSentimentScore === 'Positif' ? 'success' :
                      review.aiSentimentScore === 'Negatif' ? 'danger' : 'warning'
                    }>
                      {review.aiSentimentScore}
                    </Badge>
                  )}
                  <Badge tone={getStatusTone(review.status)}>
                    {getStatusLabel(review.status)}
                  </Badge>
                  {review.overallRating && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-warning-500 fill-current" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{review.overallRating}</span>
                    </div>
                  )}
                  {!review.aiSentimentScore && (
                    <button
                      onClick={() => handleAnalyze(review.id)}
                      disabled={analyzingId === review.id}
                      className="ml-2 px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      {analyzingId === review.id ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                  )}
                </div>
              </div>
              {review.aiSummary && (
                <div className="mt-0 pt-3 px-4 pb-4 border-t-0 bg-slate-50 dark:bg-neutral-900 border-x border-b border-slate-100 dark:border-neutral-800 rounded-b-xl -mt-2 mb-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">" {review.aiSummary} "</p>
                </div>
              )}
            </React.Fragment>
            ))}

            {recentReviews.length === 0 && (
              <div className="text-center py-8">
                <Target size={48} className="text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                <p className="text-slate-700 dark:text-slate-300">No performance reviews yet</p>
                <button className="mt-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium">
                  Create your first review
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Goals Overview */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Goal Progress</h2>
            <button className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium text-sm flex items-center gap-2">
              Add Goal <Plus size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {goals.slice(0, 5).map((goal) => (
              <div key={goal.id} className="p-4 border border-slate-100 dark:border-neutral-800 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">{goal.title}</h4>
                  <Badge tone={getGoalStatusTone(goal.status)}>
                    {goal.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{goal.category}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: goal.status === 'completed' ? '100%' :
                               goal.status === 'in_progress' ? '60%' : '20%'
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-700 dark:text-slate-300">{goal.weight}%</span>
                </div>
              </div>
            ))}

            {goals.length === 0 && (
              <div className="text-center py-8">
                <Target size={32} className="text-slate-700 dark:text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 dark:text-slate-300 text-sm">No goals set yet</p>
                <button className="mt-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium text-sm">
                  Set your first goal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg">
                <Plus size={20} className="text-brand-600 dark:text-brand-400" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">New Review</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Start a performance review cycle</p>
          </button>

          <button className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-success-100 dark:bg-success-900/40 rounded-lg">
                <Target size={20} className="text-success-600 dark:text-success-400" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">Set Goals</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Create performance objectives</p>
          </button>

          <button className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warning-100 dark:bg-warning-900/40 rounded-lg">
                <BarChart3 size={20} className="text-warning-600 dark:text-warning-400" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">View Reports</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Performance analytics & insights</p>
          </button>

          <button className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg">
                <Award size={20} className="text-brand-600 dark:text-brand-400" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white">Calibrate</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Rating calibration sessions</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
