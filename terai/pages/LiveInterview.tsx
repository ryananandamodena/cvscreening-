
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Monitor, User, Zap, LogOut, BrainCircuit, Smile, Volume2, ChevronRight, Mic, ShieldAlert, MicOff, Activity,
  Calendar, Clock, Plus, Filter, Search, CheckCircle2, AlertCircle, Loader2, FileText, Video, VideoOff, RotateCcw, Save,
  AlertTriangle, Info, CheckCircle, XCircle
} from 'lucide-react';

// Priority classification types for AI Observations
type ObservationPriority = 'high' | 'medium' | 'low';

interface AIObservation {
  id: string;
  type: 'sentiment' | 'topic' | 'concern' | 'strength' | 'recommendation';
  priority: ObservationPriority;
  label: string;
  description: string;
  timestamp: number;
}

// Keywords that trigger high priority
const HIGH_PRIORITY_KEYWORDS = [
  'concern', 'warning', 'problem', 'issue', 'difficulty', 'struggle', 'weakness',
  'fired', 'quit', 'left', 'conflict', 'lawsuit', 'complaint', 'terminated'
];

// Keywords that trigger medium priority
const MEDIUM_PRIORITY_KEYWORDS = [
  'learn', 'developing', 'growing', 'new', 'training', 'mentoring', 'improving',
  'junior', 'senior', 'lead', 'manage', 'team', 'project'
];

// Keywords for strength detection
const STRENGTH_KEYWORDS = [
  'expert', 'master', 'proven', 'lead', 'created', 'built', 'designed', 'architected',
  'achieved', 'award', 'recognition', 'exceeded', 'success', 'excellent'
];

/**
 * Classify an observation based on its content and sentiment
 */
function classifyObservation(
  type: AIObservation['type'],
  content: string,
  sentiment: string
): ObservationPriority {
  const lowerContent = content.toLowerCase();

  // High priority: concerns, negative sentiment, or critical keywords
  if (type === 'concern' || sentiment === 'negative') {
    return 'high';
  }

  if (HIGH_PRIORITY_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return 'high';
  }

  // Medium priority: topics of interest, developing skills
  if (type === 'topic' || type === 'recommendation') {
    return 'medium';
  }

  if (MEDIUM_PRIORITY_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return 'medium';
  }

  // Low priority: strengths, positive neutral observations
  if (type === 'strength' || sentiment === 'positive') {
    return 'low';
  }

  return 'medium'; // Default to medium
}

/**
 * Convert sentiment string to numeric score
 */
function sentimentToScore(sentiment: string): number {
  switch (sentiment.toLowerCase()) {
    case 'positive': return 0.85;
    case 'neutral': return 0.5;
    case 'negative': return 0.15;
    default: return 0.5;
  }
}

/**
 * Generate observations from AI analysis
 */
function generateObservations(
  sentiment: string,
  topics: string[],
  existingObservations: AIObservation[]
): AIObservation[] {
  const newObservations: AIObservation[] = [];
  const now = Date.now();

  // Add sentiment observation
  const sentimentPriority = classifyObservation('sentiment', sentiment, sentiment);
  newObservations.push({
    id: `obs_sentiment_${now}`,
    type: 'sentiment',
    priority: sentimentPriority,
    label: 'Sentiment',
    description: `Real-time sentiment: ${sentiment}`,
    timestamp: now
  });

  // Add topic observations
  topics.forEach((topic, idx) => {
    const isStrength = STRENGTH_KEYWORDS.some(kw => topic.toLowerCase().includes(kw));
    const type = isStrength ? 'strength' : 'topic';
    const priority = classifyObservation(type, topic, sentiment);

    newObservations.push({
      id: `obs_topic_${now}_${idx}`,
      type,
      priority,
      label: isStrength ? 'Strength' : 'Topic',
      description: `Mentioned: "${topic}"`,
      timestamp: now + idx
    });
  });

  // Add recommendation based on overall assessment
  if (sentimentToScore(sentiment) < 0.4) {
    newObservations.push({
      id: `obs_rec_${now}`,
      type: 'recommendation',
      priority: 'high',
      label: 'Attention Needed',
      description: 'Candidate shows signs that require further investigation',
      timestamp: now + 100
    });
  }

  // Merge with existing observations, keeping recent ones
  return [...existingObservations.slice(-20), ...newObservations];
}

/**
 * Get priority color and icon
 */
function getPriorityStyle(priority: ObservationPriority): {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
  label: string;
} {
  switch (priority) {
    case 'high':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        icon: <AlertTriangle size={12} className="text-rose-600" />,
        label: 'High'
      };
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: <Info size={12} className="text-amber-600" />,
        label: 'Medium'
      };
    case 'low':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: <CheckCircle size={12} className="text-emerald-600" />,
        label: 'Low'
      };
  }
}
import { aiService } from '../services/ai.service';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
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

