import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Eye, Calendar, Users, Briefcase, BarChart3,
    Filter, Search, Loader2, CheckCircle2, Clock, TrendingUp, FileDown
} from 'lucide-react';
import { pdfReportService, ScreeningReport, InterviewReport, AnalyticsReport } from '../services/pdf.service';
import { exportService } from '../services/export.service';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

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

    const getScoreTone = (score: number): 'success' | 'warning' | 'danger' => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    };

    return (
        <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="relative">
                    <div className="absolute -left-4 top-0 w-1.5 h-12 bg-brand-600 rounded-full"></div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{t('reports.title')}</h1>
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-lg mt-1 tracking-tight">{t('reports.subtitle')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-2 flex gap-2">
                <button
                    onClick={() => setActiveTab('screening')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'screening'
                        ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                >
                    <FileText size={20} />
                    {t('reports.tabs.screening')}
                </button>
                <button
                    onClick={() => setActiveTab('interviews')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'interviews'
                        ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                >
                    <Users size={20} />
                    {t('reports.tabs.interviews')}
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'analytics'
                        ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-600 dark:hover:text-slate-300'
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
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('reports.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800 dark:text-white border-none rounded-xl text-sm focus:ring-2 ring-brand-500"
                            />
                        </div>
                    </div>

                    {/* Screening List */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-10 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('reports.screeningTitle')}</h2>
                            <p className="text-slate-700 dark:text-slate-300 font-medium mt-1">{t('reports.screeningSub')}</p>
                        </div>

                        {loading ? (
                            <div className="p-32 text-center">
                                <Loader2 size={48} className="mx-auto text-brand-600 animate-spin" />
                                <p className="mt-6 font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('reports.loadingScreenings')}</p>
                            </div>
                        ) : filteredScreenings.length === 0 ? (
                            <div className="p-32 text-center">
                                <FileText size={64} className="mx-auto text-slate-200 dark:text-neutral-700 mb-6" />
                                <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('reports.noScreenings')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                                {filteredScreenings.map((screening) => (
                                    <div key={screening.id} className="p-5 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
                                                    <FileText size={24} className="text-brand-600 dark:text-brand-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{screening.candidateName}</h3>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">{screening.jobTitle}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                        <span>{screening.email}</span>
                                                        <span>•</span>
                                                        <span>{new Date(screening.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Badge tone={getScoreTone(screening.score)}>
                                                    {screening.score}%
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadScreeningReport(screening.id, screening.candidateName)}
                                                    disabled={generating === screening.id}
                                                    icon={<Download size={16} className="text-brand-600 dark:text-brand-400" />}
                                                >
                                                    PDF
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleExportScreeningsCSV}
                                                    icon={<FileDown size={16} />}
                                                >
                                                    CSV
                                                </Button>
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
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('reports.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800 dark:text-white border-none rounded-xl text-sm focus:ring-2 ring-brand-500"
                            />
                        </div>
                    </div>

                    {/* Interviews List */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-10 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('reports.interviewTitle')}</h2>
                            <p className="text-slate-700 dark:text-slate-300 font-medium mt-1">{t('reports.interviewSub')}</p>
                        </div>

                        {loading ? (
                            <div className="p-32 text-center">
                                <Loader2 size={48} className="mx-auto text-brand-600 animate-spin" />
                                <p className="mt-6 font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('reports.loadingInterviews')}</p>
                            </div>
                        ) : filteredInterviews.length === 0 ? (
                            <div className="p-32 text-center">
                                <Users size={64} className="mx-auto text-slate-200 dark:text-neutral-700 mb-6" />
                                <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('reports.noInterviews')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                                {filteredInterviews.map((interview) => (
                                    <div key={interview.id} className="p-5 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-info-50 dark:bg-info-500/10 rounded-xl flex items-center justify-center">
                                                    <Users size={24} className="text-info-600 dark:text-info-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{interview.candidateName}</h3>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">{interview.jobTitle}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                        <Clock size={12} />
                                                        <span>{new Date(interview.interviewDate).toLocaleDateString()}</span>
                                                        <Badge tone={interview.status === 'completed' ? 'success' : 'warning'}>
                                                            {interview.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {interview.overallScore && (
                                                    <Badge tone={getScoreTone(interview.overallScore)}>
                                                        {interview.overallScore}%
                                                    </Badge>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadInterviewReport(interview.id, interview.candidateName)}
                                                    disabled={generating === interview.id}
                                                    icon={<Download size={16} className="text-info-600 dark:text-info-500" />}
                                                >
                                                    PDF
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleExportInterviewsCSV}
                                                    icon={<FileDown size={16} />}
                                                >
                                                    CSV
                                                </Button>
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
                    <div className="bg-white dark:bg-neutral-900 p-12 rounded-[40px] border border-slate-200 dark:border-neutral-800 shadow-xl">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4">{t('reports.generateAnalytics')}</h2>
                        <p className="text-slate-700 dark:text-slate-300 font-medium mb-10 max-w-2xl">
                            {t('reports.analyticsDesc')}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">{t('reports.startDate')}</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-neutral-800 dark:text-white border-2 border-transparent focus:border-brand-600 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">{t('reports.endDate')}</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-neutral-800 dark:text-white border-2 border-transparent focus:border-brand-600 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold transition-all outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="secondary"
                                    onClick={handleDownloadAnalyticsReport}
                                    disabled={generating === -1}
                                    className="w-full rounded-2xl py-4"
                                    icon={generating === -1 ? undefined : <FileDown size={20} />}
                                >
                                    {generating === -1 ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            {t('reports.generating')}
                                        </>
                                    ) : (
                                        `${t('reports.generateBtn')} (PDF)`
                                    )}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleExportAnalyticsCSV}
                                    disabled={generating === -1}
                                    className="w-full rounded-2xl py-4 mb-2"
                                    icon={<Download size={20} />}
                                >
                                    {t('reports.exportCsv')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Report Preview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800">
                            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-4">
                                <Briefcase size={24} className="text-brand-600 dark:text-brand-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('reports.metricsTitle')}</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                {t('reports.metricsDesc')}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800">
                            <div className="w-12 h-12 bg-info-50 dark:bg-info-500/10 rounded-xl flex items-center justify-center mb-4">
                                <TrendingUp size={24} className="text-info-600 dark:text-info-500" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('reports.trendsTitle')}</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                {t('reports.trendsDesc')}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800">
                            <div className="w-12 h-12 bg-success-50 dark:bg-success-900/30 rounded-xl flex items-center justify-center mb-4">
                                <BarChart3 size={24} className="text-success-600 dark:text-success-500" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('reports.chartsTitle')}</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
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
