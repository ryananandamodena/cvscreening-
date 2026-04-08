import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Eye, Calendar, Users, Briefcase, BarChart3,
    Filter, Search, Loader2, CheckCircle2, Clock, TrendingUp, FileDown
} from 'lucide-react';
import { pdfReportService, ScreeningReport, InterviewReport, AnalyticsReport } from '../services/pdf.service';
import { exportService } from '../services/export.service';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';

interface ScreeningRecord {
    id: number;
    candidateName: string;
    email: string;
    jobTitle: string;
    score: number;
    status: string;
    createdAt: string;
}

interface InterviewRecord {
    id: number;
    candidateName: string;
    jobTitle: string;
    interviewDate: string;
    status: string;
    overallScore?: number;
}

const Reports: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'screening' | 'interviews' | 'analytics'>('screening');
    const [screenings, setScreenings] = useState<ScreeningRecord[]>([]);
    const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [screeningsRes, interviewsRes] = await Promise.all([
                apiService.get<{ data: ScreeningRecord[] }>('/screenings?limit=50'),
                apiService.get<InterviewRecord[]>('/interviews')
            ]);
            setScreenings(screeningsRes?.data || []);
            setInterviews(interviewsRes || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadScreeningReport = async (screeningId: number, candidateName: string) => {
        setGenerating(screeningId);
        try {
            await pdfReportService.downloadScreeningReport(screeningId, candidateName);
        } catch (err) {
            console.error('Failed to download report:', err);
            alert(t('common.error') || 'Failed to generate PDF report');
        } finally {
            setGenerating(null);
        }
    };

    const handleDownloadInterviewReport = async (interviewId: number, candidateName: string) => {
        setGenerating(interviewId);
        try {
            await pdfReportService.downloadInterviewReport(interviewId, candidateName);
        } catch (err) {
            console.error('Failed to download report:', err);
            alert(t('common.error') || 'Failed to generate PDF report');
        } finally {
            setGenerating(null);
        }
    };

    const handleDownloadAnalyticsReport = async () => {
        setGenerating(-1);
        try {
            await pdfReportService.downloadAnalyticsReport({
                start: new Date(dateRange.start),
                end: new Date(dateRange.end)
            });
        } catch (err) {
            console.error('Failed to download report:', err);
            alert(t('common.error') || 'Failed to generate analytics report');
        } finally {
            setGenerating(null);
        }
    };

    const handleExportScreeningsCSV = () => {
        exportService.exportScreeningsToCSV(filteredScreenings, 'Reports_Screenings');
    };

    const handleExportInterviewsCSV = () => {
        exportService.exportInterviewsToCSV(filteredInterviews, 'Reports_Interviews');
    };

    const handleExportAnalyticsCSV = async () => {
        try {
            setGenerating(-1);
            const params = new URLSearchParams({
                startDate: new Date(dateRange.start).toISOString(),
                endDate: new Date(dateRange.end).toISOString()
            });
            const data = await apiService.get<any>(`/reports/analytics?${params}`);

            // Flatten metrics for CSV
            const exportData = [
                { metric: 'Total Applications', value: data.metrics.totalApplications },
                { metric: 'Screened Candidates', value: data.metrics.screenedCandidates },
                { metric: 'Interviews Conducted', value: data.metrics.interviewsConducted },
                { metric: 'Offers Extended', value: data.metrics.offersExtended },
                { metric: 'Hires Made', value: data.metrics.hiresMade },
                { metric: 'Avg Time to Hire', value: data.metrics.averageTimeToHire }
            ];

            exportService.exportToCSV(exportData, [
                { key: 'metric', label: 'Metric' },
                { key: 'value', label: 'Value' }
            ], 'Analytics_Report');
        } catch (err) {
            console.error('Failed to export CSV:', err);
            alert('Failed to export CSV');
        } finally {
            setGenerating(null);
        }
    };

    const filteredScreenings = screenings.filter(s =>
        s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredInterviews = interviews.filter(i =>
        i.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50';
        if (score >= 60) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="relative">
                    <div className="absolute -left-4 top-0 w-1.5 h-12 bg-indigo-600 rounded-full"></div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('reports.title')}</h1>
                    <p className="text-slate-500 font-medium text-lg mt-1 tracking-tight">{t('reports.subtitle')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 flex gap-2">
                <button
                    onClick={() => setActiveTab('screening')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'screening'
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <FileText size={20} />
                    {t('reports.tabs.screening')}
                </button>
                <button
                    onClick={() => setActiveTab('interviews')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'interviews'
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <Users size={20} />
                    {t('reports.tabs.interviews')}
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'analytics'
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <BarChart3 size={20} />
                    {t('reports.tabs.analytics')}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'screening' && (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('reports.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Screening List */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('reports.screeningTitle')}</h2>
                            <p className="text-slate-500 font-medium mt-1">{t('reports.screeningSub')}</p>
                        </div>

                        {loading ? (
                            <div className="p-32 text-center">
                                <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
                                <p className="mt-6 font-black text-slate-400 uppercase tracking-widest text-xs">{t('reports.loadingScreenings')}</p>
                            </div>
                        ) : filteredScreenings.length === 0 ? (
                            <div className="p-32 text-center">
                                <FileText size={64} className="mx-auto text-slate-200 mb-6" />
                                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('reports.noScreenings')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredScreenings.map((screening) => (
                                    <div key={screening.id} className="p-5 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                                                    <FileText size={24} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{screening.candidateName}</h3>
                                                    <p className="text-sm text-slate-500">{screening.jobTitle}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                        <span>{screening.email}</span>
                                                        <span>•</span>
                                                        <span>{new Date(screening.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getScoreColor(screening.score)}`}>
                                                    {screening.score}%
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadScreeningReport(screening.id, screening.candidateName)}
                                                    disabled={generating === screening.id}
                                                    className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest shadow-sm"
                                                >
                                                    <Download size={16} className="text-indigo-600" />
                                                    PDF
                                                </button>
                                                <button
                                                    onClick={handleExportScreeningsCSV}
                                                    className="px-4 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                                                >
                                                    <FileDown size={16} />
                                                    CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'interviews' && (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('reports.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Interviews List */}
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('reports.interviewTitle')}</h2>
                            <p className="text-slate-500 font-medium mt-1">{t('reports.interviewSub')}</p>
                        </div>

                        {loading ? (
                            <div className="p-32 text-center">
                                <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
                                <p className="mt-6 font-black text-slate-400 uppercase tracking-widest text-xs">{t('reports.loadingInterviews')}</p>
                            </div>
                        ) : filteredInterviews.length === 0 ? (
                            <div className="p-32 text-center">
                                <Users size={64} className="mx-auto text-slate-200 mb-6" />
                                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('reports.noInterviews')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredInterviews.map((interview) => (
                                    <div key={interview.id} className="p-5 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                                    <Users size={24} className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{interview.candidateName}</h3>
                                                    <p className="text-sm text-slate-500">{interview.jobTitle}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                        <Clock size={12} />
                                                        <span>{new Date(interview.interviewDate).toLocaleDateString()}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${interview.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {interview.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {interview.overallScore && (
                                                    <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getScoreColor(interview.overallScore)}`}>
                                                        {interview.overallScore}%
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadInterviewReport(interview.id, interview.candidateName)}
                                                    disabled={generating === interview.id}
                                                    className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest shadow-sm"
                                                >
                                                    <Download size={16} className="text-purple-600" />
                                                    PDF
                                                </button>
                                                <button
                                                    onClick={handleExportInterviewsCSV}
                                                    className="px-4 py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 flex items-center gap-2 transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-purple-600/20"
                                                >
                                                    <FileDown size={16} />
                                                    CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Date Range Selector */}
                    <div className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-xl">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">{t('reports.generateAnalytics')}</h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-2xl">
                            {t('reports.analyticsDesc')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('reports.startDate')}</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('reports.endDate')}</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleDownloadAnalyticsReport}
                                    disabled={generating === -1}
                                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-2xl text-[10px] uppercase tracking-widest"
                                >
                                    {generating === -1 ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            {t('reports.generating')}
                                        </>
                                    ) : (
                                        <>
                                            <FileDown size={20} />
                                            {t('reports.generateBtn')} (PDF)
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleExportAnalyticsCSV}
                                    disabled={generating === -1}
                                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl text-[10px] uppercase tracking-widest mb-2"
                                >
                                    <Download size={20} />
                                    {t('reports.exportCsv')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Report Preview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                                <Briefcase size={24} className="text-indigo-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">{t('reports.metricsTitle')}</h3>
                            <p className="text-sm text-slate-500">
                                {t('reports.metricsDesc')}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                                <TrendingUp size={24} className="text-purple-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">{t('reports.trendsTitle')}</h3>
                            <p className="text-sm text-slate-500">
                                {t('reports.trendsDesc')}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                                <BarChart3 size={24} className="text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">{t('reports.chartsTitle')}</h3>
                            <p className="text-sm text-slate-500">
                                {t('reports.chartsDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
