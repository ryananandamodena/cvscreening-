import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power, Briefcase, Search, Filter, CheckCircle2, XCircle, FileUp, Upload, Users, Loader2, Zap, Settings2 } from 'lucide-react';
import { apiService } from '../services/api.service';
import { exportService } from '../services/export.service';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TableRowSkeleton } from '../components/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface Job {
    id: number;
    title: string;
    department: string;
    description: string;
    requirements: string;
    location: string;
    employmentType: string;
    salaryMin: number;
    salaryMax: number;
    status: string;
    createdAt: string;
}

interface JobStats {
    totalScreenings: number;
    highMatchCount: number;
    avgScore: number;
}

const JobManagement = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showJobForm, setShowJobForm] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [jobStats, setJobStats] = useState<Map<number, JobStats>>(new Map());
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { t } = useLanguage();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await apiService.get<any>('/jobs');
            // Handle both array (legacy) and paginated response
            const jobsData = Array.isArray(response) ? response : (response.data || []);
            setJobs(jobsData?.data || jobsData || []);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            addToast('error', t('jobs.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Fetch screening stats whenever jobs change
    useEffect(() => {
        if (jobs.length > 0) {
            fetchScreeningStats();
        }
    }, [jobs]);

    const fetchScreeningStats = async () => {
        try {
            const response = await apiService.get<any>('/screenings');
            const screenings = response?.data || response || [];
            const statsMap = new Map<number, JobStats>();

            jobs.forEach(job => {
                const jobScreenings = screenings.filter(s => s.jobId === job.id);
                const totalScreenings = jobScreenings.length;
                const highMatchCount = jobScreenings.filter(s => s.score >= 80).length;
                const avgScore = totalScreenings > 0
                    ? Math.round(jobScreenings.reduce((sum, s) => sum + s.score, 0) / totalScreenings)
                    : 0;

                statsMap.set(job.id, { totalScreenings, highMatchCount, avgScore });
            });

            setJobStats(statsMap);
        } catch (error) {
            console.error('Failed to fetch screening stats:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('jobs.deleteConfirm'))) return;

        try {
            await apiService.delete(`/jobs/${id}`);
            setJobs(jobs.filter(j => j.id !== id));
            addToast('success', t('jobs.deleteSuccess'));
        } catch (error) {
            console.error('Failed to delete job:', error);
            addToast('error', t('jobs.deleteFailed'));
        }
    };

    const handleExport = () => {
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Title' },
            { key: 'department', label: 'Department' },
            { key: 'location', label: 'Location' },
            { key: 'employmentType', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Created At', formatter: (v: any) => v ? new Date(v).toLocaleDateString() : '' },
        ];
        exportService.exportToCSV(jobs, columns, `job-management-export`);
    };

    const handleToggleStatus = async (job: Job) => {
        const newStatus = job.status === 'active' ? 'inactive' : 'active';

        try {
            await apiService.put(`/jobs/${job.id}`, { ...job, status: newStatus });
            setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
        } catch (error) {
            console.error('Failed to update job status:', error);
            addToast('error', t('common.error'));
        }
    };

    const handleEdit = (job: Job) => {
        setEditingJob(job);
        setShowJobForm(true);
    };

    const handleCreateNew = () => {
        setEditingJob(null);
        setShowJobForm(true);
    };

    const handleFormClose = () => {
        setShowJobForm(false);
        setEditingJob(null);
        fetchJobs();
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = filterDepartment === 'all' || job.department === filterDepartment;
        const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
        return matchesSearch && matchesDepartment && matchesStatus;
    });

    const departments = Array.from(new Set(jobs.map(j => j.department)));

    if (showJobForm) {
        return <JobForm job={editingJob} onClose={handleFormClose} />;
    }

    return (
        <div className="mx-auto py-8 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="relative">
                    <div className="absolute -left-4 top-0 w-12 h-12 bg-brand-600 rounded-full blur-[40px] opacity-20"></div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('jobs.title')}</h1>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-1 tracking-tight">{t('jobs.subtitle')}</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" size="lg" icon={<FileUp size={20} />} onClick={handleExport}>
                        {t('jobs.exportCsv')}
                    </Button>
                    <Button variant="primary" size="lg" icon={<Plus size={20} />} onClick={handleCreateNew}>
                        {t('jobs.createNew')}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[32px] border border-slate-200 dark:border-neutral-800 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={t('jobs.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-600/20 focus:bg-white dark:bg-neutral-900 rounded-2xl text-sm transition-all outline-none font-bold"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="w-full pl-14 pr-10 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-600/20 focus:bg-white dark:bg-neutral-900 rounded-2xl text-sm transition-all outline-none font-bold appearance-none cursor-pointer"
                        >
                            <option value="all">{t('jobs.allDepartments')}</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full pl-14 pr-10 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-600/20 focus:bg-white dark:bg-neutral-900 rounded-2xl text-sm transition-all outline-none font-bold appearance-none cursor-pointer"
                        >
                            <option value="all">{t('jobs.allStatus')}</option>
                            <option value="active">{t('jobs.active')}</option>
                            <option value="inactive">{t('jobs.inactive')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-[32px] border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                        <Briefcase size={64} />
                    </div>
                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">{t('jobs.totalJobs')}</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{jobs.length}</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-[32px] border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-emerald-600">
                        <CheckCircle2 size={64} />
                    </div>
                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">{t('jobs.active')}</p>
                    <p className="text-4xl font-black text-emerald-600">{jobs.filter(j => j.status === 'active').length}</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-[32px] border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-slate-600 dark:text-slate-400">
                        <XCircle size={64} />
                    </div>
                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">{t('jobs.inactive')}</p>
                    <p className="text-4xl font-black text-slate-600 dark:text-slate-400">{jobs.filter(j => j.status === 'inactive').length}</p>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/60 shadow-lg overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-slate-100">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <TableRowSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700 dark:text-slate-300">
                            <Briefcase size={40} />
                        </div>
                        <p className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">{t('jobs.noJobs')}</p>
                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-2">{t('jobs.createFirst')}</p>
                        <Button variant="primary" size="lg" className="mt-8" onClick={handleCreateNew}>
                            {t('jobs.createNew')}
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 border-b border-slate-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.jobTitle')}</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.department')}</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.candidates')}</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredJobs.map((job) => {
                                    const stats = jobStats.get(job.id) || { totalScreenings: 0, highMatchCount: 0, avgScore: 0 };
                                    return (
                                        <tr key={job.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors text-lg tracking-tight">{job.title}</p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 uppercase tracking-wider">{job.location} • {job.employmentType}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge tone="neutral" className="group-hover:bg-brand-50 group-hover:text-brand-700 dark:group-hover:bg-brand-900/40 dark:group-hover:text-brand-400 transition-all">
                                                    {job.department}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => navigate(`/screening?tab=history&jobId=${job.id}`)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-white dark:bg-neutral-900 text-slate-600 dark:text-slate-400 hover:text-brand-600 rounded-2xl transition-all border border-slate-100 dark:border-neutral-800 font-black text-sm group/btn shadow-sm hover:shadow-md"
                                                    >
                                                        <Users size={16} className="text-slate-600 dark:text-slate-400 group-hover/btn:text-brand-600" />
                                                        {stats.totalScreenings}
                                                    </button>
                                                    {stats.highMatchCount > 0 && (
                                                        <Badge tone="success">{stats.highMatchCount} ★</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button onClick={() => handleToggleStatus(job)} className="hover:opacity-80 transition-opacity">
                                                    <Badge tone={job.status === 'active' ? 'success' : 'neutral'}>
                                                        {job.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                        {job.status === 'active' ? t('jobs.active') : t('jobs.inactive')}
                                                    </Badge>
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        icon={<FileUp size={14} />}
                                                        onClick={() => navigate(`/screening?tab=single&jobId=${job.id}`)}
                                                        className="uppercase tracking-widest text-[10px]"
                                                    >
                                                        {t('jobs.screen')}
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        icon={<Upload size={14} />}
                                                        onClick={() => navigate(`/screening?tab=bulk&jobId=${job.id}`)}
                                                        className="uppercase tracking-widest text-[10px]"
                                                    >
                                                        {t('jobs.bulk')}
                                                    </Button>
                                                    <div className="h-4 w-px bg-slate-200 dark:bg-neutral-700 mx-1"></div>
                                                    <button
                                                        onClick={() => handleEdit(job)}
                                                        className="p-2.5 bg-white dark:bg-neutral-900 text-slate-600 dark:text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/40 rounded-xl transition-all border border-slate-100 dark:border-neutral-800"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(job.id)}
                                                        className="p-2.5 bg-white dark:bg-neutral-900 text-slate-600 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-xl transition-all border border-slate-100 dark:border-neutral-800"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// JobForm Component (inline for now)
const JobForm: React.FC<{ job: Job | null; onClose: () => void }> = ({ job, onClose }) => {
    const [formData, setFormData] = useState({
        title: job?.title || '',
        department: job?.department || 'Engineering',
        description: job?.description || '',
        requirements: job?.requirements || '',
        location: job?.location || 'Remote',
        employmentType: job?.employmentType || 'full-time',
        salaryMin: job?.salaryMin || 0,
        salaryMax: job?.salaryMax || 0,
        status: job?.status || 'active'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (job) {
                // Update existing job
                await apiService.put(`/jobs/${job.id}`, formData);
            } else {
                // Create new job
                await apiService.post('/jobs', formData);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto py-8 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between">
                <div className="relative">
                    <div className="absolute -left-4 top-0 w-12 h-12 bg-brand-600 rounded-full blur-[40px] opacity-20"></div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {job ? t('jobs.editJob') : t('jobs.createJob')}
                    </h1>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-1 tracking-tight">{t('jobs.formSubtitle')}</p>
                </div>
                <Button variant="secondary" size="lg" onClick={onClose} className="uppercase tracking-widest text-[10px]">
                    {t('common.cancel')}
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-slate-200/60 dark:border-neutral-800 shadow-lg space-y-6">
                {error && (
                    <div className="p-4 bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-500/20 rounded-2xl text-danger-600 dark:text-danger-500 font-bold">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.jobTitle')} *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Senior Frontend Developer"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.department')} *</label>
                        <select
                            required
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold appearance-none"
                        >
                            <option>Engineering</option>
                            <option>Design</option>
                            <option>Marketing</option>
                            <option>Human Resources</option>
                            <option>Sales</option>
                            <option>Product</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.location')} *</label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Remote, Jakarta, etc."
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.employmentType')} *</label>
                        <select
                            required
                            value={formData.employmentType}
                            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold appearance-none"
                        >
                            <option value="full-time">Full Time</option>
                            <option value="part-time">Part Time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.salaryMin')}</label>
                        <input
                            type="number"
                            value={formData.salaryMin}
                            onChange={(e) => setFormData({ ...formData, salaryMin: Number(e.target.value) })}
                            placeholder="0"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.salaryMax')}</label>
                        <input
                            type="number"
                            value={formData.salaryMax}
                            onChange={(e) => setFormData({ ...formData, salaryMax: Number(e.target.value) })}
                            placeholder="0"
                            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.description')} *</label>
                    <textarea
                        required
                        rows={6}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the role, responsibilities, and what makes this position unique..."
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-medium text-slate-700 dark:text-slate-300"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.requirements')} *</label>
                    <textarea
                        required
                        rows={6}
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        placeholder="List the required skills, experience, and qualifications..."
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-medium text-slate-700 dark:text-slate-300"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('common.status')}</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold appearance-none"
                    >
                        <option value="active">{t('jobs.active')}</option>
                        <option value="inactive">{t('jobs.inactive')}</option>
                    </select>
                </div>

                <div className="flex gap-4 pt-8">
                    <Button type="button" variant="secondary" size="lg" onClick={onClose} className="flex-1 uppercase tracking-widest text-[10px]">
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" variant="primary" size="lg" loading={loading} className="flex-[2] uppercase tracking-widest text-[10px]">
                        {loading ? t('jobs.saving') : job ? t('jobs.editJob') : t('jobs.createJob')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default JobManagement;
