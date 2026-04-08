
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Briefcase,
    FileText, Video, BrainCircuit, Star, CheckCircle2, AlertCircle,
    Save, Loader2, MessageSquare, ThumbsUp, ThumbsDown, Minus
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';

// Star Rating Component
const StarRating = ({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    className={`transition-all duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                >
                    <Star
                        size={28}
                        className={`transition-colors ${(hover || value) >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-600'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};

// Recommendation Badge
const RecommendationBadge = ({ value, selected, onClick, icon: Icon, color }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border
            ${selected
                ? `${color} scale-105 shadow-lg`
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
            }`}
    >
        <Icon size={16} /> {value}
    </button>
);

const InterviewResults = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [interview, setInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Feedback form state
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackNotes, setFeedbackNotes] = useState("");
    const [feedbackRecommendation, setFeedbackRecommendation] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [hasSavedFeedback, setHasSavedFeedback] = useState(false);

    // Assessment Assignment state
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
    const [isSendingAssessment, setIsSendingAssessment] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id) return;
                const data = await apiService.getInterview(id);
                setInterview(data);

                // Pre-fill feedback if already saved
                if (data.rating && data.rating > 0) {
                    setFeedbackRating(Math.ceil(data.rating / 20)); // Convert 0-100 to 1-5
                    setHasSavedFeedback(true);
                }
                if (data.notes) {
                    // Try to parse recommendation from notes
                    const match = data.notes.match(/\[Recommendation: (.*?)\]/);
                    if (match) {
                        setFeedbackRecommendation(match[1]);
                        setFeedbackNotes(data.notes.replace(/\[Recommendation: .*?\]\n?/, '').trim());
                    } else {
                        setFeedbackNotes(data.notes);
                    }
                    setHasSavedFeedback(true);
                }
            } catch (err: any) {
                console.error("Failed to load results:", err);
                setError(err.message || "Failed to load interview results");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSaveFeedback = async () => {
        if (!id || feedbackRating === 0) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const ratingScore = feedbackRating * 20; // Convert 1-5 to 0-100
            const notesWithRecommendation = feedbackRecommendation
                ? `[Recommendation: ${feedbackRecommendation}]\n${feedbackNotes}`
                : feedbackNotes;

            await apiService.updateInterviewFeedback(id, ratingScore, notesWithRecommendation);
            setSaveSuccess(true);
            setHasSavedFeedback(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save feedback:", err);
            alert("Gagal menyimpan feedback. Silakan coba lagi.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !interview) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md text-center">
                    <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
                    <p className="text-slate-400 mb-6">{error || "Interview not found"}</p>
                    <button
                        onClick={() => navigate('/interviews')}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        Back to Interviews
                    </button>
                </div>
            </div>
        );
    }

    // Helper to format transcript
    const formatTranscript = (text: string) => {
        if (!text) return <p className="text-slate-500 italic">No transcript available.</p>;
        return text.split('\n\n---\n\n').map((block, i) => {
            const [q, a] = block.split('\n\nA: ');
            return (
                <div key={i} className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                    <h4 className="text-indigo-300 font-semibold mb-2">{q?.replace('Q: ', '') || 'Question'}</h4>
                    <p className="text-slate-300 leading-relaxed">{a || block}</p>
                </div>
            );
        });
    };

    // Helper for AI Evaluation parsing
    let aiFeedback = null;
    let aiScore = 0;
    try {
        if (interview.aiEvaluation) {
            const parsed = JSON.parse(interview.aiEvaluation);
            aiFeedback = parsed.feedback;
            aiScore = parsed.score;
        }
    } catch (e) {
        aiFeedback = interview.aiEvaluation;
    }


    const handleOpenAssessmentModal = async () => {
        setIsAssessmentModalOpen(true);
        try {
            const res = await apiService.getAssessments();
            // Filter only active assessments
            setAssessments(res.filter((a: any) => a.status === 'active'));
        } catch (err) {
            console.error("Failed to fetch assessments:", err);
            alert("Gagal memuat daftar assessment");
        }
    };

    const handleSendAssessment = async () => {
        if (!selectedAssessmentId || !interview) return;
        setIsSendingAssessment(true);
        try {
            await apiService.assignAssessment(selectedAssessmentId, interview.candidateId, interview.jobId);
            alert("Assessment berhasil dikirim ke kandidat! 📧");
            setIsAssessmentModalOpen(false);
        } catch (err) {
            console.error("Failed to send assessment:", err);
            alert("Gagal mengirim assessment");
        } finally {
            setIsSendingAssessment(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="mx-auto">
                <button
                    onClick={() => navigate('/interviews')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} /> {t('common.back')}
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                            {interview.candidateName} <span className="text-slate-600">/</span> {interview.jobTitle}
                        </h1>
                        <div className="flex gap-4 text-slate-400 text-sm">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(interview.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><Briefcase size={14} /> {interview.interviewType}</span>
                            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase
                                ${interview.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}
                            `}>
                                {interview.status}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleOpenAssessmentModal}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                            <FileText size={18} /> Send Assessment
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    {/* Score Cards */}
                    <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <BrainCircuit size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">{t('results.aiScore')}</div>
                            <div className="text-3xl font-black text-white">{aiScore || 0}<span className="text-lg text-indigo-400/50">/100</span></div>
                        </div>
                    </div>
                    {hasSavedFeedback && (
                        <div className="bg-amber-600/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <Star size={24} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">{t('results.humanScore')}</div>
                                <div className="text-3xl font-black text-white">{interview.rating || feedbackRating * 20}<span className="text-lg text-amber-400/50">/100</span></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ... (Rest of the layout unchanged) */}
                    <div className="space-y-8">
                        {/* Video Player ... */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center gap-2 font-bold text-slate-300">
                                <Video size={18} className="text-rose-400" /> {t('results.recording')}
                            </div>
                            <div className="aspect-video bg-black flex items-center justify-center">
                                {interview.recordingPath ? (
                                    <video
                                        src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8081'}/${interview.recordingPath}`}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-slate-600 flex flex-col items-center">
                                        <Video size={48} className="mb-2 opacity-50" />
                                        <span>No Recording Available</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Feedback */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="flex items-center gap-2 font-bold text-slate-300 mb-4">
                                <BrainCircuit size={18} className="text-indigo-400" /> {t('results.aiEvaluation')}
                            </h3>
                            <div className="prose prose-invert prose-sm text-slate-300">
                                {aiFeedback ? (
                                    typeof aiFeedback === 'string' ? aiFeedback : JSON.stringify(aiFeedback, null, 2)
                                ) : (
                                    <p className="italic text-slate-500">No evaluation generated yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Human Feedback Form ... */}
                        <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
                            <h3 className="flex items-center gap-2 font-bold text-white mb-6">
                                <MessageSquare size={18} className="text-amber-400" /> {t('results.feedback')}
                            </h3>
                            {/* ... (Form Content - keeping same structure) */}
                            <div className="mb-6">
                                <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{t('results.rating')}</label>
                                <StarRating value={feedbackRating} onChange={setFeedbackRating} />
                                <p className="text-xs text-slate-500 mt-1">
                                    {feedbackRating > 0 ? `${feedbackRating}/5 → ${t('common.score')}: ${feedbackRating * 20}/100` : t('results.selectRating')}
                                </p>
                            </div>

                            {/* Recommendation */}
                            <div className="mb-6">
                                <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">{t('results.recommendation')}</label>
                                <div className="flex gap-3">
                                    <RecommendationBadge
                                        value={t('results.proceed')}
                                        selected={feedbackRecommendation === 'Proceed'}
                                        onClick={() => setFeedbackRecommendation('Proceed')}
                                        icon={ThumbsUp}
                                        color="bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                    />
                                    <RecommendationBadge
                                        value={t('results.maybe')}
                                        selected={feedbackRecommendation === 'Maybe'}
                                        onClick={() => setFeedbackRecommendation('Maybe')}
                                        icon={Minus}
                                        color="bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                                    />
                                    <RecommendationBadge
                                        value={t('results.reject')}
                                        selected={feedbackRecommendation === 'Reject'}
                                        onClick={() => setFeedbackRecommendation('Reject')}
                                        icon={ThumbsDown}
                                        color="bg-rose-500/20 border-rose-500/30 text-rose-400"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="mb-6">
                                <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{t('results.notes')}</label>
                                <textarea
                                    value={feedbackNotes}
                                    onChange={(e) => setFeedbackNotes(e.target.value)}
                                    placeholder={t('results.notesPlaceholder')}
                                    rows={4}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 resize-none transition-all"
                                />
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveFeedback}
                                disabled={isSaving || feedbackRating === 0}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                    ${saveSuccess
                                        ? 'bg-emerald-500 text-white'
                                        : feedbackRating === 0
                                            ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                            : 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/20 active:scale-95'
                                    }`}
                            >
                                {isSaving ? (
                                    <><Loader2 size={18} className="animate-spin" /> {t('results.saving')}</>
                                ) : saveSuccess ? (
                                    <><CheckCircle2 size={18} /> {t('results.saved')}</>
                                ) : (
                                    <><Save size={18} /> {t('results.saveFeedback')}</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Transcript */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 min-h-[600px]">
                            <h3 className="flex items-center gap-2 font-bold text-slate-300 mb-6">
                                <FileText size={18} className="text-emerald-400" /> {t('results.transcript')}
                            </h3>
                            <div className="space-y-2">
                                {formatTranscript(interview.transcript)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assessment Modal */}
            {isAssessmentModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Send Assessment</h3>
                        <p className="text-slate-400 mb-6">Choose an assessment to assign to <strong>{interview.candidateName}</strong>.</p>

                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                            {assessments.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedAssessmentId(a.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all
                                        ${selectedAssessmentId === a.id
                                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="font-bold">{a.title}</div>
                                    <div className="text-xs opacity-70 mt-1">{a.assessmentType} • {a.durationMinutes} mins</div>
                                </button>
                            ))}
                            {assessments.length === 0 && (
                                <p className="text-center text-slate-500 py-4">No active assessments found.</p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setIsAssessmentModalOpen(false)}
                                className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendAssessment}
                                disabled={!selectedAssessmentId || isSendingAssessment}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSendingAssessment && <Loader2 size={16} className="animate-spin" />}
                                Send Assessment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewResults;
