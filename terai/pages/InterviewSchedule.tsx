import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, Video, Phone, MapPin, Users, Plus, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, AlertCircle, Filter, Search, MoreHorizontal,
    VideoOff, PhoneOff, Building2, Edit2, Trash2, Send
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';

// Type matching backend InterviewSchedule
interface InterviewScheduleData {
    id: number;
    candidateId: number;
    candidateName: string;
    jobId: number;
    jobTitle: string;
    recruiterId?: number;
    recruiterName: string;
    scheduledAt: string;
    durationMinutes: number;
    interviewType: string;
    status: string;
    location: string;
    meetingUrl: string;
    notes: string;
    cancelReason?: string;
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

const InterviewSchedule: React.FC = () => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState<InterviewScheduleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState<InterviewScheduleData | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Form state
    const [formData, setFormData] = useState({
        candidateName: '',
        candidateEmail: '',
        jobTitle: '',
        scheduledAt: '',
        duration: 60,
        type: 'video' as 'video' | 'phone' | 'onsite',
        location: '',
        notes: '',
    });

    useEffect(() => {
        loadInterviews();
    }, [filterStatus]);

    const loadInterviews = async () => {
        setLoading(true);
        try {
            const statusFilter = filterStatus !== 'all' ? filterStatus : undefined;
            const response = await apiService.getInterviewSchedules(statusFilter);
            setInterviews(response?.data || []);
        } catch (error) {
            addToast('error', t('interviewSchedule.loadFailed') || 'Failed to load interviews');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSchedule = async () => {
        try {
            await apiService.createInterviewSchedule({
                candidateName: formData.candidateName,
                jobTitle: formData.jobTitle,
                scheduledAt: formData.scheduledAt,
                durationMinutes: formData.duration,
                interviewType: formData.type,
                location: formData.location,
                notes: formData.notes,
            });

            await loadInterviews(); // Reload from API
            setShowScheduleModal(false);
            resetForm();
            addToast('success', 'Interview scheduled successfully');
            addNotification('interview_scheduled', t('notifications.interviewScheduled'), t('notifications.interviewScheduledMsg').replace('{candidate}', formData.candidateName));
        } catch (error) {
            addToast('error', 'Failed to schedule interview');
        }
    };

    const handleCancelInterview = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this interview?')) return;

        try {
            await apiService.cancelInterviewSchedule(id);
            setSelectedInterview(null);
            await loadInterviews(); // Reload from API
            addToast('success', t('common.success'));
        } catch (error) {
            addToast('error', t('common.error'));
        }
    };

    const resetForm = () => {
        setFormData({
            candidateName: '',
            candidateEmail: '',
            jobTitle: '',
            scheduledAt: '',
            duration: 60,
            type: 'video',
            location: '',
            notes: '',
        });
    };

    // Calendar navigation
    const navigateCalendar = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get days for calendar view
    const getDaysInView = () => {
        const days: Date[] = [];

        if (viewMode === 'month') {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            // Start from previous month's days
            const startDay = firstDay.getDay();
            for (let i = startDay - 1; i >= 0; i--) {
                days.push(new Date(firstDay.getTime() - i * 86400000));
            }

            // Current month days
            for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
                days.push(new Date(d));
            }

            // Next month days
            const remaining = 42 - days.length;
            for (let i = 1; i <= remaining; i++) {
                days.push(new Date(lastDay.getTime() + i * 86400000));
            }
        } else if (viewMode === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

            for (let i = 0; i < 7; i++) {
                days.push(new Date(startOfWeek.getTime() + i * 86400000));
            }
        } else {
            days.push(new Date(currentDate));
        }

        return days;
    };

    // Get interviews for a specific date
    const getInterviewsForDate = (date: Date) => {
        return interviews.filter(interview => {
            const interviewDate = new Date(interview.scheduledAt);
            return interviewDate.toDateString() === date.toDateString();
        });
    };

