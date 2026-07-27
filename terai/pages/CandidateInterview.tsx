
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Zap,
    Mic,
    MicOff,
    Clock,
    ChevronRight,
    CheckCircle2,
    BrainCircuit,
    User,
    Loader2,
    AlertCircle,
    Camera,
    CameraOff,
    Download,
    XCircle,
    Sparkles,
    Edit3
} from 'lucide-react';
import { aiService } from '../services/ai.service';
import { apiService } from '../services/api.service';
import {
    saveSession,
    loadSession,
    clearSession,
    generateSessionId,
    updateSessionActivity,
    checkBrowserCompatibility,
    AutoReconnect,
    NetworkMonitor,
    type InterviewSession,
    type BrowserCompatibility
} from '../utils/interviewSession';
import { useLanguage } from '../contexts/LanguageContext';

const AudioVisualizer = ({ stream, isActive, color = '#6366f1' }: { stream: MediaStream | null, isActive: boolean, color?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!isActive || !stream || !canvasRef.current) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioCtx = audioCtxRef.current;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!ctx) return;
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillStyle = color;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isActive, stream, color]);

    return <canvas ref={canvasRef} className="w-full h-16 opacity-50" width={300} height={64} />;
};

const CandidateInterview = () => {
    const { token } = useParams<{ token?: string }>();
    const navigate = useNavigate();
    const { t, lang } = useLanguage();

    // Stages: check -> intro -> interview -> success
    const [stage, setStage] = useState<'check' | 'intro' | 'interview' | 'success'>('check');

    const [interviewLang, setInterviewLang] = useState<'id' | 'en'>(lang as 'id' | 'en');
    const [isLive, setIsLive] = useState(false);

    // Question translation map (English -> Indonesian)
    const questionTranslations: Record<string, string> = {
        "Tell me about a challenging project you worked on.": "Ceritakan tentang proyek yang menantang yang pernah Anda kerjakan.",
        "How do you handle conflict in a team?": "Bagaimana Anda menangani konflik dalam tim?",
        "What motivates you to work in this field?": "Apa yang memotivasi Anda bekerja di bidang ini?",
        "Tell us about yourself and your experience relevant to this role.": "Ceritakan tentang diri Anda dan pengalaman yang relevan dengan posisi ini.",
        "Please introduce yourself.": "Silakan perkenalkan diri Anda.",
        "Invalid Session": "Sesi Tidak Valid",
        "Connection Error. Please try again.": "Koneksi Error. Silakan coba lagi.",
        "What are your strengths and weaknesses?": "Apa kelebihan dan kekurangan Anda?",
        "Why do you want to work at this company?": "Mengapa Anda ingin bekerja di perusahaan ini?",
        "Where do you see yourself in 5 years?": "Di mana Anda melihat diri Anda dalam 5 tahun?",
        "Describe a time you showed leadership.": "Ceritakan saat Anda menunjukkan kepemimpinan.",
        "How do you prioritize your work?": "Bagaimana Anda memprioritaskan pekerjaan Anda?",
    };

    const translateQuestion = (q: string): string => {
        if (interviewLang === 'en') return q;
        // Check exact translation map first
        if (questionTranslations[q]) return questionTranslations[q];
        // Return original if no translation found (database questions will be translated by AI)
        return q;
    };
    const [transcript, setTranscript] = useState("Establishing secure connection...");
    const [micStream, setMicStream] = useState<MediaStream | null>(null);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const [jobQuestions, setJobQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const currentQuestionIndexRef = useRef(0);
    const questionRecorderRef = useRef<MediaRecorder | null>(null);
    const questionChunksRef = useRef<Blob[]>([]);
    useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);

    const [aiReviewMode, setAiReviewMode] = useState(false);
    const [aiEvaluationResult, setAiEvaluationResult] = useState("");
    const [aiTranscriptResult, setAiTranscriptResult] = useState("");
    const [correctionMode, setCorrectionMode] = useState(false);
    const [correctedTranscript, setCorrectedTranscript] = useState("");

    const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
    const [activeInterview, setActiveInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [candidateAnswer, setCandidateAnswer] = useState("");
    const candidateAnswerRef = useRef("");
    // FIX: finalTranscriptAccumulator sebagai ref agar bisa direset dari handleNextQuestion
    const finalTranscriptAccumulatorRef = useRef('');
    const recognitionRef = useRef<any>(null);

    // Self-Paced Interview State
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question

    // Timer Effect
    useEffect(() => {
        if (isLive && stage === 'interview' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && isLive && stage === 'interview') {
            handleNextQuestion();
        }
    }, [isLive, timeLeft, stage]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNextQuestion = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Simulate network/processing delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 800));

        // Capture current answer from speech recognition
        const currentAnswer = candidateAnswerRef.current || candidateAnswer || "(No answer captured)";

        // Update local state for consistency
        setQuestionAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: currentAnswer
        }));

        // Reset untuk pertanyaan berikutnya - termasuk accumulator agar jawaban tidak bergabung
        setCandidateAnswer("");
        candidateAnswerRef.current = "";
        finalTranscriptAccumulatorRef.current = ''; 
        setTranscript("Processing your answer...");

        let videoBlob: Blob | undefined;
        if (questionRecorderRef.current && questionRecorderRef.current.state !== 'inactive') {
            await new Promise<void>(resolve => {
                questionRecorderRef.current!.onstop = () => resolve();
                questionRecorderRef.current!.stop();
            });
            await new Promise(resolve => setTimeout(resolve, 300));
            if (questionChunksRef.current.length > 0) {
                videoBlob = new Blob(questionChunksRef.current, { type: 'video/webm' });
            }
        }
        questionChunksRef.current = [];

        if (questionRecorderRef.current && currentQuestionIndex < jobQuestions.length - 1) {
            try { questionRecorderRef.current.start(); } catch (e) { console.error("Failed to start next question recorder", e); }
        }

        if (videoBlob) {
            try {
                const currentQ = jobQuestions[currentQuestionIndex] || "General Introduction";
                const result = await aiService.evaluateVideoAnswer(currentQ, videoBlob, interviewLang);
                setQuestionAnswers(prev => ({
                    ...prev,
                    [currentQuestionIndex]: result.transcript
                }));
                setAiTranscriptResult(result.transcript);
                setAiEvaluationResult(result.evaluation);
                // Go to correction mode first — user can edit transcript before seeing evaluation
                setCorrectedTranscript(result.transcript);
                setCorrectionMode(true);
            } catch (e) {
                console.warn("Failed to evaluate video:", e);
                setAiTranscriptResult(currentAnswer || "(Audio/Video not captured correctly)");
                setAiEvaluationResult("AI Evaluation failed (Server Error). We have saved your video response safely, you may proceed to the next question.");
                setCorrectedTranscript(currentAnswer || "(Audio/Video not captured correctly)");
                setCorrectionMode(true);
            }
        } else {
            setAiTranscriptResult(currentAnswer || "(Audio/Video not captured)");
            setAiEvaluationResult("No video was captured for this question. You may proceed.");
            setCorrectedTranscript(currentAnswer || "(Audio/Video not captured)");
            setCorrectionMode(true);
        }
        setIsSubmitting(false);
    };

    const confirmCorrection = () => {
        // Save corrected transcript as final answer
        setQuestionAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: correctedTranscript
        }));
        setAiTranscriptResult(correctedTranscript);
        setCorrectionMode(false);
        setAiReviewMode(true); // Now show AI evaluation
    };

    const proceedToNextQuestion = async () => {
        setAiReviewMode(false);
        setAiTranscriptResult("");
        setAiEvaluationResult("");
        
        if (currentQuestionIndex < jobQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(120);
        } else {
            // FINISH & SUBMIT
            setTranscript("Menyusun hasil wawancara akhir...");
            await finishInterview();
        }
    };

    const finishInterview = async () => {
        try {
            // FIX: Ambil jawaban terakhir langsung dari ref (tidak mengandalkan state yang mungkin belum update)
            const lastAnswerBeforeFinish = candidateAnswerRef.current || candidateAnswer || "(No answer captured)";
            // Gabungkan semua jawaban sebelumnya + jawaban terakhir
            const finalAnswers = {
                ...questionAnswers,
                [currentQuestionIndex]: lastAnswerBeforeFinish
            };

            const fullTranscript = jobQuestions.map((q, i) => `Q: ${q}\n\nA: ${finalAnswers[i] || "No answer provided (or audio not captured.)"}`).join("\n\n---\n\n");

            // FIX: Stop mediaRecorder dulu agar semua chunks ter-flush sebelum membuat blob
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                await new Promise<void>(resolve => {
                    mediaRecorderRef.current!.onstop = () => resolve();
                    mediaRecorderRef.current!.stop();
                });
                // Tunggu sedikit agar ondataavailable terakhir selesai dipanggil
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Buat video blob hanya jika ada data (skip jika kosong agar tidak error)
            const videoBlob = recordedChunksRef.current.length > 0
                ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
                : undefined;

            // Use token from URL, default to 0 if missing
            await apiService.submitInterview(token || "0", fullTranscript, videoBlob);

            setStage('success');
            terminateSession(false); // Don't download automatically, let user choose in success screen
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Failed to save results to database. Please contact support.");
        }
    }


    useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream, stage]); // Re-attach when stage changes



    // Session Management
    const [sessionId, setSessionId] = useState<string>(() => generateSessionId());
    const [browserCompat, setBrowserCompat] = useState<BrowserCompatibility | null>(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const reconnectRef = useRef<AutoReconnect | null>(null);
    const networkMonitorRef = useRef<NetworkMonitor | null>(null);

    useEffect(() => {
        const compat = checkBrowserCompatibility();
        setBrowserCompat(compat);
        if (!compat.isCompatible) console.error('Browser compatibility issues:', compat.missingFeatures);
    }, []);

    useEffect(() => {
        networkMonitorRef.current = new NetworkMonitor(
            () => {
                if (isLive) handleReconnect();
            },
            () => { }
        );
        return () => networkMonitorRef.current?.cleanup();
    }, [isLive]);

    // Initialize Data
    useEffect(() => {
        const loadData = async () => {
            // Simulate loading / validation
            await new Promise(r => setTimeout(r, 1000));

            let mappedQuestions: string[] = [];
            // Logic to fetch questions based on token would go here
            // For demo 'TEST_TOKEN', we use dummy questions
            if (token === 'TEST_TOKEN') {
                mappedQuestions = [
                    translateQuestion("Tell me about a challenging project you worked on."),
                    translateQuestion("How do you handle conflict in a team?"),
                    translateQuestion("What motivates you to work in this field?")
                ];
                setJobQuestions(mappedQuestions);
                setActiveInterview({ candidateName: "Test Candidate", jobTitle: "Software Engineer" });
            } else if (token) {
                try {
                    const response = await apiService.get<any>('/interviews');
                    const interviews = response?.data || response || [];
                    const found = interviews.find((i: any) => String(i.id) === token || i.token === token);

                    if (found) {
                        setActiveInterview(found);
                        if (found.jobId) {
                            const qResponse = await apiService.get<any>(`/jobs/${found.jobId}/questions`);
                            const questions = qResponse?.data || qResponse || [];
                            if (Array.isArray(questions) && questions.length > 0) {
                            mappedQuestions = questions.map((q: any) => {
                                const text = q.question || q.text || String(q);
                                return translateQuestion(text);
                            });
                            } else {
                                mappedQuestions = [translateQuestion("Tell us about yourself and your experience relevant to this role.")];
                            }
                        } else {
                            mappedQuestions = [translateQuestion("Please introduce yourself.")];
                        }
                    } else {
                        // alert("Interview not found or invalid token.");
                        mappedQuestions = [translateQuestion("Invalid Session")];
                    }
                } catch (err) {
                    console.error("Failed to load interview:", err);
                    mappedQuestions = [translateQuestion("Connection Error. Please try again.")];
                }
                setJobQuestions(mappedQuestions);
            }
            setLoading(false);
        };
        loadData();
    }, [token]);

    // Re-translate questions when interviewLang changes (before interview starts)
    useEffect(() => {
        if (stage !== 'interview' && jobQuestions.length > 0) {
            setJobQuestions(prev => prev.map(q => translateQuestion(q)));
        }
    }, [interviewLang]);

    const checkSystem = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setMicStream(stream);
            setVideoStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
            return true;
        } catch (err) {
            console.error("System Check Failed:", err);
            alert("Camera/Microphone access denied. Please allow access to proceed.");
            return false;
        }
    };

    const initSession = async () => {
        try {
            // Re-use stream or get new one
            const stream = videoStream || await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setMicStream(stream);
            setVideoStream(stream);

            if (videoRef.current) videoRef.current.srcObject = stream;

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000);

            // Per-question recorder
            const qRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
            qRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) questionChunksRef.current.push(event.data);
            };
            questionRecorderRef.current = qRecorder;
            qRecorder.start();

            setIsLive(true);
            setTranscript("Session Active. AI Evaluator is ready.");

            // Start Speech Recognition for candidate transcript
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;
                recognition.lang = interviewLang === 'id' ? 'id-ID' : 'en-US';

                // FIX: Gunakan ref level komponen agar bisa direset saat pindah pertanyaan
                finalTranscriptAccumulatorRef.current = '';
                let isRecognitionActive = false;

                recognition.onstart = () => {
                    isRecognitionActive = true;
                };

                recognition.onresult = (event: any) => {
                    let interim = '';
                    // Process only new results from resultIndex
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        if (result.isFinal) {
                            finalTranscriptAccumulatorRef.current += result[0].transcript + ' ';
                        } else {
                            interim += result[0].transcript;
                        }
                    }
                    const combined = (finalTranscriptAccumulatorRef.current + interim).trim();
                    setCandidateAnswer(combined);
                    candidateAnswerRef.current = combined;
                    setTranscript(combined || '*Listening...*');
                };

                recognition.onerror = (e: any) => {
                    console.warn('Speech recognition error:', e.error);
                    isRecognitionActive = false;
                };

                recognition.onend = () => {
                    isRecognitionActive = false;
                    // Auto-restart if interview is still active
                    if (isLive) {
                        setTimeout(() => {
                            try { recognition.start(); } catch (e) { /* ignore */ }
                        }, 300);
                    }
                };

                recognition.start();
                recognitionRef.current = recognition;
            } else {
                console.warn('SpeechRecognition not supported in this browser');
            }
        } catch (err) {
            console.error("Microphone Access Error:", err);
            alert("Hardware access required. Please enable Mic permissions.");
        }
    };

    const [isSaving, setIsSaving] = useState(false);

    const terminateSession = async (download = true) => {
        setIsLive(false);

        // Stop speech recognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
            recognitionRef.current = null;
        }

        setIsSaving(true);
        clearSession();
        reconnectRef.current?.cancel();

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (download && recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const validTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `interview_recording_${validTimestamp}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        setIsSaving(false);
        if (micStream) { micStream.getTracks().forEach(track => track.stop()); setMicStream(null); }
        if (videoStream) { videoStream.getTracks().forEach(track => track.stop()); setVideoStream(null); }
        // setActiveInterview(null); // Keep active interview for success screen
    };

    const handleReconnect = async () => {
        // Reconnect logic
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-900 dark:text-white" size={48} />
            </div>
        )
    }

    // --- VIEW COMPONENTS ---

    // 1. SYSTEM CHECK VIEW
    if (stage === 'check') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6">
                <div className="max-w-2xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-4 bg-brand-500/20 rounded-2xl mb-4">
                            <Zap size={48} className="text-brand-600 dark:text-brand-400" />
                        </div>
                        <h1 className="text-3xl font-black">{t('interview.systemCheck')}</h1>
                        <p className="text-slate-600 dark:text-slate-400">Let's make sure your camera and microphone are working properly before we begin.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-white/5 space-y-6">
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
                            {videoStream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transform -scale-x-100"
                                    onLoadedMetadata={(e) => e.currentTarget.play()}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 gap-4">
                                    <User size={48} />
                                    <p>Camera Preview</p>
                                </div>
                            )}
                            {/* Audio Visualizer Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end pb-2 px-4">
                                <AudioVisualizer stream={micStream} isActive={!!micStream} color="#4ade80" />
                            </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${videoStream
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-slate-700/30 border-white/5'
                                }`}>
                                {videoStream ? (
                                    <><Camera size={20} className="text-emerald-600 dark:text-emerald-400" /><span className="text-emerald-300 font-bold text-sm">{t('interview.cameraReady')}</span><CheckCircle2 size={16} className="ml-auto text-emerald-600 dark:text-emerald-400" /></>
                                ) : (
                                    <><CameraOff size={20} className="text-slate-700 dark:text-slate-300" /><span className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t('interview.cameraOff')}</span><XCircle size={16} className="ml-auto text-slate-600" /></>
                                )}
                            </div>
                            <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${micStream
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-slate-700/30 border-white/5'
                                }`}>
                                {micStream ? (
                                    <><Mic size={20} className="text-emerald-600 dark:text-emerald-400" /><span className="text-emerald-300 font-bold text-sm">{t('interview.micReady')}</span><CheckCircle2 size={16} className="ml-auto text-emerald-600 dark:text-emerald-400" /></>
                                ) : (
                                    <><MicOff size={20} className="text-slate-700 dark:text-slate-300" /><span className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t('interview.micOff')}</span><XCircle size={16} className="ml-auto text-slate-600" /></>
                                )}
                            </div>
                        </div>

                        {!videoStream && (
                            <button
                                onClick={checkSystem}
                                className="w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/20"
                            >
                                <Mic size={20} /> {t('interview.requestAccess')}
                            </button>
                        )}

                        {videoStream && micStream && (
                            <button onClick={() => setStage('intro')} className="w-full py-4 font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-2xl transition-all shadow-lg shadow-emerald-500/20">
                                {t('interview.proceed')} <ChevronRight className="inline" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 2. WAITING ROOM / INTRO VIEW
    if (stage === 'intro') {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
                <div className="max-w-4xl w-full bg-white rounded-2xl border border-slate-200 p-12 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
                                {activeInterview?.interviewType || 'Technical Interview'}
                            </span>
                            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                                Ready for your interview, <span className="text-blue-600">{activeInterview?.candidateName || 'Candidate'}</span>?
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                You are about to begin the assessment for the <strong className="text-slate-900">{activeInterview?.jobTitle || 'Role'}</strong> position.
                            </p>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-4 text-slate-700">
                                    <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center"><Clock size={20} className="text-slate-600" /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Duration</p>
                                        <p className="font-bold">~{jobQuestions.length * 2} Minutes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-700">
                                    <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} className="text-slate-600" /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Questions</p>
                                        <p className="font-bold">{jobQuestions.length} Questions</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 space-y-6">
                            <h3 className="font-bold text-xl text-slate-900 mb-4">Before we start:</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-slate-700 text-sm">
                                    <div className="mt-0.5 size-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                                    Ensure you are in a quiet environment.
                                </li>
                                <li className="flex gap-3 text-slate-700 text-sm">
                                    <div className="mt-0.5 size-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                                    Speak clearly and at a normal pace.
                                </li>
                                <li className="flex gap-3 text-slate-700 text-sm">
                                    <div className="mt-0.5 size-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                                    You have 2 minutes per question.
                                </li>
                            </ul>

                            <button
                                onClick={() => {
                                    setStage('interview');
                                    initSession();
                                }}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
                            >
                                <Mic size={24} /> {t('liveInterview.session.start') || 'START INTERVIEW'}
                            </button>

                            {/* Interview Language Selector */}
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('interview.selectLanguage')}</span>
                                <select
                                    value={interviewLang}
                                    onChange={(e) => setInterviewLang(e.target.value as 'id' | 'en')}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="id" className="text-slate-900">🇮🇩 {t('interview.langId')}</option>
                                    <option value="en" className="text-slate-900">🇬🇧 {t('interview.langEn')}</option>
                                </select>
                            </div>
                            <p className="text-center text-xs text-slate-700 dark:text-slate-300">{t('interview.langHint')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. SUCCESS VIEW
    if (stage === 'success') {
        const handleDownloadRecording = () => {
            if (recordedChunksRef.current.length > 0) {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const validTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `interview_recording_${validTimestamp}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        };

        return (
            <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-emerald-100 p-8 rounded-full mb-8 animate-in zoom-in duration-500">
                    <CheckCircle2 size={80} className="text-emerald-600" />
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-6">{t('interview.successTitle')}</h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto mb-12">
                    {t('interview.successMessage')}
                </p>

                <div className="flex gap-4">
                    {recordedChunksRef.current.length > 0 && (
                        <button
                            onClick={handleDownloadRecording}
                            className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            <Download size={18} /> {t('interview.downloadRecording')}
                        </button>
                    )}
                    <button onClick={() => window.close()} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        );
    }

    // 4. INTERVIEW VIEW — Full Screen Redesign
    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col overflow-hidden">

            {/* ===== CORRECTION MODE: Edit transcript before AI evaluation ===== */}
            {correctionMode && (
                <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Edit3 className="text-slate-900 dark:text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="font-extrabold text-slate-900 text-lg">Koreksi Jawaban</h1>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    {t('interview.question')} {currentQuestionIndex + 1}/{jobQuestions.length}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            Step 2 of 3
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="w-full max-w-3xl space-y-6">
                            {/* Question Reference */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] text-slate-700 dark:text-slate-300 uppercase font-bold tracking-widest mb-2">Pertanyaan:</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {jobQuestions[currentQuestionIndex] || "Please introduce yourself."}
                                </p>
                            </div>

                            {/* Editable Transcript */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-amber-600 uppercase font-bold tracking-widest flex items-center gap-1.5">
                                        <Edit3 size={12} /> Jawaban yang ditangkap AI — Silakan koreksi jika salah:
                                    </p>
                                </div>
                                <textarea
                                    value={correctedTranscript}
                                    onChange={(e) => setCorrectedTranscript(e.target.value)}
                                    className="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-medium"
                                    placeholder="Tulis atau koreksi jawaban Anda di sini..."
                                />
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Anda bisa mengedit teks di atas agar sesuai dengan apa yang sebenarnya Anda ucapkan. Setelah yakin, tekan "Konfirmasi & Lihat Evaluasi AI".
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        // Skip correction, use original transcript
                                        setCorrectedTranscript(aiTranscriptResult);
                                        confirmCorrection();
                                    }}
                                    className="flex-1 py-4 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    Lewati Koreksi <ChevronRight size={18} />
                                </button>
                                <button
                                    onClick={confirmCorrection}
                                    className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Konfirmasi & Lihat Evaluasi AI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== AI REVIEW MODE: Full screen evaluation results ===== */}
            {aiReviewMode && !correctionMode && (
                <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="text-slate-900 dark:text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="font-extrabold text-slate-900 text-lg">AI Evaluation</h1>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    {t('interview.question')} {currentQuestionIndex + 1}/{jobQuestions.length}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            Step 3 of 3
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                        <div className="w-full max-w-3xl space-y-6">
                            {/* Question */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] text-slate-700 dark:text-slate-300 uppercase font-bold tracking-widest mb-2">Pertanyaan:</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {jobQuestions[currentQuestionIndex] || "Please introduce yourself."}
                                </p>
                            </div>

                            {/* Your Corrected Answer */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] text-slate-700 dark:text-slate-300 uppercase font-bold tracking-widest mb-2">Jawaban Anda (setelah koreksi):</p>
                                <p className="text-sm text-slate-700 italic leading-relaxed">"{aiTranscriptResult}"</p>
                            </div>

                            {/* AI Evaluation Result */}
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                <p className="text-[10px] text-blue-600 uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
                                    <Sparkles size={12} /> Evaluasi dari AI:
                                </p>
                                <p className="text-sm text-slate-800 leading-relaxed font-medium">{aiEvaluationResult}</p>
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={proceedToNextQuestion}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg"
                            >
                                {currentQuestionIndex < jobQuestions.length - 1 ? (
                                    <>Pertanyaan Selanjutnya <ChevronRight size={20} /></>
                                ) : (
                                    <>{t('interview.submitFinish')} <CheckCircle2 size={20} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== RECORDING MODE: Full screen video with overlays ===== */}
            {/* Top Bar Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="size-9 bg-blue-600 rounded-lg flex items-center justify-center">
                        <BrainCircuit className="text-slate-900 dark:text-white" size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 dark:text-white text-sm">RecruitAI</h1>
                        <p className="text-[10px] text-slate-900 dark:text-white/60 font-medium">{activeInterview?.candidateName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isLive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-600/90 rounded-full animate-pulse">
                            <div className="size-2 bg-white rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t('interview.live')}</span>
                        </div>
                    )}
                    <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm ${timeLeft < 30 ? 'bg-rose-500/90 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
                        <Clock size={14} /> {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* Full Screen Video */}
            <div className="flex-1 relative">
                {videoStream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800">
                        <User size={80} className="text-slate-600" />
                    </div>
                )}

                {/* Question Overlay — Bottom Center */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                    <div className="p-8 pb-6 max-w-4xl mx-auto">
                        {/* Question Counter */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-slate-900 dark:text-white/60 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                {t('interview.question')} {currentQuestionIndex + 1}/{jobQuestions.length}
                            </span>
                        </div>

                        {/* Question Text */}
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6 drop-shadow-lg">
                            {jobQuestions[currentQuestionIndex] || "Please introduce yourself."}
                        </h2>

                        {/* Audio Visualizer */}
                        <div className="mb-4">
                            <AudioVisualizer stream={micStream} isActive={isLive} color="#3b82f6" />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleNextQuestion}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" size={20} /> {t('interview.processing') || 'Memproses jawaban...'}</>
                            ) : (
                                currentQuestionIndex < jobQuestions.length - 1 ? (
                                    <>Kirim Jawaban <ChevronRight size={18} /></>
                                ) : (
                                    <>Kirim & Selesai <CheckCircle2 size={18} /></>
                                )
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateInterview;
