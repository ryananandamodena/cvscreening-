import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle2, XCircle, Clock, AlertTriangle, Brain, Code, Globe, FileText,
    Trophy, Target, TrendingUp, Award, Loader2, ChevronDown, ChevronUp, Eye, FileSignature
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface Answer {
    id: number;
    questionId: number;
    questionText: string;
    questionType: string;
    userAnswer: string | null;
    correctAnswer: string | null;
    isCorrect: boolean | null;
    points: number;
    earnedPoints: number;
    aiEvaluation: {
        score: number;
        feedback: string;
        strengths: string[];
        improvements: string[];
    } | null;
}

interface AssessmentResult {
    id: number;
    assessmentId: number;
    assessmentTitle: string;
    assessmentType: string;
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    jobId: number;
    startTime: string | null;
    submittedAt: string | null;
    totalScore: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    passingScore: number;
    timeSpent: number;
    proctoringData: {
        tabSwitches: number;
        focusLosses: number;
    };
    answers: Answer[];
}

const AssessmentResults: React.FC = () => {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [result, setResult] = useState<AssessmentResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (attemptId) {
            fetchResults();
        }
    }, [attemptId]);

    const fetchResults = async () => {
        try {
            const data = await apiService.get(`/assessment-attempts/${attemptId}/result`) as any;
            // Map backend snake_case / different fields to frontend format
            const mapped: AssessmentResult = {
                id: data.id,
                assessmentId: data.assessmentId,
                assessmentTitle: data.assessmentTitle || 'Assessment',
                assessmentType: data.assessmentType || 'general',
                candidateId: data.candidateId,
                candidateName: data.candidateName || 'Candidate',
                candidateEmail: data.candidateEmail || '',
                jobId: data.jobId,
                startTime: data.startTime || null,
                submittedAt: data.submittedAt || null,
                totalScore: data.totalScore || 0,
                maxScore: data.maxScore || 0,
                percentage: data.percentage || 0,
                passed: data.passed || false,
                passingScore: data.passingScore || 70,
                timeSpent: data.timeSpent || 0,
                proctoringData: data.proctoringData || { tabSwitches: 0, focusLosses: 0 },
                answers: (data.answers || []).map((a: any) => ({
                    id: a.id,
                    questionId: a.questionId,
                    questionText: a.questionText || '',
                    questionType: a.questionType || 'text',
                    userAnswer: typeof a.userAnswer === 'string' ? a.userAnswer : JSON.stringify(a.userAnswer),
                    correctAnswer: typeof a.correctAnswer === 'string' ? a.correctAnswer : (a.correctAnswer ? JSON.stringify(a.correctAnswer) : null),
                    isCorrect: a.isCorrect !== undefined ? a.isCorrect : null,
                    points: a.points || 1,
                    earnedPoints: a.earnedPoints || 0,
                    aiEvaluation: a.aiEvaluation ? (typeof a.aiEvaluation === 'string' ? JSON.parse(a.aiEvaluation) : a.aiEvaluation) : null,
                })),
            };
            setResult(mapped);
        } catch (err) {
            console.error('Failed to fetch results:', err);
        } finally {
            setLoading(false);
        }
    };


    const toggleQuestion = (questionId: number) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'psychotest': return <Brain className="text-purple-500" size={24} />;
            case 'coding': return <Code className="text-blue-500" size={24} />;
            case 'language': return <Globe className="text-green-500" size={24} />;
            default: return <FileText className="text-slate-700 dark:text-slate-300" size={24} />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="text-brand-600 animate-spin" />
                <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('results.loading')}</p>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-4">
                <AlertTriangle size={48} className="text-red-600 dark:text-red-400" />
                <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs">{t('results.notFound')}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-neutral-800 py-8">
            <div className="mx-auto px-6 space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                    {/* Result Banner */}
                    <div className={`p-8 text-center ${result.passed ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            {result.passed ? (
                                <Trophy size={40} className="text-white" />
                            ) : (
                                <XCircle size={40} className="text-white" />
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">
                            {result.passed ? t('results.congrats') : t('results.keepPracticing')}
                        </h1>
                        <p className="text-white/80">
                            {result.passed
                                ? t('results.passedMsg', { title: result.assessmentTitle })
                                : t('results.failedMsg', { title: result.assessmentTitle })
                            }
                        </p>
                    </div>

                    {/* Score Summary */}
                    <div className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto relative">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="#e2e8f0"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke={result.passed ? '#10b981' : '#ef4444'}
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${result.percentage * 2.51} 251`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{result.percentage}%</span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{t('common.score')}</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <Target className="text-brand-600" size={28} />
                                </div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{result.totalScore}/{result.maxScore}</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{t('assess.points')}</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <Clock className="text-purple-600" size={28} />
                                </div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{result.timeSpent} min</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{t('results.timeSpent')}</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <Award className="text-amber-600" size={28} />
                                </div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{result.passingScore}%</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{t('assess.passingScore')}</p>
                            </div>
                        </div>

                        {/* Proctoring Warning */}
                        {result.proctoringData.tabSwitches > 0 && (
                            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="text-amber-600" size={20} />
                                    <div>
                                        <p className="font-bold text-amber-800">{t('results.proctoringNotice')}</p>
                                        <p className="text-sm text-amber-700">
                                            {result.proctoringData.tabSwitches} {t('results.tabSwitches')} {result.proctoringData.focusLosses} {t('results.focusLosses')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Assessment Info */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6">
                    <div className="flex items-center gap-4">
                        {getTypeIcon(result.assessmentType)}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{result.assessmentTitle}</h2>
                            <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{result.assessmentType} {t('results.assessment')}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-neutral-800 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-700 dark:text-slate-300">{t('results.candidate')}:</span>
                            <span className="ml-2 font-medium text-slate-900 dark:text-white">{result.candidateName}</span>
                        </div>
                        <div>
                            <span className="text-slate-700 dark:text-slate-300">{t('common.email')}:</span>
                            <span className="ml-2 font-medium text-slate-900 dark:text-white">{result.candidateEmail}</span>
                        </div>
                        <div>
                            <span className="text-slate-700 dark:text-slate-300">{t('results.started')}:</span>
                            <span className="ml-2 font-medium text-slate-900 dark:text-white">
                                {new Date(result.startTime).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-700 dark:text-slate-300">{t('results.submitted')}:</span>
                            <span className="ml-2 font-medium text-slate-900 dark:text-white">
                                {new Date(result.submittedAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Question Results */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('results.questionReview')}</h3>

                    {result.answers.map((answer, index) => (
                        <div
                            key={answer.id}
                            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
                        >
                            {/* Question Header */}
                            <button
                                onClick={() => toggleQuestion(answer.questionId)}
                                className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${answer.isCorrect === true
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : answer.isCorrect === false
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-brand-50 text-brand-600'
                                    }`}>
                                    {answer.isCorrect === true ? (
                                        <CheckCircle2 size={20} />
                                    ) : answer.isCorrect === false ? (
                                        <XCircle size={20} />
                                    ) : (
                                        <TrendingUp size={20} />
                                    )}
                                </div>

                                <div className="flex-1 text-left">
                                    <p className="font-medium text-slate-900 dark:text-white line-clamp-1">
                                        Q{index + 1}: {answer.questionText}
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        {answer.questionType.replace('_', ' ')} • {answer.earnedPoints}/{answer.points} {t('assess.points')}
                                    </p>
                                </div>

                                {expandedQuestions.has(answer.questionId) ? (
                                    <ChevronUp size={20} className="text-slate-600 dark:text-slate-400" />
                                ) : (
                                    <ChevronDown size={20} className="text-slate-600 dark:text-slate-400" />
                                )}
                            </button>

                            {/* Expanded Content */}
                            {expandedQuestions.has(answer.questionId) && (
                                <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-neutral-800">
                                    <div className="space-y-4 pt-4">
                                        {/* Question */}
                                        <div>
                                            <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">{t('assess.questions')}</p>
                                            <p className="text-slate-900 dark:text-white">{answer.questionText}</p>
                                        </div>

                                        {/* User Answer */}
                                        <div>
                                            <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">{t('results.yourAnswer')}</p>
                                            <div className={`p-4 rounded-xl ${answer.isCorrect === true
                                                ? 'bg-emerald-50 border border-emerald-200'
                                                : answer.isCorrect === false
                                                    ? 'bg-red-50 border border-red-200'
                                                    : 'bg-brand-50 border border-brand-200'
                                                }`}>
                                                {answer.questionType === 'code' ? (
                                                    <pre className="font-mono text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{answer.userAnswer}</pre>
                                                ) : (
                                                    <p className="text-slate-900 dark:text-white">{answer.userAnswer}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Correct Answer (if applicable) */}
                                        {answer.correctAnswer && answer.isCorrect === false && (
                                            <div>
                                                <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">{t('assess.correctAnswer')}</p>
                                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                    <p className="text-emerald-800">{answer.correctAnswer}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Evaluation */}
                                        {answer.aiEvaluation && (
                                            <div className="space-y-3">
                                                <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('results.aiEval')}</p>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-brand-600 rounded-full"
                                                            style={{ width: `${answer.aiEvaluation.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{answer.aiEvaluation.score}%</span>
                                                </div>

                                                <p className="text-sm text-slate-600">{answer.aiEvaluation.feedback}</p>

                                                {answer.aiEvaluation.strengths.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-600 mb-2">{t('results.strengths')}</p>
                                                        <ul className="space-y-1">
                                                            {answer.aiEvaluation.strengths.map((s, i) => (
                                                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                                    {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {answer.aiEvaluation.improvements.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-600 mb-2">{t('results.areasImprovement')}</p>
                                                        <ul className="space-y-1">
                                                            {answer.aiEvaluation.improvements.map((imp, i) => (
                                                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                                    <TrendingUp size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                                    {imp}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 pt-4">
                    <Button
                        onClick={() => navigate('/candidate/dashboard')}
                        variant="secondary"
                        size="lg"
                    >
                        {t('results.backToDashboard')}
                    </Button>
                    {result.passed && (
                        <Button
                            onClick={() => navigate(`/offers?create=true&candidateId=${result.candidateId}&jobId=${result.jobId}`)}
                            size="lg"
                            icon={<FileSignature size={20} />}
                            className="bg-success-600 hover:bg-success-700 shadow-success-600/20"
                        >
                            {t('results.draftOffer')}
                        </Button>
                    )}
                    <Button
                        onClick={() => window.print()}
                        size="lg"
                    >
                        {t('results.printResults')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AssessmentResults;
