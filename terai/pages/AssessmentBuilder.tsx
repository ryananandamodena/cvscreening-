import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Save, Trash2, Edit, GripVertical, Eye, Settings,
    Brain, Code, Globe, FileText, Clock, CheckCircle2, AlertCircle, Loader2,
    ChevronUp, ChevronDown, Copy, FileQuestion
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface Question {
    id: number;
    assessmentId: number;
    questionText: string;
    questionType: string;
    options: string[] | null;
    correctAnswer: string | null;
    points: number;
    order: number;
    required: boolean;
}

interface Assessment {
    id: number;
    title: string;
    description: string;
    assessmentType: string;
    durationMinutes: number;
    passingScore: number;
    maxAttempts: number;
    status: string;
}

const AssessmentBuilder: React.FC = () => {
    const { t } = useLanguage();
    const { addNotification } = useNotifications();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const [assessmentRes, questionsRes] = await Promise.all([
                apiService.getAssessment(parseInt(id!)),
                apiService.getAssessmentQuestions(parseInt(id!))
            ]);
            setAssessment(assessmentRes as Assessment);
            setQuestions((questionsRes as any)?.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = async (questionData: Partial<Question>) => {
        setSaving(true);
        try {
            await apiService.createAssessmentQuestion(parseInt(id!), {
                ...questionData,
                order: questions.length + 1
            });
            setShowAddModal(false);
            addNotification('info', t('common.success'), t('assess.saveSuccess'));
            fetchData();
        } catch (err) {
            console.error('Failed to add question:', err);
            addNotification('info', t('common.error'), t('assess.addFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateQuestion = async (questionId: number, questionData: Partial<Question>) => {
        setSaving(true);
        try {
            await apiService.updateAssessmentQuestion(parseInt(id!), questionId, questionData);
            setEditingQuestion(null);
            addNotification('info', t('common.success'), t('assess.saveSuccess'));
            fetchData();
        } catch (err) {
            console.error('Failed to update question:', err);
            addNotification('info', t('common.error'), t('assess.updateFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = async (questionId: number) => {
        if (!confirm(t('assess.deleteConfirm'))) return;

        try {
            await apiService.deleteAssessmentQuestion(parseInt(id!), questionId);
            addNotification('info', t('common.success'), t('notifications.assessmentDeleted') || 'Question Deleted');
            fetchData();
        } catch (err) {
            console.error('Failed to delete question:', err);
            addNotification('info', t('common.error'), t('assess.deleteFailed'));
        }
    };

    const handleMoveQuestion = async (questionId: number, direction: 'up' | 'down') => {
        const currentIndex = questions.findIndex(q => q.id === questionId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;

        const newQuestions = [...questions];
        [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];

        // Update order values
        const updates = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));
        setQuestions(updates);

        // TODO: Call API to update order
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'multiple_choice': return <CheckCircle2 size={16} className="text-blue-500" />;
            case 'essay': return <FileText size={16} className="text-green-500" />;
            case 'code': return <Code size={16} className="text-purple-500" />;
            case 'true_false': return <AlertCircle size={16} className="text-orange-500" />;
            case 'rating': return <FileQuestion size={16} className="text-pink-500" />;
            default: return <FileQuestion size={16} className="text-slate-700 dark:text-slate-300" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={48} className="text-brand-600 animate-spin" />
                <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('assess.loading')}</p>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
                <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('assess.notFound')}</p>
                <button
                    onClick={() => navigate('/assessments')}
                    className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl"
                >
                    {t('assess.backToList')}
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/assessments')}
                    className="p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">{assessment.title}</h1>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{assessment.description}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowPreview(true)}
                        variant="outline"
                        icon={<Eye size={18} />}
                    >
                        {t('assess.preview')}
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        icon={<Plus size={18} />}
                    >
                        {t('assess.addQuestion')}
                    </Button>
                </div>
            </div>

            {/* Assessment Info */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        {assessment.assessmentType === 'psychotest' && <Brain className="text-purple-500" size={24} />}
                        {assessment.assessmentType === 'coding' && <Code className="text-blue-500" size={24} />}
                        {assessment.assessmentType === 'language' && <Globe className="text-green-500" size={24} />}
                        {assessment.assessmentType === 'technical' && <FileText className="text-orange-500" size={24} />}
                        <span className="font-bold text-slate-900 dark:text-white capitalize">{assessment.assessmentType}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Clock size={16} />
                        <span>{assessment.durationMinutes} {t('assess.minutes')}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={16} />
                        <span>{t('assess.passingScore')}: {assessment.passingScore}%</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />
                    <Badge tone={assessment.status === 'active' ? 'success' : 'neutral'}>
                        {assessment.status.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('assess.questions')} ({questions.length})</h2>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        {t('assess.totalPoints')}: {questions.reduce((sum, q) => sum + q.points, 0)}
                    </div>
                </div>

                {questions.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-900 p-12 rounded-3xl border border-slate-200 dark:border-neutral-800 text-center">
                        <FileQuestion size={48} className="mx-auto text-slate-700 dark:text-slate-300 mb-4" />
                        <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs mb-2">{t('assess.noQuestions')}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-6">{t('assess.noQuestionsSub')}</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 inline-flex items-center gap-2"
                        >
                            <Plus size={18} /> {t('assess.addQuestion')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {questions.map((question, index) => (
                            <div
                                key={question.id}
                                className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => handleMoveQuestion(question.id, 'up')}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30"
                                        >
                                            <ChevronUp size={16} className="text-slate-600 dark:text-slate-400" />
                                        </button>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">#{index + 1}</span>
                                        <button
                                            onClick={() => handleMoveQuestion(question.id, 'down')}
                                            disabled={index === questions.length - 1}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30"
                                        >
                                            <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getTypeIcon(question.questionType)}
                                            <Badge tone={
                                                question.questionType === 'multiple_choice' ? 'info' :
                                                question.questionType === 'essay' ? 'success' :
                                                question.questionType === 'code' ? 'brand' :
                                                question.questionType === 'true_false' ? 'warning' : 'neutral'
                                            }>
                                                {question.questionType.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                            <span className="text-xs text-slate-600 dark:text-slate-400">{question.points} {t('assess.points_short')}</span>
                                            {question.required && (
                                                <Badge tone="danger">*{t('assess.required')}</Badge>
                                            )}
                                        </div>
                                        <p className="text-slate-900 dark:text-white font-medium">{question.questionText}</p>

                                        {question.questionType === 'multiple_choice' && question.options && (
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {question.options.map((opt, i) => (
                                                    <div
                                                        key={i}
                                                        className={`px-3 py-2 rounded-lg text-sm ${opt === question.correctAnswer
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-slate-50 dark:bg-neutral-800 text-slate-600'
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + i)}. {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {question.questionType === 'true_false' && (
                                            <div className="mt-3 flex gap-2">
                                                <span className={`px-3 py-1.5 rounded-lg text-sm ${question.correctAnswer === 'true' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 dark:bg-neutral-800 text-slate-600'
                                                    }`}>
                                                    {t('assess.true')}
                                                </span>
                                                <span className={`px-3 py-1.5 rounded-lg text-sm ${question.correctAnswer === 'false' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 dark:bg-neutral-800 text-slate-600'
                                                    }`}>
                                                    {t('assess.false')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingQuestion(question)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} className="text-slate-700 dark:text-slate-300" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuestion(question.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} className="text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Question Modal */}
            {(showAddModal || editingQuestion) && (
                <QuestionModal
                    question={editingQuestion}
                    assessmentType={assessment.assessmentType}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingQuestion(null);
                    }}
                    onSave={(data) => {
                        if (editingQuestion) {
                            handleUpdateQuestion(editingQuestion.id, data);
                        } else {
                            handleAddQuestion(data);
                        }
                    }}
                    saving={saving}
                />
            )}

            {/* Preview Modal */}
            {showPreview && (
                <PreviewModal
                    assessment={assessment}
                    questions={questions}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
};

// Question Modal Component
const QuestionModal: React.FC<{
    question: Question | null;
    assessmentType: string;
    onClose: () => void;
    onSave: (data: Partial<Question>) => void;
    saving: boolean;
}> = ({ question, assessmentType, onClose, onSave, saving }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        questionText: question?.questionText || '',
        questionType: question?.questionType || 'multiple_choice',
        options: question?.options || ['', '', '', ''],
        correctAnswer: question?.correctAnswer || '',
        points: question?.points || 1,
        required: question?.required ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: Partial<Question> = {
            questionText: formData.questionText,
            questionType: formData.questionType,
            points: formData.points,
            required: formData.required,
        };

        if (formData.questionType === 'multiple_choice') {
            data.options = formData.options.filter(o => o.trim());
            data.correctAnswer = formData.correctAnswer;
        } else if (formData.questionType === 'true_false') {
            data.correctAnswer = formData.correctAnswer;
        }

        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="p-10">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {question ? t('assess.editQuestion') : t('assess.addQuestion')}
                    </h2>
                    <p className="text-slate-700 dark:text-slate-300 text-sm mb-8">
                        {question ? t('assess.editQuestionSub') : t('assess.addQuestionSub')}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">{t('assess.questionType')}</label>
                            <select
                                value={formData.questionType}
                                onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-neutral-800 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-brand-500"
                            >
                                <option value="multiple_choice">{t('assess.multipleChoice')}</option>
                                <option value="true_false">{t('assess.trueFalse')}</option>
                                <option value="essay">{t('assess.essay')}</option>
                                {assessmentType === 'coding' && <option value="code">{t('assess.codeChallenge')}</option>}
                                <option value="rating">{t('assess.ratingScale')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">{t('assess.questionText')}</label>
                            <textarea
                                required
                                value={formData.questionText}
                                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-neutral-800 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-brand-500 min-h-[100px]"
                                placeholder={t('assess.questionPlaceholder')}
                            />
                        </div>

                        {formData.questionType === 'multiple_choice' && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">{t('assess.options')}</label>
                                {formData.options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-neutral-800 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...formData.options];
                                                newOptions[i] = e.target.value;
                                                setFormData({ ...formData, options: newOptions });
                                            }}
                                            className="flex-1 px-5 py-3 bg-slate-50 dark:bg-neutral-800 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-brand-500"
                                            placeholder={`${t('assess.option')} ${String.fromCharCode(65 + i)}`}
                                        />
                                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={formData.correctAnswer === opt}
                                                onChange={() => setFormData({ ...formData, correctAnswer: opt })}
                                                className="text-brand-600"
                                            />
                                            {t('assess.correct')}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formData.questionType === 'true_false' && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">{t('assess.correctAnswer')}</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.correctAnswer === 'true' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={formData.correctAnswer === 'true'}
                                            onChange={() => setFormData({ ...formData, correctAnswer: 'true' })}
                                            className="hidden"
                                        />
                                        <span className="font-bold text-slate-900 dark:text-white">{t('assess.true')}</span>
                                    </label>
                                    <label className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.correctAnswer === 'false' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={formData.correctAnswer === 'false'}
                                            onChange={() => setFormData({ ...formData, correctAnswer: 'false' })}
                                            className="hidden"
                                        />
                                        <span className="font-bold text-slate-900 dark:text-white">{t('assess.false')}</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">{t('assess.points')}</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.points}
                                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-neutral-800 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-brand-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">{t('assess.required')}</label>
                                <label className="flex items-center gap-3 px-5 py-3.5 bg-slate-50 dark:bg-neutral-800 rounded-2xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.required}
                                        onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                                        className="text-brand-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{t('assess.mustAnswer')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" loading={saving} className="flex-1">
                                {saving ? t('common.saving') : (question ? t('assess.updateQuestion') : t('assess.addQuestion'))}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Preview Modal Component
const PreviewModal: React.FC<{
    assessment: Assessment;
    questions: Question[];
    onClose: () => void;
}> = ({ assessment, questions, onClose }) => {
    const { t } = useLanguage();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const question = questions[currentQuestion];

    return (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-brand-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">{assessment.title}</h2>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition-all"
                        >
                            {t('assess.closePreview')}
                        </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-brand-200">
                        <span>{t('assess.questionOf', { current: currentQuestion + 1, total: questions.length })}</span>
                        <span>•</span>
                        <span>{assessment.durationMinutes} {t('assess.minutes')}</span>
                    </div>
                    <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white dark:bg-neutral-900 rounded-full transition-all"
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question */}
                <div className="p-8">
                    {question && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <Badge tone={
                                    question.questionType === 'multiple_choice' ? 'info' :
                                    question.questionType === 'essay' ? 'success' :
                                    question.questionType === 'code' ? 'brand' : 'neutral'
                                }>
                                    {question.questionType.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{question.points} {t('assess.points')}</span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{question.questionText}</h3>

                            {question.questionType === 'multiple_choice' && question.options && (
                                <div className="space-y-3">
                                    {question.options.filter(o => o).map((opt, i) => (
                                        <label
                                            key={i}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${answers[question.id] === opt
                                                ? 'border-brand-500 bg-brand-50'
                                                : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 hover:border-slate-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${question.id}`}
                                                checked={answers[question.id] === opt}
                                                onChange={() => setAnswers({ ...answers, [question.id]: opt })}
                                                className="text-brand-600"
                                            />
                                            <span className="font-medium text-slate-900 dark:text-white">{String.fromCharCode(65 + i)}. {opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {question.questionType === 'true_false' && (
                                <div className="flex gap-4">
                                    <label
                                        className={`flex-1 p-6 rounded-2xl border-2 cursor-pointer transition-all text-center ${answers[question.id] === 'true'
                                            ? 'border-brand-500 bg-brand-50'
                                            : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 hover:border-slate-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            checked={answers[question.id] === 'true'}
                                            onChange={() => setAnswers({ ...answers, [question.id]: 'true' })}
                                            className="hidden"
                                        />
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">{t('assess.true')}</span>
                                    </label>
                                    <label
                                        className={`flex-1 p-6 rounded-2xl border-2 cursor-pointer transition-all text-center ${answers[question.id] === 'false'
                                            ? 'border-brand-500 bg-brand-50'
                                            : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 hover:border-slate-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            checked={answers[question.id] === 'false'}
                                            onChange={() => setAnswers({ ...answers, [question.id]: 'false' })}
                                            className="hidden"
                                        />
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">{t('assess.false')}</span>
                                    </label>
                                </div>
                            )}

                            {question.questionType === 'essay' && (
                                <textarea
                                    value={answers[question.id] || ''}
                                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm font-medium focus:ring-2 ring-brand-500 min-h-[150px]"
                                    placeholder={t('assess.answerPlaceholder')}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Navigation */}
                <div className="p-6 border-t border-slate-200 dark:border-neutral-800 flex justify-between">
                    <Button
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        variant="secondary"
                    >
                        {t('common.previous')}
                    </Button>
                    <Button
                        onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                        disabled={currentQuestion === questions.length - 1}
                    >
                        {t('common.next')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AssessmentBuilder;
