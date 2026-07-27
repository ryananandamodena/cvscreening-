import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Star, ThumbsUp, ThumbsDown, Minus, Save, Send, ChevronLeft,
    CheckCircle2, AlertCircle, User, Briefcase, Clock, Plus, X,
    Lightbulb, AlertTriangle, FileText, Loader2, Info
} from 'lucide-react';
import { interviewService, InterviewScorecard as InterviewScorecardType, ScorecardCriteria } from '../services/interview.service';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const InterviewScorecard: React.FC = () => {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Scorecard state
    const [showGuide, setShowGuide] = useState(false);
    const [criteria, setCriteria] = useState<ScorecardCriteria[]>([]);
    const [overallRating, setOverallRating] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [recommendation, setRecommendation] = useState<'strong-hire' | 'hire' | 'no-hire' | 'strong-no-hire'>('hire');
    const [strengths, setStrengths] = useState<string[]>([]);
    const [weaknesses, setWeaknesses] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [newStrength, setNewStrength] = useState('');
    const [newWeakness, setNewWeakness] = useState('');

    // Candidate info (loaded from backend)
    const [candidateInfo, setCandidateInfo] = useState({
        name: '',
        position: '',
        interviewDate: '',
        interviewer: '',
        candidateId: '',
        jobId: '',
    });

    useEffect(() => {
        loadScorecard();
    }, [interviewId]);

    const loadScorecard = async () => {
        setLoading(true);
        try {
            // Load candidate info from interview schedule
            if (interviewId && interviewId !== ":id") {
                try {
                    const scheduleData = await apiService.get(`/interview-schedules/${interviewId}`) as any;
                    setCandidateInfo({
                        name: scheduleData.candidateName || 'Candidate',
                        position: scheduleData.jobTitle || '',
                        interviewDate: scheduleData.scheduledAt
                            ? new Date(scheduleData.scheduledAt).toLocaleDateString()
                            : new Date().toLocaleDateString(),
                        interviewer: scheduleData.recruiterName || '',
                        candidateId: scheduleData.candidateId || '',
                        jobId: scheduleData.jobId || '',
                    });
                } catch {
                    // Keep defaults if schedule not found
                    setCandidateInfo(c => ({ ...c, interviewDate: new Date().toLocaleDateString() }));
                }
            } else {
                setLoading(false);
                return;
            }

            const existingScorecard = await interviewService.getScorecard(interviewId || '');

            if (existingScorecard) {
                setCriteria(existingScorecard.criteria.map(c => ({
                    ...c,
                    name: c.name.startsWith('interviewScorecard.criteria.') ? t(c.name) : c.name
                })));
                setOverallRating(existingScorecard.overallRating);
                setRecommendation(existingScorecard.recommendation);
                setStrengths(existingScorecard.strengths);
                setWeaknesses(existingScorecard.weaknesses);
                setNotes(existingScorecard.notes);
                setSubmitted(!!existingScorecard.submittedAt);
            } else {
                // Load default template and translate
                const template = interviewService.getDefaultScorecardTemplate();
                setCriteria(template.map(c => ({
                    ...c,
                    name: t(c.name)
                })));
            }
        } catch (error) {
            addToast('error', t('common.error'));
        } finally {
            setLoading(false);
        }
    };


    const handleCriteriaRating = (criteriaId: string, rating: 1 | 2 | 3 | 4 | 5) => {
        setCriteria(criteria.map(c =>
            c.id === criteriaId ? { ...c, rating } : c
        ));
    };

    const handleCriteriaComment = (criteriaId: string, comment: string) => {
        setCriteria(criteria.map(c =>
            c.id === criteriaId ? { ...c, comment } : c
        ));
    };

    const addStrength = () => {
        if (newStrength.trim()) {
            setStrengths([...strengths, newStrength.trim()]);
            setNewStrength('');
        }
    };

    const removeStrength = (index: number) => {
        setStrengths(strengths.filter((_, i) => i !== index));
    };

    const addWeakness = () => {
        if (newWeakness.trim()) {
            setWeaknesses([...weaknesses, newWeakness.trim()]);
            setNewWeakness('');
        }
    };

    const removeWeakness = (index: number) => {
        setWeaknesses(weaknesses.filter((_, i) => i !== index));
    };

    const calculateWeightedScore = () => {
        const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
        const weightedSum = criteria.reduce((sum, c) => sum + (c.rating * c.weight), 0);
        return Math.round((weightedSum / totalWeight) * 20); // Convert to 100 scale
    };

    const handleSave = async (submit: boolean = false) => {
        if (!interviewId || interviewId === ":id") {
            addToast('error', t('common.error'));
            return;
        }
        setSaving(true);
        try {
            await interviewService.submitScorecard({
                interviewId: interviewId || '',
                candidateId: String(candidateInfo.candidateId),
                evaluatorId: '',
                evaluatorName: candidateInfo.interviewer,
                overallRating,
                recommendation,
                criteria,
                strengths,
                weaknesses,
                notes,
                submittedAt: submit ? new Date().toISOString() : undefined,
            });

            if (submit) {
                setSubmitted(true);
                addToast('success', t('common.success'));
            } else {
                addToast('success', t('common.success'));
            }
        } catch (error) {
            addToast('error', t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-emerald-500';
        if (rating >= 3) return 'text-amber-500';
        return 'text-danger-500';
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'strong-hire': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'hire': return 'bg-green-100 text-green-700 border-green-200';
            case 'no-hire': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'strong-no-hire': return 'bg-danger-100 dark:bg-danger-500/20 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={48} className="text-brand-600 animate-spin" />
                <p className="font-bold text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto py-8 space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <ChevronLeft size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('interviewScorecard.title')}</h1>
                        <p className="text-slate-700 dark:text-slate-300 mt-1">{t('interviewScorecard.subtitle')}</p>
                    </div>
                </div>
                {submitted && (
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        {t('screening.complete')}
                    </span>
                )}
            </div>

            {/* Candidate Info */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
                        <User size={32} className="text-brand-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{candidateInfo.name}</h2>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1">
                                <Briefcase size={14} />
                                {candidateInfo.position}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {candidateInfo.interviewDate}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('userMgmt.role')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">{candidateInfo.interviewer}</p>
                    </div>
                </div>
            </div>

            {/* Overall Score Summary */}
            <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl border border-brand-100 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('common.score')} {t('common.weighted')}</h3>
                            <button
                                onClick={() => setShowGuide(true)}
                                className="p-1 hover:bg-brand-100 rounded-full text-brand-600 dark:text-brand-400 transition-colors"
                                title={t('results.scoringGuide')}
                            >
                                <Info size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{t('results.howItCalculated')}</p>
                    </div>
                    <div className="text-right">
                        <span className={`text-5xl font-black ${getRatingColor(calculateWeightedScore() / 20)}`}>
                            {calculateWeightedScore()}
                        </span>
                        <span className="text-2xl text-slate-600 dark:text-slate-400">/100</span>
                    </div>
                </div>
            </div>

            {/* Criteria Evaluation */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-neutral-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('interviewScorecard.evaluation')}</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{t('interviewScorecard.rateInstructions')}</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {criteria.map((criterion) => (
                        <div key={criterion.id} className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-slate-900 dark:text-white">{criterion.name}</h4>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:text-slate-400 rounded text-xs font-medium">
                                            {criterion.weight}% {t('interviewScorecard.weight')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{criterion.description}</p>
                                </div>
                            </div>

                            {/* Star Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        disabled={submitted}
                                        onClick={() => handleCriteriaRating(criterion.id, star as any)}
                                        className={`p-1 transition-all ${submitted ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                                    >
                                        <Star
                                            size={28}
                                            className={`${criterion.rating >= star ? 'fill-yellow-400 text-yellow-600 dark:text-yellow-400' : 'text-slate-700 dark:text-slate-300'}`}
                                        />
                                    </button>
                                ))}
                                <span className={`ml-2 text-sm font-bold ${getRatingColor(criterion.rating)}`}>
                                    {criterion.rating}/5
                                </span>
                            </div>

                            {/* Comment */}
                            <textarea
                                value={criterion.comment || ''}
                                onChange={(e) => handleCriteriaComment(criterion.id, e.target.value)}
                                disabled={submitted}
                                placeholder={t('interviewScorecard.commentPlaceholder')}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Overall Rating */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('interviewScorecard.overall')}</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                disabled={submitted}
                                onClick={() => setOverallRating(star as any)}
                                className={`p-1 transition-all ${submitted ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                            >
                                <Star
                                    size={32}
                                    className={`${overallRating >= star ? 'fill-brand-500 text-brand-500' : 'text-slate-700 dark:text-slate-300'}`}
                                />
                            </button>
                        ))}
                    </div>
                    <span className={`text-lg font-bold ${getRatingColor(overallRating)}`}>
                        {overallRating}/5
                    </span>
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('interviewScorecard.recommendation')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { value: 'strong-hire', label: t('interviewScorecard.strongHire'), icon: ThumbsUp, color: 'emerald' },
                        { value: 'hire', label: t('interviewScorecard.hire'), icon: CheckCircle2, color: 'green' },
                        { value: 'no-hire', label: t('interviewScorecard.noHire'), icon: Minus, color: 'amber' },
                        { value: 'strong-no-hire', label: t('interviewScorecard.strongNoHire'), icon: ThumbsDown, color: 'red' },
                    ].map((rec) => (
                        <button
                            key={rec.value}
                            disabled={submitted}
                            onClick={() => setRecommendation(rec.value as any)}
                            className={`p-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${recommendation === rec.value
                                ? getRecommendationColor(rec.value)
                                : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                } ${submitted ? 'cursor-default' : ''}`}
                        >
                            <rec.icon size={24} />
                            {rec.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb size={20} className="text-emerald-500" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('interviewScorecard.strengths')}</h3>
                    </div>
                    <div className="space-y-2 mb-4">
                        {strengths.map((strength, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                <span className="text-sm text-emerald-700">{strength}</span>
                                {!submitted && (
                                    <button onClick={() => removeStrength(index)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-600">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!submitted && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStrength}
                                onChange={(e) => setNewStrength(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addStrength()}
                                placeholder={t('interviewScorecard.strengths')}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            />
                            <button
                                onClick={addStrength}
                                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-all"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Weaknesses */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-amber-500" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('interviewScorecard.weaknesses')}</h3>
                    </div>
                    <div className="space-y-2 mb-4">
                        {weaknesses.map((weakness, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                <span className="text-sm text-amber-700">{weakness}</span>
                                {!submitted && (
                                    <button onClick={() => removeWeakness(index)} className="text-amber-600 dark:text-amber-400 hover:text-amber-600">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!submitted && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newWeakness}
                                onChange={(e) => setNewWeakness(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addWeakness()}
                                placeholder={t('interviewScorecard.weaknesses')}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                            />
                            <button
                                onClick={addWeakness}
                                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-all"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FileText size={20} className="text-brand-500" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('interviewScorecard.additionalNotes')}</h3>
                </div>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitted}
                    placeholder={t('interviewScorecard.notesPlaceholder')}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    rows={4}
                />
            </div>

            {/* Actions */}
            {!submitted ? (
                <div className="flex items-center justify-end gap-4">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="px-6 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {t('interviewScorecard.saveDraft')}
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {t('interviewScorecard.submit')}
                    </button>
                </div>
            ) : (recommendation === 'hire' || recommendation === 'strong-hire') && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-5">
                        <div className="size-16 bg-white dark:bg-neutral-900 text-emerald-600 rounded-[20px] flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('interviewScorecard.excellentCandidate')}</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1">{t('interviewScorecard.readyForOffer')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/offers?create=true&candidateId=${candidateInfo.candidateId}&jobId=${candidateInfo.jobId}`)}
                        className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} /> {t('interviewScorecard.createOffer')}
                    </button>
                </div>
            )}

            {/* Scoring Guide Modal */}
            {showGuide && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('results.scoringGuideTitle')}</h2>
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    <X size={24} className="text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Formula Section */}
                                <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl">
                                    <h3 className="font-bold text-brand-900 mb-2">{t('results.howItCalculated')}</h3>
                                    <code className="text-sm text-brand-700 bg-white dark:bg-neutral-900 px-3 py-1 rounded-lg block font-mono">
                                        {t('results.formula')}
                                    </code>
                                </div>

                                {/* STAR Method */}
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                        <Star size={18} className="text-amber-500 fill-amber-500" />
                                        {t('results.starMethod')}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                        {t('results.starDescription')}
                                    </p>
                                </div>

                                {/* Rubric Section */}
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-neutral-800 pb-2 mb-4">
                                        {t('results.rubricTitle')}
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { key: 'results.rubric5', color: 'text-emerald-600 bg-emerald-50' },
                                            { key: 'results.rubric3', color: 'text-amber-600 bg-amber-50' },
                                            { key: 'results.rubric1', color: 'text-danger-600 dark:text-danger-500 bg-danger-50 dark:bg-danger-500/10' }
                                        ].map((item) => (
                                            <div key={item.key} className={`p-4 rounded-xl text-sm leading-relaxed ${item.color}`}>
                                                {t(item.key)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800">
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-all"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewScorecard;