const VolumeMeter = ({ stream, isRecording }: { stream: MediaStream | null, isRecording: boolean }) => {
  const [level, setLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      setLevel(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      setLevel(Math.min(100, Math.floor((average / 128) * 100)));
      animationRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      audioCtx.close();
    };
  }, [isRecording, stream]);

  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="flex justify-between items-center px-1">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mic Level</span>
        <span className={`text-[8px] font-bold ${level > 10 ? 'text-emerald-500' : 'text-rose-400'}`}>
          {level > 10 ? 'OK' : 'Too Quiet'}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <motion.div 
          animate={{ width: `${level}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`h-full rounded-full ${
            level > 60 ? 'bg-amber-500' : level > 10 ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
      </div>
    </div>
  );
};

const LiveInterview = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { addToast } = useToast();
  const [isLive, setIsLive] = useState(false);
  const isLiveRef = useRef(false);
  const [interviewLang, setInterviewLang] = useState<'id' | 'en'>(lang as 'id' | 'en');

  // AI Observations State - populated from real-time analysis with priority classification
  const [aiObservations, setAiObservations] = useState<AIObservation[]>([]);
  const [observationFilter, setObservationFilter] = useState<ObservationPriority | 'all'>('all');

  // Derived state for sentiment (for backward compatibility)
  const currentSentiment = useMemo(() => {
    const sentimentObs = aiObservations.find(o => o.type === 'sentiment');
    return sentimentObs ? aiObservations.filter(o => o.type === 'sentiment')[0]?.description.replace('Real-time sentiment: ', '') || 'Analyzing...' : 'Analyzing...';
  }, [aiObservations]);

  // Derived state for topics
  const currentTopics = useMemo(() => {
    return aiObservations.filter(o => o.type === 'topic' || o.type === 'strength').map(o => o.description.replace('Mentioned: "', '').replace('"', ''));
  }, [aiObservations]);

  // Filtered observations based on selected priority
  const filteredObservations = useMemo(() => {
    if (observationFilter === 'all') return aiObservations;
    return aiObservations.filter(o => o.priority === observationFilter);
  }, [aiObservations, observationFilter]);

  // Priority counts for badges
  const priorityCounts = useMemo(() => ({
    high: aiObservations.filter(o => o.priority === 'high').length,
    medium: aiObservations.filter(o => o.priority === 'medium').length,
    low: aiObservations.filter(o => o.priority === 'low').length
  }), [aiObservations]);

  // Derived state for candidate vitals based on observations
  const candidateVitals = useMemo(() => {
    const highPriority = priorityCounts.high;
    const total = aiObservations.length;

    // Calculate fluency based on sentiment
    let fluency = 'Medium';
    let fluencyColor = 'text-amber-600';
    if (currentSentiment.toLowerCase() === 'positive') {
      fluency = 'High';
      fluencyColor = 'text-emerald-600';
    } else if (currentSentiment.toLowerCase() === 'negative') {
      fluency = 'Low';
      fluencyColor = 'text-rose-600';
    }

    // Calculate hesitation based on high priority concerns
    let hesitation = 'Low';
    let hesitationColor = 'text-emerald-600';
    if (highPriority > 2) {
      hesitation = 'High';
      hesitationColor = 'text-rose-600';
    } else if (highPriority > 0) {
      hesitation = 'Medium';
      hesitationColor = 'text-amber-600';
    }

    // Tech accuracy based on strength observations
    let techAccuracy = 'Calculating...';
    let techColor = 'text-indigo-600';
    if (total > 0) {
      const strengthRatio = priorityCounts.low / total;
      if (strengthRatio > 0.5) {
        techAccuracy = 'High';
        techColor = 'text-emerald-600';
      } else if (strengthRatio > 0.2) {
        techAccuracy = 'Medium';
        techColor = 'text-amber-600';
      } else {
        techAccuracy = 'Developing';
        techColor = 'text-rose-600';
      }
    }

    return { fluency, fluencyColor, hesitation, hesitationColor, techAccuracy, techColor };
  }, [aiObservations, priorityCounts, currentSentiment]);

  const [view, setView] = useState<'recruiter'>('recruiter'); // Fixed to recruiter view
  const [transcript, setTranscript] = useState(t('liveInterview.session.initializing'));

  // Generate observations when transcript or isLive changes
  useEffect(() => {
    if (!isLive || !transcript || transcript === t('liveInterview.session.initializing')) return;

    // Analyze transcript for topics and generate observations
    const words = transcript.toLowerCase().split(/\s+/);
    const detectedTopics: string[] = [];

    // Simple keyword-based topic detection
    const topicKeywords = [
      'react', 'node', 'python', 'java', 'golang', 'typescript',
      'aws', 'docker', 'kubernetes', 'microservices', 'api', 'database',
      'agile', 'scrum', 'team', 'lead', 'project', 'management'
    ];

    topicKeywords.forEach(keyword => {
      if (words.some(w => w.includes(keyword))) {
        detectedTopics.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    // Determine sentiment based on keywords
    let sentiment = 'Neutral';
    const positiveWords = ['good', 'great', 'excellent', 'strong', 'experienced', 'expert', 'successful'];
    const negativeWords = ['struggle', 'difficult', 'weak', 'lack', 'problem', 'issue'];

    if (positiveWords.some(w => transcript.toLowerCase().includes(w))) {
      sentiment = 'Positive';
    } else if (negativeWords.some(w => transcript.toLowerCase().includes(w))) {
      sentiment = 'Negative';
    }

    // Generate new observations
    if (detectedTopics.length > 0 || sentiment !== 'Neutral') {
      const newObservations = generateObservations(sentiment, detectedTopics, aiObservations);
      setAiObservations(newObservations);
    }
  }, [transcript, isLive, aiObservations]);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recruiterInput, setRecruiterInput] = useState("");
  const [jobQuestions, setJobQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestionIndexRef = useRef(0);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  // Per-question conversation log to track AI/candidate messages separately
  const [conversationLog, setConversationLog] = useState<Record<number, Array<{role: 'ai'|'candidate', text: string, timestamp: number}>>>({});
  // Full question data including expected answers
  const [jobQuestionsData, setJobQuestionsData] = useState<Array<{question: string, expectedAnswer?: string}>>([]);

  // Save per Question Flow State
  const [isRecordingQuestion, setIsRecordingQuestion] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [savedResponses, setSavedResponses] = useState<Record<number, { recordingPath: string; answerText: string }>>({});
  const questionRecorderRef = useRef<MediaRecorder | null>(null);
  const questionChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  // Per-question countdown timer
  const QUESTION_DURATION_SECONDS = 180; // 3 minutes per question
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_DURATION_SECONDS);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveTriggeredRef = useRef(false);

  // Effect to handle video stream attachment
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Real Data State
  const [interviews, setInterviews] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterview, setActiveInterview] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // URL Params for Auto-Schedule
  const [searchParams] = useSearchParams();
  const [prefillData, setPrefillData] = useState<{ candidateId?: string, jobId?: string }>({});

  useEffect(() => {
    const action = searchParams.get('action');
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');

    if (action === 'schedule' && candidateId && jobId) {
      setPrefillData({ candidateId, jobId });
      setShowScheduleModal(true);
    }
  }, [searchParams]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Session Management
  const [sessionId, setSessionId] = useState<string>(() => generateSessionId());
  const [browserCompat, setBrowserCompat] = useState<BrowserCompatibility | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const reconnectRef = useRef<AutoReconnect | null>(null);
  const networkMonitorRef = useRef<NetworkMonitor | null>(null);

  // Resume Session Modal State
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<InterviewSession | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    const compat = checkBrowserCompatibility();
    setBrowserCompat(compat);

    if (!compat.isCompatible) {
      console.error('Browser compatibility issues:', compat.missingFeatures);
    }

    if (compat.warnings.length > 0) {
      console.warn('Browser warnings:', compat.warnings);
    }
  }, []);

  // Setup network monitoring
  useEffect(() => {
    networkMonitorRef.current = new NetworkMonitor(
      () => {
        setNetworkStatus('online');
        // Attempt to reconnect if session was active
        if (isLive && !sessionRef.current) {
          handleReconnect();
        }
      },
      () => {
        setNetworkStatus('offline');
      }
    );

    return () => {
      networkMonitorRef.current?.cleanup();
    };
  }, [isLive]);

  // Load existing session on mount
  useEffect(() => {
    const existingSession = loadSession();
    if (existingSession && existingSession.status === 'active') {
      // Show resume session modal instead of window.confirm
      setPendingSession(existingSession);
      setShowResumeModal(true);
    }
  }, []);

  // Handle resume session decision
  const handleResumeSession = (resume: boolean) => {
    setShowResumeModal(false);

    if (resume && pendingSession) {
      setSessionId(pendingSession.sessionId);
      setTranscript(pendingSession.transcript.join('\n'));
      // Attempt to reconnect
      handleReconnect();
    } else {
      clearSession();
    }

    setPendingSession(null);
  };

  // Save session state periodically
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const session: InterviewSession = {
        sessionId,
        interviewId: activeInterview?.id,
        candidateId: activeInterview?.candidateId,
        jobId: activeInterview?.jobId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        status: 'active',
        transcript: transcript.split('\n'),
      };
      saveSession(session);
      updateSessionActivity(sessionId);
    }, 5000); // Save every 5 seconds

    return () => clearInterval(interval);
  }, [isLive, sessionId, activeInterview, transcript]);

  // Reconnection handler
  const handleReconnect = async () => {
    if (isReconnecting) return;

    setIsReconnecting(true);
    reconnectRef.current = new AutoReconnect(async () => {
      try {
        await initSession(activeInterview);
        return true;
      } catch (error) {
        console.error('Reconnection failed:', error);
        return false;
      }
    });

    const success = await reconnectRef.current.start();
    setIsReconnecting(false);

    if (!success) {
      addToast('error', t('common.error') || 'Critical: Reconnection failed');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [intvData, candData, jobsData] = await Promise.all([
          apiService.get<any[]>('/interviews'),
          apiService.get<any[]>('/candidates'),
          apiService.get<any[]>('/jobs')
        ]);
        // Unwrap data from response if wrapped in 'data' key
        const intv: any = intvData;
        const cand: any = candData;
        const job: any = jobsData;

        setInterviews(intv?.data || intv || []);
        setCandidates(cand?.data || cand || []);
        setJobs(job?.data || job || []);
      } catch (err) {
        console.error("Failed to fetch interview data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initSession = async (interview?: any) => {
    if (interview) setActiveInterview(interview);
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (!inputCtxRef.current) inputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

    try {
      // Request both audio and video with explicit quality constraints for STT sensitivity
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }, 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } 
      });
      setMicStream(stream);
      setVideoStream(stream);

      // Display video feed
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize MediaRecorder for session recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      let mappedQuestions: string[] = [];
      let questionsWithAnswers: Array<{question: string, expectedAnswer?: string}> = [];
      // Fetch job questions if interview is active
      if (activeInterview?.jobId) {
        try {
          const questionsData = await apiService.get<any>(`/jobs/${activeInterview.jobId}/questions`);
          // Unwrap if needed
          const questions = questionsData?.data || questionsData || [];
          if (Array.isArray(questions) && questions.length > 0) {
            mappedQuestions = questions.map((q: any) => q.question || q.text || String(q));
            questionsWithAnswers = questions.map((q: any) => ({
              question: q.question || q.text || String(q),
              expectedAnswer: q.expectedAnswer || q.expected_answer || ''
            }));
            setJobQuestions(mappedQuestions);
            setJobQuestionsData(questionsWithAnswers);
          }
        } catch (err) {
          console.warn('Failed to fetch job questions:', err);
        }
      }

      // Build system instruction with reference answers for evaluation
      const langDirective = interviewLang === 'id'
        ? 'You MUST speak, ask all questions, and provide all evaluations entirely in Bahasa Indonesia. Do NOT use English at all.'
        : 'You MUST speak, ask all questions, and provide all evaluations entirely in English. Do NOT use Indonesian at all.';

      let systemInstruction = `You are an expert AI Interviewer for RecruitAI. 
        Your tone is professional, encouraging, and highly technical. 
        Ask one question at a time. Do not provide answers. 
        Analyze the candidate's technical depth and communication skills.
        
        LANGUAGE DIRECTIVE: ${langDirective}
        
        IMPORTANT: After the candidate answers each question, internally evaluate their response 
        against the reference answer provided. Consider the key concepts they should mention.
        Send your evaluation as a message starting with [EVALUATION] prefix.`;

      if (questionsWithAnswers.length > 0) {
        systemInstruction += `\n\nYou must ask the following questions sequentially during the interview:`;
        questionsWithAnswers.forEach((q, i) => {
          systemInstruction += `\n${i + 1}. Question: ${q.question}`;
          if (q.expectedAnswer) {
            systemInstruction += `\n   Reference Answer (DO NOT reveal to candidate): ${q.expectedAnswer}`;
          }
        });
      }

      const sessionPromise = aiService.setupLiveInterview({
        systemInstruction,
        onopen: () => {
          setTranscript(t('liveInterview.session.analysisEnabled'));

          if (inputCtxRef.current) {
            const source = inputCtxRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputCtxRef.current.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (e) => {
              if (sessionRef.current && isLiveRef.current) {
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
              // This is an internal evaluation, store it but don't show to candidate
              const cleanText = text.replace("[EVALUATION]", "").trim();
              setQuestionAnswers(prev => ({
                ...prev,
                [currentQuestionIndexRef.current]: cleanText
              }));
            } else {
              // ACCUMULATE transcript instead of replacing
              setTranscript(prev => prev ? prev + '\n\n🤖 AI: ' + text : '🤖 AI: ' + text);
              // Track per-question conversation
              setConversationLog(prev => ({
                ...prev,
                [currentQuestionIndexRef.current]: [
                  ...(prev[currentQuestionIndexRef.current] || []),
                  { role: 'ai' as const, text, timestamp: Date.now() }
                ]
              }));
            }
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => {
              try { s.stop(); } catch (e) { }
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e: any) => {
          console.error("Session Error:", e);
          isLiveRef.current = false;
          setIsLive(false);
        }
      });

      sessionRef.current = await sessionPromise;
      setIsLive(true);
      isLiveRef.current = true;
    } catch (err) {
      console.error("Microphone Access Error:", err);
      addToast('error', (t('liveInterview.session.initializing') || 'Initializing...') + "\n\n" + (err as any).message);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const terminateSession = async () => {
    setIsLive(false);
    sessionRef.current?.close();
    sessionRef.current = null;
    
    // Build complete transcript from conversation logs per question
    let structuredTranscript = '';
    const questionIndices = Object.keys(conversationLog).map(Number).sort((a, b) => a - b);
    if (questionIndices.length > 0) {
      structuredTranscript = questionIndices.map(qIdx => {
        const qNum = qIdx + 1;
        const questionText = jobQuestions[qIdx] || `Question ${qNum}`;
        const convo = conversationLog[qIdx] || [];
        const convoText = convo.map(c =>
          `${c.role === 'ai' ? 'AI' : 'Candidate'}: ${c.text}`
        ).join('\n');
        return `--- Question ${qNum}: ${questionText} ---\n${convoText}`;
      }).join('\n\n');
    } else {
      structuredTranscript = transcript;
    }
    
    const finalTranscript = structuredTranscript + "\n\n[AI EVALUATION DATA]\n" + JSON.stringify(questionAnswers, null, 2);
    setTranscript("Session Terminated. Saving results...");
    setIsSaving(true);

    // Clear session storage
    clearSession();

    // Cancel any ongoing reconnection attempts
    reconnectRef.current?.cancel();

    // Stop recording and upload
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      // Wait a bit for final data
      await new Promise(resolve => setTimeout(resolve, 500));

      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

        // Upload to backend if we have a valid interview ID
        if (activeInterview?.id) {
          try {
            await apiService.finalizeInterview(activeInterview.id, finalTranscript, blob);
            addToast('success', t('common.success') || 'Interview saved successfully');
            navigate(`/interviews/${activeInterview.id}/results`);
          } catch (err) {
            console.error("Failed to save interview:", err);
            // Fallback to download if upload fails
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `interview_recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('warning', t('liveInterview.saveFailedLocalDownload') || "Failed to save to server. Recording downloaded locally instead.");
          }
        } else {
          // Local download for guest/test sessions
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `interview_recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        recordedChunksRef.current = [];
      }
    }

    setIsSaving(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }

    // Stop all media tracks
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }

    setActiveInterview(null);
    setJobQuestions([]);
  };

  // =====================================================
  // SAVE PER QUESTION FLOW FUNCTIONS
  // =====================================================

  // Start countdown timer for current question
  const startQuestionTimer = useCallback(() => {
    // Clear any existing timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    autoSaveTriggeredRef.current = false;
    setQuestionTimeLeft(QUESTION_DURATION_SECONDS);
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          if (questionTimerRef.current) clearInterval(questionTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Stop countdown timer
  const stopQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start recording for current question
  const startQuestionRecording = useCallback(async () => {
    if (!videoStream) return;

    try {
      questionChunksRef.current = [];
      const recorder = new MediaRecorder(videoStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          questionChunksRef.current.push(e.data);
        }
      };

      questionRecorderRef.current = recorder;
      recorder.start(1000);
      recordingStartTimeRef.current = Date.now();
      setIsRecordingQuestion(true);

      // Start the countdown timer alongside recording
      startQuestionTimer();

      // Start SpeechRecognition for candidate transcript
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e){}
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = interviewLang === 'id' ? 'id-ID' : 'en-US';
        
        let finalTranscriptStr = '';
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscriptStr += result[0].transcript + ' ';
              const finalPhrase = result[0].transcript.trim();
              
              if (finalPhrase) {
                // Append to conversation log
                setConversationLog(prev => ({
                  ...prev,
                  [currentQuestionIndexRef.current]: [
                    ...(prev[currentQuestionIndexRef.current] || []),
                    { role: 'candidate', text: finalPhrase, timestamp: Date.now() }
                  ]
                }));
                
                // Append to visible transcript
                setTranscript(prev => prev ? prev + '\n\n👤 Candidate: ' + finalPhrase : '👤 Candidate: ' + finalPhrase);
              }
            } else {
              interim += result[0].transcript;
            }
          }
        };
        
        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          // Auto-restart for recoverable errors
          if (['no-speech', 'network', 'aborted'].includes(e.error)) {
            setTimeout(() => {
              if (questionRecorderRef.current && questionRecorderRef.current.state === 'recording') {
                try { recognition.start(); } catch (err) { /* ignore */ }
              }
            }, 500);
          }
        };

        recognition.onend = () => {
          // Restart aggressively if still recording the question
          if (questionRecorderRef.current && questionRecorderRef.current.state === 'recording') {
            setTimeout(() => {
              if (questionRecorderRef.current && questionRecorderRef.current.state === 'recording') {
                try { 
                  recognition.start(); 
                } catch (e) {
                  // If restart fails, will try again on next onend
                  console.warn('STT Restart attempt pending...');
                }
              }
            }, 100); // Reduced delay for higher sensitivity
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.error('Failed to start question recording:', err);
    }
  }, [videoStream, startQuestionTimer]);

  // Stop recording for current question
  const stopQuestionRecording = useCallback(() => {
    if (questionRecorderRef.current && questionRecorderRef.current.state !== 'inactive') {
      questionRecorderRef.current.stop();
      setIsRecordingQuestion(false);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    stopQuestionTimer();
  }, [stopQuestionTimer]);

  // Emergency save to localStorage (for connection loss / tab close)
  const emergencySaveToLocal = useCallback(() => {
    if (!activeInterview?.id) return;
    try {
      const questionConvo = conversationLog[currentQuestionIndex] || [];
      const fullConversation = questionConvo
        .map(c => `${c.role === 'ai' ? 'AI' : 'Candidate'}: ${c.text}`)
        .join('\n\n');

      const pendingData = {
        interviewId: activeInterview.id,
        questionIndex: currentQuestionIndex,
        questionOrder: currentQuestionIndex + 1,
        questionText: jobQuestions[currentQuestionIndex] || '',
        answerText: questionAnswers[currentQuestionIndex] || fullConversation || transcript,
        conversationLog: conversationLog,
        savedAt: Date.now()
      };
      localStorage.setItem(
        `interview_backup_${activeInterview.id}`,
        JSON.stringify(pendingData)
      );
      console.log('[Emergency Save] Data backed up to localStorage');
    } catch (err) {
      console.error('[Emergency Save] Failed:', err);
    }
  }, [activeInterview, currentQuestionIndex, jobQuestions, questionAnswers, conversationLog, transcript]);

  // Retry pending saves from localStorage
  const retryPendingSaves = useCallback(async () => {
    if (!activeInterview?.id) return;
    const key = `interview_backup_${activeInterview.id}`;
    const backup = localStorage.getItem(key);
    if (!backup) return;

    try {
      const data = JSON.parse(backup);
      console.log('[Retry Save] Attempting to upload backed-up data for question', data.questionOrder);
      await apiService.saveQuestionResponse(data.interviewId, {
        questionText: data.questionText,
        questionOrder: data.questionOrder,
        answerText: data.answerText,
        sentimentScore: 0.5,
      });
      localStorage.removeItem(key);
      console.log('[Retry Save] Successfully uploaded backed-up data');
      addToast('success', 'Recovered and saved pending interview data.');
    } catch (err) {
      console.error('[Retry Save] Failed:', err);
    }
  }, [activeInterview]);

  // beforeunload + visibilitychange handlers for connection resilience
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLive && (questionChunksRef.current.length > 0 || isRecordingQuestion)) {
        emergencySaveToLocal();
        e.preventDefault();
        e.returnValue = 'Interview in progress. Are you sure you want to leave?';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isLive && isRecordingQuestion) {
        // Tab went to background — save current state as backup
        emergencySaveToLocal();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLive, isRecordingQuestion, emergencySaveToLocal]);

  // Retry pending saves when session starts
  useEffect(() => {
    if (isLive && activeInterview?.id) {
      retryPendingSaves();
    }
  }, [isLive, activeInterview?.id, retryPendingSaves]);

  // Save current question response (core save function)
  const saveCurrentQuestionResponse = useCallback(async () => {
    if (!activeInterview?.id || !jobQuestions[currentQuestionIndex]) return;

    setIsSavingQuestion(true);
    try {
      const recordingBlob = questionChunksRef.current.length > 0
        ? new Blob(questionChunksRef.current, { type: 'video/webm' })
        : undefined;

      const recordingDuration = recordingBlob
        ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        : 0;

      // Build answer text from conversation log (candidate responses) or evaluation
      const questionConvo = conversationLog[currentQuestionIndex] || [];
      const candidateTexts = questionConvo
        .filter(c => c.role === 'candidate')
        .map(c => c.text);
      const fullConversation = questionConvo
        .map(c => `${c.role === 'ai' ? '🤖 AI' : '👤 Candidate'}: ${c.text}`)
        .join('\n\n');
      
      // Use evaluation > candidate answers > full conversation > transcript as fallback
      const answerText = questionAnswers[currentQuestionIndex] 
        || (candidateTexts.length > 0 ? candidateTexts.join('\n') : '')
        || fullConversation 
        || transcript;

      await apiService.saveQuestionResponse(activeInterview.id, {
        questionText: jobQuestions[currentQuestionIndex],
        questionOrder: currentQuestionIndex + 1,
        answerText,
        recordingBlob,
        recordingDuration,
        sentimentScore: currentSentiment !== 'Analyzing...' ?
          sentimentToScore(currentSentiment) : 0.5,
      });

      setSavedResponses(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          recordingPath: `saved_q${currentQuestionIndex + 1}`,
          answerText
        }
      }));

      // Clear chunks and remove localStorage backup after successful save
      questionChunksRef.current = [];
      localStorage.removeItem(`interview_backup_${activeInterview.id}`);

    } catch (err) {
      console.error('Failed to save question response:', err);
      // On failure, save to localStorage as backup
      emergencySaveToLocal();
      addToast('error', t('interview.saveResultFailed') || 'Failed to save response. Data backed up locally.');
    } finally {
      setIsSavingQuestion(false);
    }
  }, [activeInterview, jobQuestions, currentQuestionIndex, questionAnswers, transcript, conversationLog, emergencySaveToLocal, t]);

  // Unified handleSaveAndNext: stop recording → save → move to next question → start recording
  const handleSaveAndNext = useCallback(async () => {
    if (isSavingQuestion) return; // Prevent double-trigger

    // 1. Stop recording + timer
    stopQuestionRecording();

    // 2. Save current question
    await saveCurrentQuestionResponse();

    // 3. Move to next question or finish
    if (currentQuestionIndex < jobQuestions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setTranscript('');

      // 4. Tell AI to transition to next question
      if (sessionRef.current) {
        sessionRef.current.send({
          text: `[SYSTEM] The recruiter has moved to the next question: "${jobQuestions[nextIdx]}". Please transition to this topic.`
        });
      }

      // 5. Auto-start recording for next question (slight delay for state update)
      setTimeout(() => {
        startQuestionRecording();
      }, 500);
    } else {
      // All questions done
      addToast('success', t('interview.successTitle') || 'Interview Complete — All questions answered!');
    }
  }, [isSavingQuestion, stopQuestionRecording, saveCurrentQuestionResponse, currentQuestionIndex, jobQuestions, startQuestionRecording, t]);

  // Auto-save when timer expires
  useEffect(() => {
    if (questionTimeLeft === 0 && isRecordingQuestion && isLive && !autoSaveTriggeredRef.current) {
      autoSaveTriggeredRef.current = true;
      console.log('[Timer] Question time expired — auto-saving...');
      addToast('warning', 'Time is up! Auto-saving response...');
      handleSaveAndNext();
    }
  }, [questionTimeLeft, isRecordingQuestion, isLive, handleSaveAndNext]);

  // Auto-start recording when session goes live and questions are loaded
  useEffect(() => {
    if (isLive && jobQuestions.length > 0 && videoStream && !isRecordingQuestion && !isSavingQuestion) {
      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        if (!isRecordingQuestion && isLive) {
          startQuestionRecording();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLive, jobQuestions.length, videoStream]); // intentionally minimal deps to avoid re-triggering

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, []);

  // Retake current question
  const retakeQuestion = useCallback(async () => {
    if (!activeInterview?.id) return;

    try {
      // Delete existing response
      await apiService.deleteQuestionResponse(activeInterview.id, currentQuestionIndex + 1);

      // Clear local state
      setSavedResponses(prev => {
        const updated = { ...prev };
        delete updated[currentQuestionIndex];
        return updated;
      });
      setQuestionAnswers(prev => ({ ...prev, [currentQuestionIndex]: '' }));
      setTranscript('');
      questionChunksRef.current = [];

      // Start new recording
      startQuestionRecording();
    } catch (err) {
      console.error('Failed to retake question:', err);
    }
  }, [activeInterview, currentQuestionIndex, startQuestionRecording]);

  // Load existing responses when interview starts
  useEffect(() => {
    const loadResponses = async () => {
      if (activeInterview?.id) {
        try {
          const response = await apiService.getInterviewResponses(activeInterview.id);
          const responses = response?.data || [];
          const responseMap: Record<number, { recordingPath: string; answerText: string }> = {};
          responses.forEach((r: any) => {
            responseMap[r.questionOrder - 1] = {
              recordingPath: r.recordingPath,
              answerText: r.answerText
            };
          });
          setSavedResponses(responseMap);
        } catch (err) {
          console.warn('Could not load existing responses:', err);
        }
      }
    };
    loadResponses();
  }, [activeInterview?.id]);

  const handleScheduleInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      candidateId: parseInt(formData.get('candidateId') as string),
      jobId: parseInt(formData.get('jobId') as string),
      interviewType: formData.get('type'),
      scheduledAt: new Date(formData.get('date') as string + 'T' + formData.get('time') as string).toISOString(),
      interviewer: formData.get('interviewer'),
      status: 'scheduled'
    };

    try {
      await apiService.post('/interviews', payload);
      const updated = await apiService.get<any[]>('/interviews');
      setInterviews(updated || []);
      setShowScheduleModal(false);
      addToast('success', t('notifications.interviewScheduled') || 'Interview scheduled');
    } catch (err) {
      addToast('error', t('interviewSchedule.saveFailed') || "Failed to schedule interview");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('liveInterview.session.initializing')}</p>
      </div>
    );
  }

  // Recruiter Dashboard View
  if (view === 'recruiter' && !isLive) {
    return (
      <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900">{t('liveInterview.title')}</h1>
            <p className="text-slate-500 mt-2">{t('liveInterview.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.open('/#/live/TEST_TOKEN', '_blank')}
              className="px-6 py-4 bg-white text-indigo-600 font-bold rounded-2xl border border-indigo-100 hover:bg-indigo-50 shadow-xl shadow-indigo-100/50 flex items-center gap-2 transition-all active:scale-95"
            >
              <User size={20} /> {t('liveInterview.testCandidate')}
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={20} /> {t('liveInterview.schedule')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder={t('liveInterview.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm" />
              </div>
              <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center gap-2">
                <Filter size={18} /> {t('liveInterview.filters')}
              </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('liveInterview.table.candidate')}</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('liveInterview.table.job')}</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('liveInterview.table.schedule')}</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('liveInterview.table.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {interviews.map((intv) => (
                    <tr key={intv.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{intv.candidateName}</p>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {intv.interviewType}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-slate-600 font-medium">{intv.jobTitle}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-xs font-bold">{new Date(intv.scheduledAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                          <Clock size={12} />
                          <span className="text-[10px] font-medium">{new Date(intv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {intv.status === 'completed' ? (
                            <button
                              onClick={() => navigate(`/interviews/${intv.id}/results`)}
                              className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest flex items-center gap-2"
                            >
                              <FileText size={14} /> {t('liveInterview.table.viewResults')}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const url = `${window.location.origin}/#/live/${intv.id}`;
                                  navigator.clipboard.writeText(url);
                                  addToast('success', (t('liveInterview.table.copyLink') || 'Link copied') + "!");
                                }}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-2"
                                title={t('liveInterview.table.copyLink')}
                              >
                                <Monitor size={14} /> {t('liveInterview.table.copyLink')}
                              </button>
                              <button
                                onClick={() => initSession(intv)}
                                className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 uppercase tracking-widest"
                              >
                                {t('liveInterview.table.joinSession')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {interviews.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Calendar size={48} className="opacity-20" />
                          <p className="font-black uppercase tracking-[0.2em] text-xs">{t('liveInterview.table.noInterviews')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-900 mb-6 flex items-center justify-between">
                {t('liveInterview.vitals.title')}
                <Activity size={20} className="text-indigo-600" />
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('liveInterview.vitals.completedToday')}</p>
                    <p className="text-xl font-black text-slate-900">
                      {interviews.filter(i => i.status === 'completed' && new Date(i.scheduledAt).toDateString() === new Date().toDateString()).length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('liveInterview.vitals.pendingActions')}</p>
                    <p className="text-xl font-black text-slate-900">
                      {interviews.filter(i => i.status !== 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-600/20">
              <h3 className="font-black mb-4">{t('liveInterview.proTip.title')}</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                {t('liveInterview.proTip.content')}
              </p>
            </div>
          </div>
        </div>

        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10">
                <h2 className="text-2xl font-black text-slate-900 mb-2">{t('liveInterview.modal.title')}</h2>
                <p className="text-slate-500 text-sm mb-8">{t('liveInterview.modal.subtitle')}</p>

                <form onSubmit={handleScheduleInterview} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('liveInterview.modal.candidate')}</label>
                    <select
                      name="candidateId"
                      required
                      defaultValue={prefillData.candidateId || ""}
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">{t('liveInterview.modal.selectCandidate')}</option>
                      {candidates.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('liveInterview.modal.job')}</label>
                    <select
                      name="jobId"
                      required
                      defaultValue={prefillData.jobId || ""}
                      className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">{t('liveInterview.modal.selectJob')}</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('liveInterview.modal.date')}</label>
                      <input type="date" name="date" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('liveInterview.modal.time')}</label>
                      <input type="time" name="time" required className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('liveInterview.modal.interviewer')}</label>
                      <input type="text" name="interviewer" placeholder="RecruitAI Agent" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('liveInterview.modal.type')}</label>
                      <select name="type" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-indigo-500 transition-all appearance-none cursor-pointer">
                        <option value="Technical">{t('interviewSchedule.technical')}</option>
                        <option value="Behavioral">{t('interviewSchedule.behavioral')}</option>
                        <option value="Culture Fit">{t('interviewSchedule.cultureFit')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setShowScheduleModal(false)} type="button" className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">{t('common.cancel')}</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">{t('liveInterview.modal.schedule')}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Interview Session View (Existing)
  return (
    <div className={`h-full flex flex-col gap-6 animate-in zoom-in-95 duration-500`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{t('liveInterview.session.control')}</h2>
          {isLive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full border border-rose-200 animate-pulse">
              <div className="size-2 bg-rose-500 rounded-full"></div>
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">{t('liveInterview.session.live')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Interview Language Selector */}
          {!isLive && (
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('interview.selectLanguage')}</span>
              <select
                value={interviewLang}
                onChange={(e) => setInterviewLang(e.target.value as 'id' | 'en')}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="id">🇮🇩 {t('interview.langId')}</option>
                <option value="en">🇬🇧 {t('interview.langEn')}</option>
              </select>
            </div>
          )}

          <button
            onClick={isLive ? terminateSession : () => initSession()}
            disabled={isSaving}
            className={`px-8 py-4 ${isLive ? 'bg-rose-600' : 'bg-indigo-600'} text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : (isLive ? <MicOff size={20} /> : <Mic size={20} />)}
            {isSaving ? t('liveInterview.session.saving') : (isLive ? t('liveInterview.session.stop') : t('liveInterview.session.start'))}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        <div className="flex-1 bg-slate-900 rounded-[50px] overflow-hidden relative shadow-2xl border-8 border-slate-800/50 flex flex-col">
          {/* Video Feed Display */}
          {videoStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video
            />
          ) : (
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1280" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity" alt="" />
          )}

          <div className="absolute top-10 left-10 glass p-6 rounded-[32px] flex items-center gap-4 border border-white/10 z-10">
            <BrainCircuit size={32} className="text-indigo-400" />
            <div>
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{t('liveInterview.session.secureEngine')}</p>
              <h4 className="text-white font-bold">{isLive ? t('liveInterview.session.analysisEnabled') : t('liveInterview.session.readyToStart')}</h4>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-20 text-center space-y-12">
            {isLive && (
              <div className="size-64 rounded-full border-4 border-indigo-500/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-20"></div>
                <div className="size-48 bg-indigo-600/20 rounded-full backdrop-blur-3xl border border-white/10 flex items-center justify-center">
                  <Zap size={64} className="text-indigo-400 animate-pulse" />
                </div>
              </div>
            )}

            <div className="w-full max-w-2xl space-y-6">
              <AudioVisualizer stream={micStream} isActive={isLive} color="#818cf8" />
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>
              <p className="text-2xl font-medium text-slate-300 leading-relaxed italic">
                {isLive ? `"${transcript}"` : t('liveInterview.session.readyToStart')}
              </p>
            </div>
          </div>

          <div className="p-10 bg-slate-950/50 border-t border-white/5 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                <User size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{t('liveInterview.session.candidateProfile')}</p>
                <p className="text-white font-bold text-sm">
                  {activeInterview ? activeInterview.candidateName : 'Sarah Jenkins'}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">{t('liveInterview.session.signalStrength')}</p>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* RECRUITER VIEW (Normal Mode) */}
        {view === 'recruiter' && (
          <div className="w-[400px] flex flex-col gap-6">
            <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-xl flex-1 flex flex-col">
              <h3 className="text-lg font-black mb-8 flex items-center gap-3 text-slate-900">
                <Monitor className="text-indigo-600" size={24} /> Recruiter Intelligence
              </h3>
              <div className="space-y-6 flex-1">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('liveInterview.vitals.title')}</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('liveInterview.session.fluency')}</span>
                      <span className={`text-xs font-black ${candidateVitals.fluencyColor}`}>{candidateVitals.fluency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('liveInterview.session.hesitation')}</span>
                      <span className={`text-xs font-black ${candidateVitals.hesitationColor}`}>{candidateVitals.hesitation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('liveInterview.session.techAccuracy')}</span>
                      <span className={`text-xs font-black ${candidateVitals.techColor}`}>{candidateVitals.techAccuracy}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      {t('assessment.question')} {currentQuestionIndex + 1} of {jobQuestions.length}
                    </p>
                    <div className="flex gap-1">
                      {jobQuestions.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-all ${savedResponses[idx] ? 'bg-emerald-500' :
                            idx === currentQuestionIndex ? 'bg-indigo-600 scale-125' :
                              idx < currentQuestionIndex ? 'bg-emerald-400' : 'bg-slate-200'
                            }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Per-Question Countdown Timer */}
                  {isRecordingQuestion && (
                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                      questionTimeLeft <= 30 
                        ? 'bg-rose-50 border-rose-200' 
                        : questionTimeLeft <= 60 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className={questionTimeLeft <= 30 ? 'text-rose-500' : questionTimeLeft <= 60 ? 'text-amber-500' : 'text-emerald-500'} />
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          questionTimeLeft <= 30 ? 'text-rose-600' : questionTimeLeft <= 60 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {questionTimeLeft <= 30 ? 'Time Almost Up!' : 'Time Remaining'}
                        </span>
                      </div>
                      <span className={`text-lg font-black tabular-nums ${
                        questionTimeLeft <= 30 ? 'text-rose-700 animate-pulse' : questionTimeLeft <= 60 ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {formatTime(questionTimeLeft)}
                      </span>
                    </div>
                  )}

                  {jobQuestions.length > 0 ? (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300" key={currentQuestionIndex}>
                      <h4 className="text-sm font-bold text-slate-800 leading-relaxed">
                        {jobQuestions[currentQuestionIndex]}
                      </h4>

                      {/* Recording Status — auto-managed */}
                      {isRecordingQuestion ? (
                        <div className="flex items-center gap-3 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100 w-full overflow-hidden">
                          <div className="flex items-center gap-2 min-w-max">
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                            <span className="text-rose-600 text-[10px] font-black uppercase tracking-wider">
                              {t('interview.recording') || 'Live'}
                            </span>
                          </div>
                          
                          {/* Real-time Volume Sensitivity Feedback */}
                          <div className="flex-1 border-l border-rose-200 pl-3">
                            <VolumeMeter stream={micStream} isRecording={isRecordingQuestion} />
                          </div>
                          
                          <span className="text-rose-400 text-[9px] font-bold ml-auto tabular-nums">100% Secure</span>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {!savedResponses[currentQuestionIndex] && (
                            <button
                              onClick={startQuestionRecording}
                              disabled={!videoStream || isSavingQuestion}
                              className="flex-1 px-4 py-2.5 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Video size={14} /> {t('interview.startRecording')}
                            </button>
                          )}
                          {savedResponses[currentQuestionIndex] && (
                            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                              <CheckCircle2 size={14} /> Saved ✓
                            </div>
                          )}
                          {savedResponses[currentQuestionIndex] && (
                            <button
                              onClick={retakeQuestion}
                              disabled={isSavingQuestion}
                              className="px-4 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                              <RotateCcw size={14} /> {t('interview.rerecord')}
                            </button>
                          )}
                        </div>
                      )}

                      <textarea
                        value={questionAnswers[currentQuestionIndex] || ''}
                        onChange={(e) => setQuestionAnswers(prev => ({
                          ...prev,
                          [currentQuestionIndex]: e.target.value
                        }))}
                        placeholder="Take notes on the candidate's answer..."
                        className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-2xl text-xs font-medium resize-none focus:ring-2 ring-indigo-500 transition-all min-h-[80px]"
                      />

                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('common.previous')}
                        </button>

                        <button
                          onClick={handleSaveAndNext}
                          disabled={isSavingQuestion}
                          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {currentQuestionIndex < jobQuestions.length - 1 ? (
                            <>{isSavingQuestion ? t('interview.saving') : t('interview.saveAndNext')} <ChevronRight size={14} /></>
                          ) : (
                            <>{isSavingQuestion ? t('interview.saving') : t('interview.submitFinish')} <CheckCircle2 size={14} /></>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400 italic">{t('liveInterview.table.noInterviews')}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('liveInterview.session.aiObservations') || 'AI Observations'}</p>
                    {/* Priority Filter Tabs */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setObservationFilter('all')}
                        className={`px-2 py-1 text-[8px] font-bold rounded-full transition-all ${observationFilter === 'all'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          }`}
                      >
                        All ({aiObservations.length})
                      </button>
                      <button
                        onClick={() => setObservationFilter('high')}
                        className={`px-2 py-1 text-[8px] font-bold rounded-full transition-all flex items-center gap-1 ${observationFilter === 'high'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                          }`}
                      >
                        <AlertTriangle size={8} /> {priorityCounts.high}
                      </button>
                      <button
                        onClick={() => setObservationFilter('medium')}
                        className={`px-2 py-1 text-[8px] font-bold rounded-full transition-all flex items-center gap-1 ${observationFilter === 'medium'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          }`}
                      >
                        <Info size={8} /> {priorityCounts.medium}
                      </button>
                      <button
                        onClick={() => setObservationFilter('low')}
                        className={`px-2 py-1 text-[8px] font-bold rounded-full transition-all flex items-center gap-1 ${observationFilter === 'low'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          }`}
                      >
                        <CheckCircle size={8} /> {priorityCounts.low}
                      </button>
                    </div>
                  </div>

                  {/* Observations List with Priority Indicators */}
                  <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredObservations.length > 0 ? (
                      filteredObservations.map((obs) => {
                        const style = getPriorityStyle(obs.priority);
                        return (
                          <li
                            key={obs.id}
                            className={`text-[10px] font-bold flex items-start gap-2 p-2 rounded-lg ${style.bg} border ${style.border}`}
                          >
                            {style.icon}
                            <span className={style.text}>{obs.description}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                        <Activity size={12} className="text-slate-400" /> {t('liveInterview.session.analyzingTopics') || 'Analyzing conversation topics...'}
                      </li>
                    )}
                  </ul>
                </div>

                {/* Recruiter Question Injection */}
                {isLive && (
                  <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Inject Question</p>
                    <div className="space-y-3">
                      <textarea
                        value={recruiterInput}
                        onChange={(e) => setRecruiterInput(e.target.value)}
                        placeholder={t('liveInterview.session.injectPlaceholder')}
                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-2xl text-xs font-medium resize-none focus:ring-2 ring-amber-500 transition-all"
                        rows={3}
                      />
                      <button
                        onClick={() => {
                          if (recruiterInput.trim() && sessionRef.current) {
                            sessionRef.current.send({ text: `[RECRUITER INSTRUCTION] Please ask the candidate: ${recruiterInput}` });
                            setRecruiterInput("");
                          }
                        }}
                        disabled={!recruiterInput.trim()}
                        className="w-full py-3 bg-amber-600 text-white font-black rounded-2xl text-xs shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('liveInterview.session.sendToAI')}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mt-auto">
                  <button
                    onClick={() => {
                      // Generate final recommendation based on all question responses
                      const allAnswers = Object.values(questionAnswers).join('\n');
                      const recommendation = `Based on the interview responses, the candidate demonstrated ${currentSentiment.toLowerCase()} communication skills. Key topics discussed: ${currentTopics.join(', ') || 'various technical topics'}.`;
                      addToast('info', recommendation);
                      navigate(`/interviews/${activeInterview?.id}/results`, { state: { recommendation } });
                    }}
                    className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl text-sm shadow-xl shadow-indigo-600/20 flex justify-between px-8 items-center hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    {t('liveInterview.session.finalRec')} <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={terminateSession}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl text-sm transition-all flex justify-between px-8 items-center border border-slate-800"
                  >
                    {t('liveInterview.session.endSession')} <Mic size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resume Session Modal */}
      {showResumeModal && pendingSession && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{t('liveInterview.resume.title')}</h2>
                  <p className="text-slate-500 text-sm">{t('liveInterview.resume.subtitle')}</p>
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                {t('liveInterview.resume.content').replace('{{time}}', pendingSession.startTime ? new Date(pendingSession.startTime).toLocaleString() : 'earlier')}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleResumeSession(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  {t('liveInterview.resume.fresh')}
                </button>
                <button
                  onClick={() => handleResumeSession(true)}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {t('liveInterview.resume.resume')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveInterview;
