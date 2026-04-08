import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Send,
    Loader2, Eye, EyeOff, AlertCircle, FileText, Code, Brain
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';

interface Question {
    id: number;
    questionText: string;
    questionType: string;
    options: string[] | null;
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
}

interface ProctoringData {
    tabSwitches: number;
    focusLosses: number;
    lastTimestamp: Date;
}

const TakeAssessment: React.FC = () => {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [proctoringData, setProctoringData] = useState<ProctoringData>({
        tabSwitches: 0,
        focusLosses: 0,
        lastTimestamp: new Date()
    });
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    // Timer effect
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining > 0]);

    // Proctoring - detect tab switches and focus loss
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setProctoringData(prev => ({
                    ...prev,
                    tabSwitches: prev.tabSwitches + 1,
                    lastTimestamp: new Date()
                }));
                setWarningMessage(t('take.tabSwitchWarning'));
                setShowWarning(true);
                setTimeout(() => setShowWarning(false), 3000);
            }
        };

        const handleBlur = () => {
            setProctoringData(prev => ({
                ...prev,
                focusLosses: prev.focusLosses + 1,
                lastTimestamp: new Date()
            }));
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Prevent right-click and keyboard shortcuts
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'p')) {
                e.preventDefault();
            }
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (attemptId) {
            fetchAssessmentData();
        }
    }, [attemptId]);

    const fetchAssessmentData = async () => {
        try {
            // Fetch attempt data (includes assessment info)
            const attempt = await apiService.get<any>(`/assessment-attempts/${attemptId}`);
            const attemptData = attempt?.data || attempt;

            // Set assessment info from attempt
            setAssessment({
                id: attemptData.assessmentId,
                title: attemptData.assessmentTitle || 'Assessment',
                description: attemptData.assessmentDescription || '',
                assessmentType: attemptData.assessmentType || 'general',
                durationMinutes: attemptData.durationMinutes || 60,
                passingScore: attemptData.passingScore || 70
            });

            // Fetch questions for this assessment
            const questionsRes = await apiService.get<any>(`/assessments/${attemptData.assessmentId}/questions`);
            const rawQuestions = questionsRes?.data || questionsRes || [];
            const mappedQuestions: Question[] = rawQuestions.map((q: any, idx: number) => ({
                id: q.id,
                questionText: q.questionText,
                questionType: q.questionType,
                options: q.options || null,
                points: q.points || 1,
                order: q.order || idx + 1,
                required: q.required !== false
            }));

            setQuestions(mappedQuestions);
            setTimeRemaining((attemptData.durationMinutes || 60) * 60);

            // Load previously saved answers if any
            try {
                const savedAnswers = await apiService.get<any>(`/assessment-attempts/${attemptId}/answers`);
                const answerData = savedAnswers?.data || savedAnswers || [];
                const answerMap: Record<number, string> = {};
                answerData.forEach((a: any) => {
                    answerMap[a.questionId] = a.textAnswer || a.codeAnswer || String(a.selectedOption || '');
                });
                setAnswers(answerMap);
            } catch {
                // No saved answers yet, that's ok
            }
        } catch (err) {
            console.error('Failed to fetch assessment:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit && !showConfirmSubmit) {
            setShowConfirmSubmit(true);
            return;
        }

        setSubmitting(true);
        try {
            // Save all answers to backend
            for (const [questionId, answer] of Object.entries(answers)) {
                if (!answer || !answer.trim()) continue;
                const question = questions.find(q => q.id === parseInt(questionId));
                const payload: any = { questionId: parseInt(questionId) };

                if (question?.questionType === 'multiple_choice') {
                    // Find option index
                    const optIdx = question.options?.indexOf(answer) ?? -1;
                    payload.selectedOption = optIdx >= 0 ? optIdx : 0;
                    payload.textAnswer = answer;
                } else if (question?.questionType === 'code') {
                    payload.codeAnswer = answer;
                } else {
                    payload.textAnswer = answer;
                }

                await apiService.post(`/assessment-attempts/${attemptId}/answer`, payload);
            }

            // Submit the whole attempt for scoring
            await apiService.post(`/assessment-attempts/${attemptId}/submit`, {
                proctoringData,
                autoSubmitted: autoSubmit
            });

            // Navigate to results
            navigate(`/assessment-results/${attemptId}`);
        } catch (err) {
            console.error('Failed to submit assessment:', err);
            alert(t('take.submitFailed'));
        } finally {
            setSubmitting(false);
            setShowConfirmSubmit(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getAnsweredCount = () => {
        return Object.values(answers).filter(a => a && a.trim()).length;
    };

    const question = questions[currentQuestion];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="text-indigo-600 animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('assess.loading')}</p>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
                <AlertCircle size={48} className="text-red-400" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('assess.notFound')}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Warning Toast */}
            {showWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
                    <div className="bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
                        <AlertTriangle size={20} />
                        <span className="font-medium">{warningMessage}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {assessment.assessmentType === 'psychotest' && <Brain className="text-purple-500" size={24} />}
                            {assessment.assessmentType === 'coding' && <Code className="text-blue-500" size={24} />}
                            {assessment.assessmentType === 'language' && <FileText className="text-green-500" size={24} />}
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">{assessment.title}</h1>
                                <p className="text-sm text-slate-500">{t('assess.questionOf', { current: currentQuestion + 1, total: questions.length })}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('take.answered')}</p>
                                <p className="text-lg font-bold text-slate-900">{getAnsweredCount()}/{questions.length}</p>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeRemaining < 300 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                                }`}>
                                <Clock size={18} />
                                <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Question Navigation Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-28">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">{t('assess.questions')}</h3>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, idx) => (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestion(idx)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${idx === currentQuestion
                                            ? 'bg-indigo-600 text-white'
                                            : answers[q.id]
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-4 h-4 bg-indigo-600 rounded" />
                                    <span>{t('take.current')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded" />
                                    <span>{t('take.answered')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded" />
                                    <span>{t('take.notAnswered')}</span>
                                </div>
                            </div>

                            {proctoringData.tabSwitches > 0 && (
                                <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
                                    <div className="flex items-center gap-2 text-red-600 text-xs">
                                        <AlertTriangle size={14} />
                                        <span className="font-medium">{t('take.tabSwitchCount')}: {proctoringData.tabSwitches}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="lg:col-span-3">
                        {question && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Question Header */}
                                <div className="p-6 border-b border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${question.questionType === 'multiple_choice' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                question.questionType === 'essay' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    question.questionType === 'code' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        question.questionType === 'true_false' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                            'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                {question.questionType.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="text-sm text-slate-500">{question.points} {t('take.pointS')}</span>
                                        </div>
                                        {question.required && (
                                            <span className="text-xs font-bold text-red-500">* {t('assess.required')}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Question Body */}
                                <div className="p-8">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6">{question.questionText}</h2>

                                    {/* Multiple Choice */}
                                    {question.questionType === 'multiple_choice' && question.options && (
                                        <div className="space-y-3">
                                            {question.options.map((opt, i) => (
                                                <label
                                                    key={i}
                                                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${answers[question.id] === opt
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        checked={answers[question.id] === opt}
                                                        onChange={() => handleAnswerChange(question.id, opt)}
                                                        className="text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="font-medium text-slate-900">
                                                        {String.fromCharCode(65 + i)}. {opt}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* True/False */}
                                    {question.questionType === 'true_false' && (
                                        <div className="flex gap-4">
                                            <label
                                                className={`flex-1 p-6 rounded-2xl border-2 cursor-pointer transition-all text-center ${answers[question.id] === 'true'
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question.id}`}
                                                    checked={answers[question.id] === 'true'}
                                                    onChange={() => handleAnswerChange(question.id, 'true')}
                                                    className="hidden"
                                                />
                                                <CheckCircle2 size={32} className={`mx-auto mb-2 ${answers[question.id] === 'true' ? 'text-indigo-600' : 'text-slate-300'}`} />
                                                <span className="text-lg font-bold text-slate-900">True</span>
                                            </label>
                                            <label
                                                className={`flex-1 p-6 rounded-2xl border-2 cursor-pointer transition-all text-center ${answers[question.id] === 'false'
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question.id}`}
                                                    checked={answers[question.id] === 'false'}
                                                    onChange={() => handleAnswerChange(question.id, 'false')}
                                                    className="hidden"
                                                />
                                                <AlertCircle size={32} className={`mx-auto mb-2 ${answers[question.id] === 'false' ? 'text-indigo-600' : 'text-slate-300'}`} />
                                                <span className="text-lg font-bold text-slate-900">False</span>
                                            </label>
                                        </div>
                                    )}

                                    {/* Essay */}
                                    {question.questionType === 'essay' && (
                                        <textarea
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 min-h-[200px]"
                                            placeholder={t('assess.answerPlaceholder')}
                                        />
                                    )}

                                    {/* Code */}
                                    {question.questionType === 'code' && (
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 text-xs font-mono text-slate-400">
                                                javascript
                                            </div>
                                            <textarea
                                                value={answers[question.id] || ''}
                                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                className="w-full px-5 py-8 bg-slate-900 text-green-400 font-mono text-sm rounded-2xl min-h-[250px] focus:ring-2 ring-indigo-500"
                                                placeholder={t('take.codePlaceholder')}
                                                spellCheck={false}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="p-6 border-t border-slate-200 flex justify-between">
                                    <button
                                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                        disabled={currentQuestion === 0}
                                        className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        <ChevronLeft size={18} /> {t('common.previous')}
                                    </button>

                                    {currentQuestion === questions.length - 1 ? (
                                        <button
                                            onClick={() => handleSubmit()}
                                            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg flex items-center gap-2 transition-all"
                                        >
                                            <Send size={18} /> {t('take.submitAssessment')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg flex items-center gap-2 transition-all"
                                        >
                                            {t('common.next')} <ChevronRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Submit Modal */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Send size={32} className="text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">{t('take.submitConfirm')}</h2>
                            <p className="text-slate-500 mb-6">
                                {t('take.answeredOf', { answered: getAnsweredCount(), total: questions.length })}
                                {getAnsweredCount() < questions.length && (
                                    <span className="block text-orange-500 mt-2">
                                        {t('take.unansweredWarning', { count: questions.length - getAnsweredCount() })}
                                    </span>
                                )}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowConfirmSubmit(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    {t('take.continueEditing')}
                                </button>
                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg transition-all disabled:opacity-50"
                                >
                                    {submitting ? t('take.submitting') : t('take.confirmSubmit')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeAssessment;
