import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Plus, Search, Filter, Clock, Users, CheckCircle2, AlertCircle,
    Brain, Code, Globe, FileText, Trash2, Edit, Eye, Copy, ChevronRight, Loader2, FileUp
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { exportService } from '../services/export.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';

interface Assessment {
    id: number;
    title: string;
    description: string;
    assessmentType: string;
    durationMinutes: number;
    passingScore: number;
    maxAttempts: number;
    status: string;
    createdAt: string;
}

interface AssessmentTemplate {
    id: number;
    name: string;
    description: string;
    assessmentType: string;
    estimatedDuration: number;
    difficulty: string;
}

const Assessments: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { addNotification } = useNotifications();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assessmentsRes, templatesRes] = await Promise.all([
                apiService.getAssessments(),
                apiService.getAssessmentTemplates()
            ]);
            setAssessments((assessmentsRes as any)?.data || []);
            setTemplates((templatesRes as any)?.data || []);
        } catch (err) {
            console.error('Failed to fetch assessments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Title' },
            { key: 'assessmentType', label: 'Type' },
            { key: 'durationMinutes', label: 'Duration (Min)' },
            { key: 'passingScore', label: 'Pass Score (%)' },
            { key: 'maxAttempts', label: 'Max Attempts' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Created At', formatter: (v: any) => v ? new Date(v).toLocaleDateString() : '' },
        ];
        exportService.exportToCSV(assessments, columns, 'assessments-export');
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'psychotest': return <Brain className="text-purple-500" size={20} />;
            case 'coding': return <Code className="text-blue-500" size={20} />;
            case 'language': return <Globe className="text-green-500" size={20} />;
            case 'technical': return <FileText className="text-orange-500" size={20} />;
            default: return <ClipboardList className="text-slate-500" size={20} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'psychotest': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'coding': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'language': return 'bg-green-50 text-green-700 border-green-200';
            case 'technical': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('assessList.deleteConfirm'))) return;
        try {
            await apiService.deleteAssessment(id);
            addNotification('info', t('notifications.assessmentDeleted') || 'Assessment Deleted', t('notifications.assessmentDeletedMsg') || 'Assessment has been deleted.');
            fetchData();
        } catch (err) {
            console.error('Failed to delete assessment:', err);
            alert(t('assessList.deleteFailed'));
        }
    };

    const filteredAssessments = assessments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || a.assessmentType === filterType;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={48} className="text-indigo-600 animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('assessList.loading')}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900">{t('assessList.title')}</h1>
                    <p className="text-slate-500 mt-2">{t('assessList.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowTemplatesModal(true)}
                        className="px-6 py-4 bg-white text-indigo-600 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-50 shadow-xl shadow-indigo-100/50 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Copy size={20} /> {t('assessList.useTemplate')}
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={20} /> {t('assessList.createAssessment')}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{assessments.length}</p>
                            <p className="text-xs text-slate-500 font-medium">{t('assessList.totalTests')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                            <Brain size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{assessments.filter(a => a.assessmentType === 'psychotest').length}</p>
                            <p className="text-xs text-slate-500 font-medium">{t('assessList.psychotests')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Code size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{assessments.filter(a => a.assessmentType === 'coding').length}</p>
                            <p className="text-xs text-slate-500 font-medium">{t('assessList.codingTests')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                            <Globe size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{assessments.filter(a => a.assessmentType === 'language').length}</p>
                            <p className="text-xs text-slate-500 font-medium">{t('assessList.languageTests')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('assessList.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 ring-indigo-500"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 ring-indigo-500"
                >
                    <option value="all">{t('assessList.allTypes')}</option>
                    <option value="psychotest">{t('assessList.psychotest')}</option>
                    <option value="coding">{t('assessList.coding')}</option>
                    <option value="language">{t('assessList.language')}</option>
                    <option value="technical">{t('assessList.technical')}</option>
                </select>
                <button
                    onClick={handleExport}
                    className="px-4 py-2.5 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <FileUp size={18} />
                    {t('assessList.exportCsv')}
                </button>
            </div>

            {/* Assessments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssessments.map((assessment) => (
                    <div
                        key={assessment.id}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {getTypeIcon(assessment.assessmentType)}
                                <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getTypeColor(assessment.assessmentType)}`}>
                                    {assessment.assessmentType.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Eye size={16} className="text-slate-500" />
                                </button>
                                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Edit size={16} className="text-slate-500" />
                                </button>
                                <button
                                    onClick={() => handleDelete(assessment.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-2">{assessment.title}</h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{assessment.description}</p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{assessment.durationMinutes} {t('assessList.min')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle2 size={14} />
                                <span>{t('assessList.pass')}: {assessment.passingScore}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users size={14} />
                                <span>{assessment.maxAttempts} {t('assessList.attempts')}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${assessment.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                {assessment.status.toUpperCase()}
                            </span>
                            <button
                                onClick={() => navigate(`/assessments/${assessment.id}`)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                {t('assessList.manageQuestions')} <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredAssessments.length === 0 && (
                    <div className="col-span-full text-center py-20">
                        <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('assessList.noAssessments')}</p>
                        <p className="text-sm text-slate-400 mt-2">{t('assessList.createFirst')}</p>
                    </div>
                )}
            </div>

            {/* Create Assessment Modal */}
            {showCreateModal && (
                <CreateAssessmentModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchData();
                    }}
                />
            )}

            {/* Templates Modal */}
            {showTemplatesModal && (
                <TemplatesModal
                    templates={templates}
                    onClose={() => setShowTemplatesModal(false)}
                    onSelect={(template) => {
                        setShowTemplatesModal(false);
                        setShowCreateModal(true);
                    }}
                />
            )}
        </div>
    );
};

// Create Assessment Modal Component
const CreateAssessmentModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
    const { t } = useLanguage();
    const { addNotification } = useNotifications();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assessmentType: 'psychotest',
        durationMinutes: 30,
        passingScore: 70,
        maxAttempts: 1,
        shuffleQuestions: true,
        showResultsImmediately: false,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiService.createAssessment(formData);
            addNotification('assessment_created', t('notifications.assessmentCreated'), t('notifications.assessmentCreatedMsg').replace('{title}', formData.title));
            onSuccess();
        } catch (err) {
            console.error('Failed to create assessment:', err);
            alert(t('assessList.createFailed'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">{t('assessList.createAssessment')}</h2>
                    <p className="text-slate-500 text-sm mb-8">{t('assessList.createDescription')}</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('assess.title')}</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500"
                                placeholder="e.g., JavaScript Proficiency Test"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('assess.description')}</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 min-h-[100px]"
                                placeholder="Describe what this test covers..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('assess.type')}</label>
                            <select
                                value={formData.assessmentType}
                                onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500"
                            >
                                <option value="psychotest">{t('assessList.psychotest')}</option>
                                <option value="coding">{t('assessList.codingChallenge')}</option>
                                <option value="language">{t('assessList.languageTest')}</option>
                                <option value="technical">{t('assessList.technicalAssessment')}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('assess.duration')}</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="180"
                                    value={formData.durationMinutes}
                                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('assess.passingScore')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.passingScore}
                                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('assess.maxAttempts')}</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.maxAttempts}
                                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                            >
                                {saving ? t('assessList.creating') : t('assessList.createAssessment')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Templates Modal Component
const TemplatesModal: React.FC<{
    templates: AssessmentTemplate[];
    onClose: () => void;
    onSelect: (template: AssessmentTemplate) => void;
}> = ({ templates, onClose, onSelect }) => {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">{t('assessList.templates')}</h2>
                    <p className="text-slate-500 text-sm mb-8">{t('assessList.templatesDesc')}</p>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => onSelect(template)}
                                className="w-full p-6 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all text-left group"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                            <span className="capitalize">{template.assessmentType}</span>
                                            <span>•</span>
                                            <span>{template.estimatedDuration} min</span>
                                            <span>•</span>
                                            <span className="capitalize">{template.difficulty}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Assessments;
