import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, DollarSign, Building2, Search, ChevronRight, Users, TrendingUp, Award } from 'lucide-react';
import { candidatePortalService, CandidateJob } from '../services/candidate-portal.service';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const Careers: React.FC = () => {
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<CandidateJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const response = await candidatePortalService.getJobs();
            setJobs(response.jobs || []);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            job.employmentType.toLowerCase() === filter.toLowerCase() ||
            job.location.toLowerCase().includes(filter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    const formatSalary = (min: number, max: number) => {
        const formatter = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        });
        return `${formatter.format(min)} - ${formatter.format(max)}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 dark:from-neutral-950 dark:to-neutral-900">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-brand-600 to-brand-700 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                            {t('career.hero.title')}
                        </h1>
                        <p className="text-xl text-brand-100 mb-8 max-w-2xl mx-auto">
                            {t('career.hero.subtitle')}
                        </p>

                        {/* Search Box */}
                        <div className="max-w-2xl mx-auto">
                            <div className="flex gap-2 bg-white dark:bg-neutral-900 rounded-2xl p-2 shadow-2xl">
                                <div className="flex-1 flex items-center px-4">
                                    <Search className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-3" />
                                    <input
                                        type="text"
                                        placeholder={t('career.search.placeholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 bg-transparent text-slate-800 dark:text-white outline-none placeholder-slate-400"
                                    />
                                </div>
                                <Button className="rounded-xl">
                                    {t('career.search.button')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 100" fill="currentColor" className="text-slate-50 dark:text-neutral-950">
                        <path d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,75 1440,50 L1440,100 L0,100 Z" />
                    </svg>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { icon: Briefcase, value: '50+', label: t('career.stats.openPositions') },
                        { icon: Users, value: '500+', label: t('career.stats.employees') },
                        { icon: TrendingUp, value: '95%', label: t('career.stats.growthRate') },
                        { icon: Award, value: '20+', label: t('career.stats.awards') },
                    ].map((stat, index) => (
                        <div key={index} className="bg-white dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl p-6 shadow-lg dark:shadow-none text-center hover:shadow-xl transition-shadow">
                            <stat.icon className="w-10 h-10 mx-auto mb-3 text-brand-600 dark:text-brand-400" />
                            <div className="text-3xl font-black text-slate-800 dark:text-white">{stat.value}</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-wrap gap-2 mb-8">
                    {[
                        { value: 'all', label: t('career.filter.all') },
                        { value: 'full-time', label: t('career.filter.fullTime') },
                        { value: 'part-time', label: t('career.filter.partTime') },
                        { value: 'remote', label: t('career.filter.remote') },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-2 rounded-full font-medium transition-all ${filter === f.value
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                                    : 'bg-white dark:bg-neutral-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Jobs List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl shadow-lg dark:shadow-none">
                        <Briefcase className="w-16 h-16 mx-auto text-slate-700 dark:text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('career.noJobs.title')}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{t('career.noJobs.subtitle')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg dark:shadow-none hover:shadow-xl transition-all group cursor-pointer border border-slate-100 dark:border-neutral-800"
                                onClick={() => navigate(`/careers/${job.id}`)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-brand-50 dark:bg-brand-900/40 p-3 rounded-xl">
                                            <Building2 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                                {job.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-700 dark:text-slate-300">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    {job.department}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                                <Badge tone="brand">
                                                    <Clock className="w-3 h-3" />
                                                    {job.employmentType}
                                                </Badge>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    {formatSalary(job.salaryMin, job.salaryMax)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            to={`/careers/${job.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button className="whitespace-nowrap">
                                                {t('career.applyNow')}
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-3xl p-8 md:p-12 text-white text-center">
                    <h2 className="text-3xl font-bold mb-4">{t('career.cta.title')}</h2>
                    <p className="text-brand-100 mb-6 max-w-2xl mx-auto">{t('career.cta.subtitle')}</p>
                    <Link
                        to="/candidate/register"
                        className="inline-flex items-center gap-2 bg-white text-brand-600 px-8 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
                    >
                        {t('career.cta.button')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Careers;
