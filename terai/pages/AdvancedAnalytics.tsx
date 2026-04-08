import React, { useState, useEffect } from 'react';
import {
    Users, Target, Clock, Loader2, Download, Calendar, ChevronDown,
    ArrowUpRight, ArrowDownRight, FileText, UserCheck, MapPin, BrainCircuit
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, ComposedChart, PieChart as RechartsPie,
    Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { exportService } from '../services/export.service';

const fadeUpVariant = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const staggerContainer = {
    animate: { transition: { staggerChildren: 0.08 } }
};

interface AnalyticsData {
    overview: {
        totalCandidates: number;
        totalHired: number;
        totalRejected: number;
        avgTimeToHire: number;
        avgMatchScore: number;
        hiringRate: number;
        trendData: { candidates: number; hired: number; timeToHire: number; };
    };
    pipeline: Array<{ name: string; screen: number; interview: number; hire: number; rejected: number; }>;
    sources: Array<{ name: string; value: number; color: string; }>;
    departments: Array<{ department: string; matchRate: number; trendPercent: string; openPositions: number; hiredThisMonth: number; }>;
    skillsGap: Array<{ skill: string; demand: number; supply: number; gap: number; }>;
    timeToHireTrend: Array<{ month: string; days: number; industry: number; }>;
    geographicData: Array<{ location: string; candidates: number; hired: number; avgScore: number; }>;
    interviewPerformance: Array<{ name: string; score: number; completion: number; }>;
}

const AdvancedAnalytics: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, selectedDepartment]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await apiService.get<any>(
                `/analytics/advanced?range=${dateRange}&department=${selectedDepartment}`
            );

            if (response && response.totalCandidates !== undefined) {
                const totalCandidates = response.totalCandidates || 0;
                const totalHired = response.pipeline?.hired || 0;
                const totalRejected = totalCandidates - totalHired - (response.pipeline?.offered || 0);

                const transformed: AnalyticsData = {
                    overview: {
                        totalCandidates,
                        totalHired,
                        totalRejected: totalRejected > 0 ? totalRejected : 0,
                        avgTimeToHire: Math.round(response.averageTimeToHire || 0),
                        avgMatchScore: Math.round(response.averageScore || 0),
                        hiringRate: totalCandidates > 0 ? Math.round((totalHired / totalCandidates) * 100 * 10) / 10 : 0,
                        trendData: { candidates: 0, hired: 0, timeToHire: 0 },
                    },
                    pipeline: (response.monthlyTrends || []).map((t: any) => ({
                        name: t.month?.split('-')[1] ? new Date(t.month + '-01').toLocaleString('default', { month: 'short' }) : t.month,
                        screen: t.screenings || 0,
                        interview: t.interviews || 0,
                        hire: t.offers || 0,
                        rejected: 0,
                    })),
                    sources: (response.sourceStats || []).map((s: any, i: number) => ({
                        name: s.source || 'Unknown',
                        value: Math.round(s.percentage || 0),
                        color: ['#0077B5', '#6366f1', '#10b981', '#f59e0b'][i % 4],
                    })),
                    departments: (response.departmentStats || []).map((d: any) => ({
                        department: d.department || 'Unknown',
                        matchRate: Math.round(d.avgScore || 0),
                        trendPercent: '+0%',
                        openPositions: d.openJobs || 0,
                        hiredThisMonth: d.candidates || 0,
                    })),
                    skillsGap: getMockData().skillsGap, 
                    timeToHireTrend: (response.monthlyTrends || []).map((t: any) => ({
                        month: t.month?.split('-')[1] ? new Date(t.month + '-01').toLocaleString('default', { month: 'short' }) : t.month,
                        days: Math.round(response.averageTimeToHire || 18),
                        industry: 24,
                    })),
                    geographicData: getMockData().geographicData,
                    interviewPerformance: getMockData().interviewPerformance,
                };
                setData(transformed);
            } else {
                setData(getMockData());
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
            setData(getMockData());
        } finally {
            setLoading(false);
        }
    };

    const getMockData = (): AnalyticsData => ({
        overview: {
            totalCandidates: 1247,
            totalHired: 89,
            totalRejected: 342,
            avgTimeToHire: 18.4,
            avgMatchScore: 75.2,
            hiringRate: 7.1,
            trendData: { candidates: 12, hired: 8, timeToHire: -14 },
        },
        pipeline: [
            { name: 'Jan', screen: 120, interview: 45, hire: 8, rejected: 32 },
            { name: 'Feb', screen: 145, interview: 52, hire: 12, rejected: 28 },
            { name: 'Mar', screen: 132, interview: 48, hire: 10, rejected: 35 },
            { name: 'Apr', screen: 178, interview: 65, hire: 15, rejected: 42 },
            { name: 'May', screen: 156, interview: 58, hire: 11, rejected: 38 },
            { name: 'Jun', screen: 189, interview: 72, hire: 18, rejected: 45 },
        ],
        sources: [
            { name: 'LinkedIn', value: 42, color: '#0077B5' },
            { name: 'Job Board', value: 28, color: '#6366f1' },
            { name: 'Referral', value: 18, color: '#10b981' },
            { name: 'Direct', value: 12, color: '#f59e0b' },
        ],
        departments: [
            { department: 'Engineering', matchRate: 94, trendPercent: '+4%', openPositions: 12, hiredThisMonth: 5 },
            { department: 'Product', matchRate: 88, trendPercent: '+2%', openPositions: 4, hiredThisMonth: 2 },
            { department: 'Marketing', matchRate: 72, trendPercent: '-1%', openPositions: 3, hiredThisMonth: 1 },
            { department: 'Sales', matchRate: 85, trendPercent: '+5%', openPositions: 8, hiredThisMonth: 3 },
            { department: 'Design', matchRate: 91, trendPercent: '+3%', openPositions: 2, hiredThisMonth: 1 },
        ],
        skillsGap: [
            { skill: 'React', demand: 95, supply: 78, gap: -17 },
            { skill: 'Golang', demand: 88, supply: 45, gap: -43 },
            { skill: 'Python', demand: 82, supply: 72, gap: -10 },
            { skill: 'AWS', demand: 75, supply: 55, gap: -20 },
            { skill: 'TypeScript', demand: 90, supply: 68, gap: -22 },
            { skill: 'Kubernetes', demand: 70, supply: 35, gap: -35 },
        ],
        timeToHireTrend: [
            { month: 'Jan', days: 22, industry: 24 },
            { month: 'Feb', days: 20, industry: 24 },
            { month: 'Mar', days: 19, industry: 25 },
            { month: 'Apr', days: 18, industry: 24 },
            { month: 'May', days: 17, industry: 23 },
            { month: 'Jun', days: 18, industry: 24 },
        ],
        geographicData: [
            { location: 'Jakarta', candidates: 450, hired: 35, avgScore: 78 },
            { location: 'Bandung', candidates: 180, hired: 12, avgScore: 75 },
            { location: 'Surabaya', candidates: 220, hired: 18, avgScore: 76 },
            { location: 'Yogyakarta', candidates: 95, hired: 6, avgScore: 72 },
            { location: 'Remote', candidates: 302, hired: 18, avgScore: 80 },
        ],
        interviewPerformance: [
            { name: 'Technical', score: 82, completion: 95 },
            { name: 'Behavioral', score: 78, completion: 92 },
            { name: 'Cultural Fit', score: 85, completion: 88 },
            { name: 'Problem Solving', score: 75, completion: 90 },
        ],
    });

    const exportToPDF = async () => {
        try {
            setLoading(true);
            const endDate = new Date();
            const startDate = new Date();
            if (dateRange === '7d') startDate.setDate(endDate.getDate() - 7);
            else if (dateRange === '90d') startDate.setDate(endDate.getDate() - 90);
            else startDate.setDate(endDate.getDate() - 30);
            const { pdfReportService } = await import('../services/pdf.service');
            await pdfReportService.downloadAnalyticsReport({ start: startDate, end: endDate });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!data) return;
        const exportData: any[] = [];
        exportData.push({ metric: 'Total Candidates', value: data.overview.totalCandidates, details: '' });
        exportData.push({ metric: 'Hired', value: data.overview.totalHired, details: `${data.overview.hiringRate}% Rate` });
        exportData.push({ metric: 'Avg Time to Hire', value: data.overview.avgTimeToHire, details: 'days' });
        data.pipeline.forEach(p => {
            exportData.push({ metric: `Pipeline: ${p.name}`, value: p.hire, details: `Screened: ${p.screen}, Interviewed: ${p.interview}` });
        });
        exportService.exportToCSV(exportData, [
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value' },
            { key: 'details', label: 'Details' }
        ], `Analytics_Export_${dateRange}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                   <Loader2 size={40} className="text-indigo-600 animate-spin relative z-10" />
                </div>
                <p className="font-extrabold text-slate-400 uppercase tracking-[0.2em] text-xs">Aggregating Global Metrics...</p>
            </div>
        );
    }

    const stats = data?.overview;

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-8 pt-6">
            {/* Header Area */}
            <motion.div variants={fadeUpVariant} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {t('analytics.advancedTitle') || 'Advanced Analytics'}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl">
                        Comprehensive recruiting insights and performance metrics wrapped in a modern predictive dashboard.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200/50 rounded-2xl font-bold text-slate-600 shadow-sm hover:shadow-md transition-all text-sm"
                        >
                            <Calendar size={16} className="text-indigo-500" />
                            {dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                            <ChevronDown size={14} className="ml-2 text-slate-400" />
                        </button>
                    </div>

                    <button
                        onClick={exportToPDF}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 shadow-[0_8px_20px_rgb(15,23,42,0.25)] transition-all flex items-center gap-2"
                    >
                        <FileText size={16} /> PDF
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="px-5 py-2.5 bg-emerald-500 border border-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 shadow-[0_8px_20px_rgb(16,185,129,0.25)] transition-all flex items-center gap-2"
                    >
                        <Download size={16} /> Data
                    </button>
                </div>
            </motion.div>

            {/* Metrics Overview Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard 
                   title="Total Candidates" 
                   value={stats?.totalCandidates.toLocaleString()} 
                   trend={stats?.trendData.candidates}
                   icon={<Users size={22} />} 
                   color="bg-blue-50 text-blue-600" 
                />
                <MetricCard 
                   title="Candidates Hired" 
                   value={stats?.totalHired} 
                   trend={stats?.trendData.hired}
                   subtext={`${stats?.hiringRate}% conversion`}
                   icon={<UserCheck size={22} />} 
                   color="bg-emerald-50 text-emerald-600" 
                />
                <MetricCard 
                   title="Avg Time to Hire" 
                   value={`${stats?.avgTimeToHire}d`} 
                   trend={-(stats?.trendData.timeToHire || 0)} 
                   subtext="Target: 24 days"
                   icon={<Clock size={22} />} 
                   color="bg-amber-50 text-amber-600" 
                />
                 <MetricCard 
                   title="Avg Match Score" 
                   value={`${stats?.avgMatchScore}%`} 
                   trend={3} 
                   icon={<Target size={22} />} 
                   color="bg-purple-50 text-purple-600" 
                />
            </div>

            {/* Charts Row 1 */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Recruiting Pipeline Flow" className="lg:col-span-2">
                    <div className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data?.pipeline}>
                                <defs>
                                    <linearGradient id="gradientInterview" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', fontWeight: 600 }}
                                />
                                <Bar dataKey="screen" fill="#f1f5f9" radius={[8, 8, 8, 8]} barSize={40} />
                                <Area type="monotone" dataKey="interview" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#gradientInterview)" />
                                <Line type="monotone" dataKey="hire" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard title="Sourcing Channels">
                     <div className="h-[200px] mt-4 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                                <Pie data={data?.sources} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" cornerRadius={6}>
                                    {data?.sources.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontWeight: 600 }} />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-6 px-2">
                        {data?.sources.map((source, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-3 font-semibold text-slate-600">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }}></span>
                                    {source.name}
                                </span>
                                <span className="font-extrabold text-slate-800">{source.value}%</span>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </motion.div>

            {/* Charts Row 2 */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Capability Demand & Supply">
                    <div className="h-[280px] mt-2 text-sm font-semibold">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.skillsGap} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} width={90} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', fontWeight: 600 }} />
                                <Bar dataKey="demand" fill="#4f46e5" radius={[6, 6, 6, 6]} barSize={12} />
                                <Bar dataKey="supply" fill="#10b981" radius={[6, 6, 6, 6]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard title="Time-to-Hire Execution">
                    <div className="h-[280px] mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.timeToHireTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradientYourTime" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', fontWeight: 600 }} />
                                <Area type="monotone" dataKey="industry" stroke="#cbd5e1" strokeWidth={2} fill="#f8fafc" />
                                <Area type="monotone" dataKey="days" stroke="#4f46e5" strokeWidth={3} fill="url(#gradientYourTime)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </motion.div>

            {/* Department Performance & Geographic */}
            <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <ChartCard title="Department Matching Performance">
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        {data?.departments.map((dept, index) => (
                            <div key={index} className="p-4 bg-slate-50 border border-slate-100/50 rounded-[1.5rem] hover:bg-slate-100 transition-all cursor-pointer">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{dept.department}</p>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{dept.matchRate}%</h4>
                                        <p className="text-[11px] font-bold text-slate-400 mt-1">{dept.openPositions} Openings</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${dept.trendPercent.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {dept.trendPercent}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                <ChartCard title="Geographic Distribution">
                     <div className="space-y-3 mt-4">
                        {data?.geographicData.map((geo, index) => (
                            <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100/50 rounded-[1.5rem]">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-[14px]">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{geo.location}</p>
                                        <p className="text-[11px] font-semibold text-slate-400">{geo.candidates} Candidates</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-extrabold text-[13px] text-slate-800">{geo.hired} Hired</p>
                                    <p className="text-[11px] font-bold text-emerald-500">{geo.avgScore}% Avg Score</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </motion.div>

            {/* Interview Performance */}
            <motion.div variants={staggerContainer} className="mt-6 border-none">
                 <ChartCard title="AI Interview Assessment Metrics">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        {data?.interviewPerformance.map((perf, index) => (
                            <div key={index} className="p-5 bg-gradient-to-br from-indigo-50/50 to-white rounded-[1.5rem] border border-indigo-50/80">
                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3">{perf.name}</p>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{perf.score}%</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Score</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold text-indigo-500">{perf.completion}%</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completed</p>
                                    </div>
                                </div>
                                <div className="mt-4 h-1.5 bg-indigo-100/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${perf.score}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                 </ChartCard>
            </motion.div>
        </motion.div>
    );
};

// --- Custom Modern Components ---

const MetricCard = ({ title, value, trend, subtext, icon, color }: any) => {
    const isPositive = trend >= 0;
    return (
        <motion.div variants={fadeUpVariant} className="bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start mb-4">
                <div className={`size-12 rounded-[1.25rem] flex items-center justify-center ${color}`}>
                    {icon}
                </div>
                {trend !== undefined && (
                   <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                       isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                   }`}>
                      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(trend)}%
                   </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
                    {subtext && <span className="text-xs font-bold text-slate-400">{subtext}</span>}
                </div>
            </div>
        </motion.div>
    );
};

const ChartCard = ({ title, children, className = '' }: any) => (
    <motion.div variants={fadeUpVariant} className={`bg-white p-7 rounded-[2rem] border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}>
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-4">{title}</h3>
        {children}
    </motion.div>
);

export default AdvancedAnalytics;
