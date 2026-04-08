import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import {
  Users,
  FileCheck,
  Video,
  UserCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Inbox,
  Zap,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const activityData = [
  { time: '09:00', count: 10 }, { time: '11:00', count: 25 }, { time: '13:00', count: 15 },
  { time: '15:00', count: 32 }, { time: '17:00', count: 28 }, { time: '19:00', count: 40 },
];

const StatCard = ({ icon: Icon, label, value, trend, color, subtitle }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden text-left">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] rounded-full -mr-8 -mt-8`}></div>
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      <span className="text-xs font-bold text-slate-400">{subtitle}</span>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    candidates: 0,
    jobs: 0,
    screenings: [] as any[],
    interviews: 0,
    schedules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [cList, jList, sList, iList, schList] = await Promise.all([
          apiService.get<any>('/candidates'),
          apiService.get<any>('/jobs'),
          apiService.get<any>('/screenings'),
          apiService.get<any>('/interviews').catch(() => ({ data: [] })),
          apiService.getInterviewSchedules().catch(() => ({ data: [] })),
        ]);

        const screenings = sList?.data || sList || [];
        const interviewsArr = iList?.data || iList || [];
        const schedulesArr = schList?.data || schList || [];

        setStats({
          candidates: cList?.data?.length || cList?.length || 0,
          jobs: jList?.data?.length || jList?.length || 0,
          screenings,
          interviews: Array.isArray(interviewsArr) ? interviewsArr.length : 0,
          schedules: Array.isArray(schedulesArr) ? schedulesArr.length : 0,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const funnelData = [
    { name: t('dashboard.sourced'), count: stats.candidates, color: '#1e40af' },
    { name: t('dashboard.screened'), count: stats.screenings.length, color: '#3b82f6' },
    { name: t('dashboard.interviewStage'), count: stats.interviews + stats.schedules, color: '#6366f1' },
    { name: t('dashboard.offersStage'), count: Math.floor(stats.interviews * 0.3), color: '#8b5cf6' },
    { name: t('dashboard.hires'), count: Math.floor(stats.interviews * 0.1), color: '#10b981' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin size-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('dashboard.realtime')}</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-slate-500 font-medium text-lg mt-1 tracking-tight">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label={t('dashboard.totalPipeline')} value={stats.candidates} trend={12.4} color="bg-indigo-600" subtitle={t('dashboard.candidates')} />
        <StatCard icon={FileCheck} label={t('dashboard.aiScreening')} value={`${stats.screenings.length}`} trend={4.2} color="bg-blue-600" subtitle={t('dashboard.totalProcessed')} />
        <StatCard icon={Video} label={t('dashboard.openPositions')} value={stats.jobs} trend={-2.1} color="bg-purple-600" subtitle={t('dashboard.activeJobs')} />
        <StatCard icon={UserCheck} label={t('dashboard.conversion')} value="3.8%" trend={8.1} color="bg-emerald-600" subtitle={t('dashboard.sourcingToHire')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-200/60 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('dashboard.funnelTitle')}</h3>
              <p className="text-slate-400 text-sm mt-1">{t('dashboard.funnelSubtitle')}</p>
            </div>
          </div>

          <div className="h-[400px] flex gap-4 items-end">
            {funnelData.map((item) => {
              const maxVal = Math.max(...funnelData.map(d => d.count)) || 1;
              const height = (item.count / maxVal) * 100;
              return (
                <div key={item.name} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black">{item.count}</div>
                  </div>
                  <div className="w-full flex flex-col justify-end gap-1">
                    <div className="w-full bg-slate-100 rounded-2xl relative overflow-hidden" style={{ height: '300px' }}>
                      <div
                        className="absolute bottom-0 w-full transition-all duration-1000 ease-out flex flex-col"
                        style={{ height: `${height}%`, backgroundColor: item.color }}
                      >
                        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">{item.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-[#0f172a] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group flex-1">
            <div className="absolute top-0 right-0 p-8">
              <Zap className="text-indigo-500 animate-pulse" size={32} />
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">{t('dashboard.aiLoad')}</h3>
            <p className="text-slate-400 text-sm mb-10">{t('dashboard.aiLoadSub')}</p>

            <div className="h-48 mt-4 text-left">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group text-left">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles size={120} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-left">
              <ShieldCheck size={16} /> {t('dashboard.aiInsight')}
            </h4>
            <p className="text-lg font-bold leading-snug">
              {t('dashboard.aiInsightText', { count: String(stats.candidates * 5) })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-xl overflow-hidden text-left">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-inner">
              <Inbox size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('dashboard.recentScreenings')}</h3>
              <p className="text-slate-400 text-sm font-medium">{t('dashboard.resultsAvailable', { count: String(stats.screenings.length) })}</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.screenings.slice(0, 5).map((item, i) => (
            <div key={i} onClick={() => navigate(`/screening/${item.id}`)} className="p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.candidateName}`} className="size-20 rounded-[28px] bg-slate-100 ring-8 ring-white shadow-xl group-hover:scale-105 transition-transform duration-500" alt="" />
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg border-4 border-white shadow-lg">{item.score}%</div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{item.candidateName}</h4>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{item.email}</p>
                  <div className="flex gap-2">
                    {item.matchedSkills?.slice(0, 3).map((t: string) => (
                      <span key={t} className="px-3 py-1 bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-right space-y-2">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.score > 80 ? 'bg-emerald-100 text-emerald-700' :
                    item.score > 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                    {item.score > 80 ? t('dashboard.highMatch') : t('dashboard.potential')}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center justify-end gap-1">
                    <Clock size={14} /> {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button className="size-14 bg-white border border-slate-100 text-slate-300 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-2xl group-hover:shadow-indigo-600/30 group-hover:-translate-x-3 transition-all duration-500 flex items-center justify-center">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          ))}
          {stats.screenings.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">{t('dashboard.noScreenings')}</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
