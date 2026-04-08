import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Briefcase, FileText, Clock, CheckCircle, XCircle,
    LogOut, User, Building2, Calendar, ChevronRight,
    Search, Filter, Download, Eye
} from 'lucide-react';
import { candidatePortalService, CandidateApplication, CandidateJob } from '../services/candidate-portal.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const CandidateDashboard: React.FC = () => {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [applications, setApplications] = useState<CandidateApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        // Check if logged in
        if (!candidatePortalService.isLoggedIn()) {
            navigate('/candidate/login');
            return;
        }
        loadApplications();

        // Get user info from localStorage
        const userInfo = localStorage.getItem('candidate_user');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            setFullName(user.fullName || '');
        }
    }, []);

    const loadApplications = async () => {
        try {
            const response = await candidatePortalService.getApplications();
            setApplications(response.applications || []);
        } catch (error: any) {
            console.error('Failed to load applications:', error);
            if (error.message?.includes('Unauthorized')) {
                navigate('/candidate/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        candidatePortalService.logout();
        navigate('/careers');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'submitted':
                return 'bg-blue-100 text-blue-700';
            case 'reviewing':
            case 'in review':
                return 'bg-yellow-100 text-yellow-700';
            case 'interview':
                return 'bg-purple-100 text-purple-700';
            case 'offer':
                return 'bg-green-100 text-green-700';
            case 'rejected':
            case 'declined':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'submitted':
                return <FileText className="w-4 h-4" />;
            case 'reviewing':
            case 'in review':
                return <Clock className="w-4 h-4" />;
            case 'interview':
                return <Calendar className="w-4 h-4" />;
            case 'offer':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
            case 'declined':
                return <XCircle className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.jobDepartment.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || app.status.toLowerCase() === filter.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    const statusCounts = {
        all: applications.length,
        submitted: applications.filter(a => a.status.toLowerCase() === 'submitted').length,
        reviewing: applications.filter(a => a.status.toLowerCase().includes('review')).length,
        interview: applications.filter(a => a.status.toLowerCase() === 'interview').length,
        offer: applications.filter(a => a.status.toLowerCase() === 'offer').length,
        rejected: applications.filter(a => a.status.toLowerCase() === 'rejected').length,
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/careers" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                                <Briefcase className="w-6 h-6" />
                                <span className="font-bold text-xl">RecruitAI</span>
                            </Link>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">{t('candidate.dashboard.title')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{fullName || t('candidate.dashboard.candidate')}</p>
                                    <p className="text-xs text-slate-500">{t('candidate.dashboard.applicant')}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                {t('candidate.dashboard.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        {t('candidate.dashboard.welcome')}, {fullName || t('candidate.dashboard.candidate')}!
                    </h1>
                    <p className="text-slate-500">{t('candidate.dashboard.subtitle')}</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        { key: 'all', label: t('candidate.dashboard.stats.all'), color: 'bg-slate-100 text-slate-700' },
                        { key: 'submitted', label: t('candidate.dashboard.stats.submitted'), color: 'bg-blue-100 text-blue-700' },
                        { key: 'reviewing', label: t('candidate.dashboard.stats.reviewing'), color: 'bg-yellow-100 text-yellow-700' },
                        { key: 'interview', label: t('candidate.dashboard.stats.interview'), color: 'bg-purple-100 text-purple-700' },
                        { key: 'offer', label: t('candidate.dashboard.stats.offer'), color: 'bg-green-100 text-green-700' },
                    ].map((stat) => (
                        <button
                            key={stat.key}
                            onClick={() => setFilter(stat.key)}
                            className={`p-4 rounded-xl text-left transition-all ${filter === stat.key
                                    ? 'ring-2 ring-indigo-600 shadow-lg'
                                    : 'bg-white shadow hover:shadow-md'
                                }`}
                        >
                            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                                {statusCounts[stat.key as keyof typeof statusCounts]}
                            </div>
                            <div className="text-sm text-slate-600">{stat.label}</div>
                        </button>
                    ))}
                </div>

                {/* Browse Jobs CTA */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold mb-2">{t('candidate.dashboard.browseJobs.title')}</h2>
                            <p className="text-indigo-100">{t('candidate.dashboard.browseJobs.subtitle')}</p>
                        </div>
                        <Link
                            to="/careers"
                            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap"
                        >
                            {t('candidate.dashboard.browseJobs.button')}
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Applications List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-indigo-600" />
                                {t('candidate.dashboard.applications.title')}
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('candidate.dashboard.applications.search')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                    <Filter className="w-4 h-4" />
                                    {t('candidate.dashboard.applications.filter')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Applications */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-600 mb-2">
                                {t('candidate.dashboard.applications.empty.title')}
                            </h3>
                            <p className="text-slate-400 mb-6">
                                {t('candidate.dashboard.applications.empty.subtitle')}
                            </p>
                            <Link
                                to="/careers"
                                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                {t('candidate.dashboard.applications.empty.button')}
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {filteredApplications.map((app) => (
                                <div key={app.id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-indigo-100 p-3 rounded-xl">
                                                <Building2 className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                                                    {app.jobTitle}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        {app.jobDepartment}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(app.appliedAt)}
                                                    </span>
                                                    {app.cvFileName && (
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="w-4 h-4" />
                                                            {app.cvFileName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                                                {getStatusIcon(app.status)}
                                                {app.status}
                                            </div>
                                            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tips Section */}
                <div className="mt-8 bg-blue-50 rounded-2xl p-6">
                    <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {t('candidate.dashboard.tips.title')}
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            t('candidate.dashboard.tips.tip1'),
                            t('candidate.dashboard.tips.tip2'),
                            t('candidate.dashboard.tips.tip3'),
                        ].map((tip, index) => (
                            <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                                <p className="text-sm text-slate-600">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CandidateDashboard;
