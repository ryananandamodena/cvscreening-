
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
    XCircle
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
    useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);

    const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
    const [activeInterview, setActiveInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [candidateAnswer, setCandidateAnswer] = useState("");
    const candidateAnswerRef = useRef("");
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

        // Reset for next question
        setCandidateAnswer("");
        candidateAnswerRef.current = "";
        setTranscript("Listening for new answer...");

        if (sessionRef.current) {
            const currentQ = jobQuestions[currentQuestionIndex] || "General Introduction";
            try {
                sessionRef.current.sendClientContent({ turns: [{ role: "user", parts: [{ text: `[SYSTEM] Candidate answer (Transcript): "${currentAnswer}". Question: "${currentQ}". Please evaluate.` }] }] });
            } catch (e) {
                console.warn("Could not send evaluation request to AI session:", e);
            }
        }

        if (currentQuestionIndex < jobQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(120);
        } else {
            // FINISH & SUBMIT
            await finishInterview();
        }
        setIsSubmitting(false);
    };

    const finishInterview = async () => {
        try {
            // Capture the last answer if not already captured (handled by handleNextQuestion usually, but just in case)
            const finalAnswers = { ...questionAnswers };
            // Note: currentQuestionIndex answer is added in handleNextQuestion before calling this, 
            // or we might need to add it here if called directly. 
            // For now, assuming handleNextQuestion handles the last one too.

            const fullTranscript = jobQuestions.map((q, i) => `Q: ${q}\n\nA: ${finalAnswers[i] || "No answer provided (or audio not captured)."}`).join("\n\n---\n\n");

            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

            // Use token from URL, default to 0 if missing (though it shouldn't be reached without one)
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

    const audioCtxRef = useRef<AudioContext | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sessionRef = useRef<any>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

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
                if (isLive && !sessionRef.current) handleReconnect();
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
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (!inputCtxRef.current) inputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

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

            const langDirective = interviewLang === 'id'
                ? 'You MUST respond and provide all evaluations entirely in Bahasa Indonesia. Do NOT use English.'
                : 'You MUST respond and provide all evaluations entirely in English. Do NOT use Indonesian.';

            const systemInstruction = `You are a passive AI Evaluator for a self-paced interview.
      The candidate will answer questions displayed on screen one by one.
      DO NOT ask questions yourself.
      Your role is to LISTEN to the candidate's answer.
      
      LANGUAGE DIRECTIVE: ${langDirective}
      
      When you receive a [SYSTEM] prompt, you MUST start your response with "[EVALUATION]" followed by the score and feedback.
      Example response: "[EVALUATION] Score: 85. Feedback: ...".
      Otherwise, remain silent or provide very brief neutral acknowledgments like "I am listening".`;

            const sessionPromise = aiService.setupLiveInterview({
                systemInstruction,
                onopen: () => {
                    setTranscript("Session Active. AI Agent is ready.");
                    if (inputCtxRef.current) {
                        const source = inputCtxRef.current.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtxRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            if (sessionRef.current && isLive) {
                                const inputData = e.inputBuffer.getChannelData(0);
                                const pcmBlob = aiService.createPCMBlob(inputData);
                                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
                            }
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtxRef.current.destination);
                    }
                },
                onmessage: async (message: any) => {
                    const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioBase64 && audioCtxRef.current) {
                        const bytes = aiService.decodeBase64(audioBase64);
                        const buffer = await aiService.bytesToAudioBuffer(bytes, audioCtxRef.current);
                        const source = audioCtxRef.current.createBufferSource();
                        source.buffer = buffer;
                        source.connect(audioCtxRef.current.destination);
                        const startTime = Math.max(nextStartTimeRef.current, audioCtxRef.current.currentTime);
                        source.start(startTime);
                        nextStartTimeRef.current = startTime + buffer.duration;
                        sourcesRef.current.add(source);
                        source.onended = () => sourcesRef.current.delete(source);
                    }

                    if (message.serverContent?.modelTurn?.parts[0]?.text) {
                        const text = message.serverContent.modelTurn.parts[0].text;
                        if (text.startsWith("[EVALUATION]")) {
                            const cleanText = text.replace("[EVALUATION]", "").trim();
                            setQuestionAnswers(prev => ({ ...prev, [currentQuestionIndexRef.current]: cleanText }));
                        } else {
                            setTranscript(text);
                        }
                    }

                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e: any) => {
                    console.error("Session Error:", e);
                    setIsLive(false);
                }
            });

            sessionRef.current = await sessionPromise;
            setIsLive(true);

            // Start Speech Recognition for candidate transcript
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;
                recognition.lang = interviewLang === 'id' ? 'id-ID' : 'en-US';

                // Use a ref-based finalTranscript to survive across restarts
                let finalTranscriptAccumulator = '';
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
                            finalTranscriptAccumulator += result[0].transcript + ' ';
                        } else {
                            interim += result[0].transcript;
                        }
                    }
                    const combined = (finalTranscriptAccumulator + interim).trim();
                    setCandidateAnswer(combined);
                    candidateAnswerRef.current = combined;
                    setTranscript(combined || '*Listening...*');
                };

                recognition.onerror = (e: any) => {
                    console.warn('Speech recognition error:', e.error);
                    isRecognitionActive = false;
                    // Auto-restart for recoverable errors
                    if (['no-speech', 'network', 'aborted'].includes(e.error)) {
                        setTimeout(() => {
                            if (sessionRef.current) {
                                try { recognition.start(); } catch (err) { /* ignore */ }
                            }
                        }, 500);
                    }
                };

                recognition.onend = () => {
                    isRecognitionActive = false;
                    // Auto-restart if interview is still active
                    if (sessionRef.current) {
                        setTimeout(() => {
                            if (sessionRef.current) {
                                try { recognition.start(); } catch (e) { /* ignore */ }
                            }
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
        sessionRef.current?.close();
        sessionRef.current = null;

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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        )
    }

    // --- VIEW COMPONENTS ---

    // 1. SYSTEM CHECK VIEW
    if (stage === 'check') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
                <div className="max-w-2xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-4 bg-indigo-500/20 rounded-2xl mb-4">
                            <Zap size={48} className="text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black">{t('interview.systemCheck')}</h1>
                        <p className="text-slate-400">Let's make sure your camera and microphone are working properly before we begin.</p>
                    </div>

                    <div className="bg-slate-800 rounded-3xl p-8 border border-white/5 space-y-6">
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
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
                                    <><Camera size={20} className="text-emerald-400" /><span className="text-emerald-300 font-bold text-sm">{t('interview.cameraReady')}</span><CheckCircle2 size={16} className="ml-auto text-emerald-400" /></>
                                ) : (
                                    <><CameraOff size={20} className="text-slate-500" /><span className="text-slate-500 font-bold text-sm">{t('interview.cameraOff')}</span><XCircle size={16} className="ml-auto text-slate-600" /></>
                                )}
                            </div>
                            <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${micStream
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-slate-700/30 border-white/5'
                                }`}>
                                {micStream ? (
                                    <><Mic size={20} className="text-emerald-400" /><span className="text-emerald-300 font-bold text-sm">{t('interview.micReady')}</span><CheckCircle2 size={16} className="ml-auto text-emerald-400" /></>
                                ) : (
                                    <><MicOff size={20} className="text-slate-500" /><span className="text-slate-500 font-bold text-sm">{t('interview.micOff')}</span><XCircle size={16} className="ml-auto text-slate-600" /></>
                                )}
                            </div>
                        </div>

                        {!videoStream && (
                            <button
                                onClick={checkSystem}
                                className="w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
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
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-blend-soft-light backdrop-blur-3xl">
                <div className="max-w-4xl w-full bg-slate-950/80 backdrop-blur-xl rounded-[40px] border border-white/10 p-12 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                                {activeInterview?.interviewType || 'Technical Interview'}
                            </span>
                            <h1 className="text-5xl font-black leading-tight">
                                Ready for your interview, <span className="text-indigo-400">{activeInterview?.candidateName || 'Candidate'}</span>?
                            </h1>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                You are about to begin the assessment for the <strong className="text-white">{activeInterview?.jobTitle || 'Role'}</strong> position.
                            </p>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-4 text-slate-300">
                                    <div className="size-10 bg-slate-800 rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Duration</p>
                                        <p className="font-bold">~{jobQuestions.length * 2} Minutes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-300">
                                    <div className="size-10 bg-slate-800 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Questions</p>
                                        <p className="font-bold">{jobQuestions.length} Questions</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-6">
                            <h3 className="font-bold text-xl mb-4">Before we start:</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-slate-300 text-sm">
                                    <div className="mt-0.5 size-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                                    Ensure you are in a quiet environment.
                                </li>
                                <li className="flex gap-3 text-slate-300 text-sm">
                                    <div className="mt-0.5 size-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                                    Speak clearly and at a normal pace.
                                </li>
                                <li className="flex gap-3 text-slate-300 text-sm">
                                    <div className="mt-0.5 size-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                                    You have 2 minutes per question.
                                </li>
                            </ul>

                            <button
                                onClick={() => {
                                    setStage('interview');
                                    initSession();
                                }}
                                className="w-full py-5 bg-white text-indigo-900 font-black rounded-2xl shadow-xl hover:bg-indigo-50 transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
                            >
                                <Mic size={24} /> {t('liveInterview.session.start') || 'START INTERVIEW'}
                            </button>

                            {/* Interview Language Selector */}
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('interview.selectLanguage')}</span>
                                <select
                                    value={interviewLang}
                                    onChange={(e) => setInterviewLang(e.target.value as 'id' | 'en')}
                                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer backdrop-blur-sm"
                                >
                                    <option value="id" className="text-slate-900">🇮🇩 {t('interview.langId')}</option>
                                    <option value="en" className="text-slate-900">🇬🇧 {t('interview.langEn')}</option>
                                </select>
                            </div>
                            <p className="text-center text-xs text-slate-500">{t('interview.langHint')}</p>
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
            <div className="min-h-screen bg-emerald-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-emerald-900/20 p-8 rounded-full mb-8 animate-in zoom-in duration-500">
                    <CheckCircle2 size={80} className="text-emerald-400" />
                </div>
                <h1 className="text-5xl font-black mb-6">{t('interview.successTitle')}</h1>
                <p className="text-xl text-emerald-200/60 max-w-xl mx-auto mb-12">
                    {t('interview.successMessage')}
                </p>

                <div className="flex gap-4">
                    {recordedChunksRef.current.length > 0 && (
                        <button
                            onClick={handleDownloadRecording}
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all flex items-center gap-2"
                        >
                            <Download size={20} /> {t('interview.downloadRecording')}
                        </button>
                    )}
                    <button onClick={() => window.close()} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        );
    }

    // 4. INTERVIEW VIEW (Default/Existing)
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <BrainCircuit className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">RecruitAI</h1>
                        <p className="text-xs text-slate-400 font-medium">{activeInterview?.candidateName}</p>
                    </div>
                </div>

                {isLive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
                        <div className="size-2 bg-rose-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('interview.live')}</span>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-6 overflow-hidden max-w-6xl mx-auto w-full">
                {/* Left: Video Feed */}
                <div className="flex-1 relative bg-slate-800 rounded-[32px] overflow-hidden border-4 border-slate-700/50 shadow-2xl">
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
                        <div className="absolute inset-0 flex items-center justify-center">
                            <User size={64} className="text-slate-600" />
                        </div>
                    )}

                    {/* Visualizer Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-slate-900/90 to-transparent">
                        <AudioVisualizer stream={micStream} isActive={isLive} color="#818cf8" />
                    </div>
                </div>

                {/* Right: Interaction Panel */}
                <div className="w-[450px] flex flex-col">
                    <div className="bg-indigo-600 p-8 rounded-[32px] shadow-2xl shadow-indigo-900/50 flex flex-col h-auto min-h-[500px] relative overflow-hidden transition-all duration-500">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest bg-indigo-700/50 px-3 py-1 rounded-full">
                                    {t('interview.question')} {currentQuestionIndex + 1}/{jobQuestions.length}
                                </span>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 ${timeLeft < 30 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
                                    <Clock size={14} /> {formatTime(timeLeft)}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white leading-tight mb-6 min-h-[100px] flex items-center justify-center text-center">
                                    {jobQuestions[currentQuestionIndex] || "Please introduce yourself."}
                                </h3>

                                <div className="space-y-2">
                                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-indigo-100 text-xs italic leading-relaxed mb-1 min-h-[120px] max-h-[200px] overflow-y-auto">
                                        "{transcript.split('\n').pop() || 'Listening...'}"
                                    </div>
                                    <div className="flex justify-center">
                                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest animate-pulse">
                                            {t('interview.aiListening')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10">
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:bg-indigo-50 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin" size={20} /> {t('interview.processing')}</>
                                    ) : (
                                        currentQuestionIndex < jobQuestions.length - 1 ? (
                                            <>Submit Answer <ChevronRight size={18} /></>
                                        ) : (
                                            <>{t('interview.submitFinish')} <CheckCircle2 size={18} /></>
                                        )
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateInterview;