    // Format helpers
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'in-progress': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={14} />;
            case 'phone': return <Phone size={14} />;
            case 'onsite': return <Building2 size={14} />;
            default: return <Video size={14} />;
        }
    };

    const days = getDaysInView();
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

    return (
        <div className="mx-auto py-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">{t('interviewSchedule.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('interviewSchedule.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={20} />
                    {t('interviewSchedule.addNew')}
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Navigation */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigateCalendar('prev')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={goToToday}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-sm transition-all"
                            >
                                {t('interviewSchedule.today')}
                            </button>
                            <button
                                onClick={() => navigateCalendar('next')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Current Period */}
                        <h2 className="text-lg font-bold text-slate-900">
                            {viewMode === 'month'
                                ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                : viewMode === 'week'
                                    ? `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        >
                            <option value="all">{t('interviewSchedule.allStatus')}</option>
                            <option value="scheduled">{t('interviewSchedule.scheduled')}</option>
                            <option value="confirmed">{t('interviewSchedule.confirmed')}</option>
                            <option value="completed">{t('interviewSchedule.completed')}</option>
                            <option value="cancelled">{t('interviewSchedule.cancelled')}</option>
                        </select>

                        {/* View Mode */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            {(['day', 'week', 'month', 'list'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === mode
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {t(`interviewSchedule.${mode}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar View */}
            {viewMode !== 'list' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                    {/* Day Headers */}
                    {viewMode !== 'day' && (
                        <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} border-b border-slate-200`}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="p-3 text-center text-sm font-bold text-slate-500 bg-slate-50">
                                    {day}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Calendar Grid */}
                    <div className={viewMode === 'month' ? 'grid grid-cols-7' : viewMode === 'week' ? 'grid grid-cols-7' : ''}>
                        {days.map((day, index) => {
                            const dayInterviews = getInterviewsForDate(day);
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[120px] border-r border-b border-slate-100 p-2 ${viewMode === 'month' && !isCurrentMonth ? 'bg-slate-50' : ''
                                        } ${isToday ? 'bg-indigo-50/50' : ''}`}
                                >
                                    <div className={`text-sm font-bold mb-2 ${isToday ? 'text-indigo-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {day.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {dayInterviews.slice(0, 3).map((interview) => (
                                            <button
                                                key={interview.id}
                                                onClick={() => setSelectedInterview(interview)}
                                                className={`w-full text-left p-1.5 rounded-lg text-xs font-medium border ${getStatusColor(interview.status)} truncate`}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {getTypeIcon(interview.interviewType)}
                                                    {formatTime(interview.scheduledAt)} - {interview.candidateName || 'N/A'}
                                                </span>
                                            </button>
                                        ))}
                                        {dayInterviews.length > 3 && (
                                            <div className="text-xs text-slate-500 text-center">
                                                +{dayInterviews.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* List View */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('interviewSchedule.candidate')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('interviewSchedule.position')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('interviewSchedule.dateTime')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('interviewSchedule.type')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('common.status')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {interviews.map((interview) => (
                                <tr key={interview.id} className="hover:bg-slate-50 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-sm font-bold text-indigo-600">
                                                    {interview.candidateName.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{interview.candidateName}</p>
                                                <p className="text-xs text-slate-400">ID: {interview.candidateId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{interview.jobTitle}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="font-medium text-slate-900">{formatDate(new Date(interview.scheduledAt))}</p>
                                            <p className="text-slate-400">{formatTime(interview.scheduledAt)} ({interview.durationMinutes} min)</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-2 text-sm text-slate-600">
                                            {getTypeIcon(interview.interviewType)}
                                            {(interview.interviewType || 'video').charAt(0).toUpperCase() + (interview.interviewType || 'video').slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(interview.status)}`}>
                                            {t(`interviewSchedule.${interview.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {interview.status === 'scheduled' && (
                                                <button
                                                    onClick={() => navigate(`/interviews/${interview.id}`)}
                                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                                                >
                                                    {t('interviewSchedule.startInterview')}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedInterview(interview)}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900">{t('interviewSchedule.addNew')}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">{t('interviewSchedule.candidate')}</label>
                                <input
                                    type="text"
                                    value={formData.candidateName}
                                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder={t('pool.searchPlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">{t('interviewSchedule.position')}</label>
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="e.g., Senior Software Engineer"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('interviewSchedule.dateTime')}</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduledAt}
                                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('interviewSchedule.durationMin')}</label>
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    >
                                        <option value={30}>30 min</option>
                                        <option value={45}>45 min</option>
                                        <option value={60}>60 min</option>
                                        <option value={90}>90 min</option>
                                        <option value={120}>120 min</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">{t('interviewSchedule.type')}</label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'video', icon: Video, label: t('interviewSchedule.video') },
                                        { value: 'phone', icon: Phone, label: t('interviewSchedule.phone') },
                                        { value: 'onsite', icon: Building2, label: t('interviewSchedule.onsite') },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setFormData({ ...formData, type: type.value as any })}
                                            className={`flex-1 p-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${formData.type === type.value
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            <type.icon size={18} />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {formData.type === 'onsite' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('screening.location')}</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder="e.g., Office - Meeting Room A"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">{t('interviewSchedule.notes')}</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                    rows={3}
                                    placeholder={t('interviewScorecard.notesPlaceholder')}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowScheduleModal(false); resetForm(); }}
                                className="px-6 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleCreateSchedule}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                            >
                                {t('interviewSchedule.addNew')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interview Detail Modal */}
            {selectedInterview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">{t('interviewSchedule.scheduleDetail')}</h3>
                                <button
                                    onClick={() => setSelectedInterview(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    <XCircle size={20} className="text-slate-400" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-lg font-bold text-indigo-600">
                                        {selectedInterview.candidateName.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{selectedInterview.candidateName}</h4>
                                    <p className="text-sm text-slate-500">{selectedInterview.jobTitle}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar size={18} className="text-slate-400" />
                                    <span className="text-slate-600">{formatDate(new Date(selectedInterview.scheduledAt))}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock size={18} className="text-slate-400" />
                                    <span className="text-slate-600">{formatTime(selectedInterview.scheduledAt)} ({selectedInterview.durationMinutes} min)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    {getTypeIcon(selectedInterview.interviewType)}
                                    <span className="text-slate-600">
                                        {t(`interviewSchedule.${selectedInterview.interviewType}`)}
                                    </span>
                                </div>
                                {selectedInterview.location && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin size={18} className="text-slate-400" />
                                        <span className="text-slate-600">{selectedInterview.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedInterview.status)}`}>
                                    {t(`interviewSchedule.${selectedInterview.status}`)}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-between">
                            <button
                                onClick={() => handleCancelInterview(selectedInterview.id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all"
                            >
                                {t('interviewSchedule.cancelled')}
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedInterview(null)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    {t('common.close')}
                                </button>
                                {selectedInterview.status === 'scheduled' && (
                                    <button
                                        onClick={() => navigate(`/interviews/${selectedInterview.id}`)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
                                    >
                                        {t('interviewSchedule.startInterview')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewSchedule;
