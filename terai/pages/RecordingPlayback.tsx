import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Video, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Download, Clock, User, MessageSquare, BrainCircuit, ChevronLeft,
    Loader2, Settings, Maximize, Minimize, ThumbsUp, AlertCircle,
    Lightbulb, FileText, Share2, Trash2, Bookmark
} from 'lucide-react';
import { recordingService, RecordingMetadata, TranscriptSegment, AIAnalysis } from '../services/recording.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const RecordingPlayback: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { addToast } = useToast();

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recording, setRecording] = useState<RecordingMetadata | null>(null);
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState<'transcript' | 'analysis'>('transcript');
    const [selectedHighlight, setSelectedHighlight] = useState<number | null>(null);

    useEffect(() => {
        loadRecording();
    }, [id]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleEnded = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, [recording]);

    const loadRecording = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [recordingData, transcriptData, analysisData] = await Promise.all([
                recordingService.getRecording(id),
                recordingService.getTranscript(id),
                recordingService.getAIAnalysis(id)
            ]);
            setRecording(recordingData);
            setTranscript(transcriptData);
            setAnalysis(analysisData);
        } catch (error) {
            addToast('error', 'Failed to load recording');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (time: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = time;
        setCurrentTime(time);
    };

    const skipTime = (seconds: number) => {
        handleSeek(Math.max(0, Math.min(duration, currentTime + seconds)));
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (newVolume: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const changePlaybackRate = () => {
        const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];
        if (videoRef.current) {
            videoRef.current.playbackRate = nextRate;
        }
        setPlaybackRate(nextRate);
    };

    const toggleFullscreen = () => {
        const container = videoRef.current?.parentElement;
        if (!container) return;

        if (!isFullscreen) {
            container.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const jumpToTranscript = (timestamp: number) => {
        handleSeek(timestamp);
        if (!isPlaying) {
            togglePlay();
        }
    };

    const downloadRecording = () => {
        if (recording) {
            recordingService.downloadRecording(recording);
            addToast('success', 'Download started');
        }
    };

    const deleteRecording = async () => {
        if (!recording || !confirm('Are you sure you want to delete this recording?')) return;
        try {
            await recordingService.deleteRecording(recording.id);
            addToast('success', 'Recording deleted');
            navigate(-1);
        } catch (error) {
            addToast('error', 'Failed to delete recording');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={48} className="text-brand-600 animate-spin" />
                <p className="font-bold text-slate-600 dark:text-slate-400">Loading recording...</p>
            </div>
        );
    }

    if (!recording) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Video size={48} className="text-slate-700 dark:text-slate-300" />
                <p className="font-bold text-slate-600 dark:text-slate-400">Recording not found</p>
            </div>
        );
    }

    return (
        <div className="mx-auto py-6 space-y-6 animate-in fade-in duration-500">
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
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{recording.candidateName}</h1>
                        <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300 mt-1">
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatTime(recording.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Video size={14} />
                                {recording.type === 'video' ? 'Video Interview' : 'Audio Interview'}
                            </span>
                            <span>{new Date(recording.startTime).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadRecording}
                        className="px-4 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Download size={18} />
                        Download
                    </button>
                    <button
                        onClick={deleteRecording}
                        className="px-4 py-2 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/30 rounded-xl font-medium text-danger-600 dark:text-danger-500 hover:bg-danger-100 dark:hover:bg-danger-500/20 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
                        {/* Video Element */}
                        <div className="relative aspect-video bg-slate-50 dark:bg-slate-900">
                            {recording.playbackUrl ? (
                                <video
                                    ref={videoRef}
                                    src={recording.playbackUrl}
                                    className="w-full h-full object-contain"
                                    poster={recording.thumbnailUrl}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-slate-900 dark:text-white">
                                        <Video size={64} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-slate-600 dark:text-slate-400">Video preview not available</p>
                                    </div>
                                </div>
                            )}

                            {/* Play Overlay */}
                            {!isPlaying && (
                                <button
                                    onClick={togglePlay}
                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-all"
                                >
                                    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-full">
                                        <Play size={48} className="text-slate-900 dark:text-white ml-1" fill="white" />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                            {/* Progress Bar */}
                            <div className="mb-4">
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:rounded-full"
                                />
                                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-1">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => skipTime(-10)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                    >
                                        <SkipBack size={20} />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        className="p-3 bg-brand-600 hover:bg-brand-700 rounded-xl transition-all"
                                    >
                                        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                                    </button>
                                    <button
                                        onClick={() => skipTime(10)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                    >
                                        <SkipForward size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Volume */}
                                    <div className="flex items-center gap-2">
                                        <button onClick={toggleMute} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                        </button>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            value={isMuted ? 0 : volume}
                                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                            className="w-20 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Playback Rate */}
                                    <button
                                        onClick={changePlaybackRate}
                                        className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                                    >
                                        {playbackRate}x
                                    </button>

                                    {/* Fullscreen */}
                                    <button
                                        onClick={toggleFullscreen}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                    >
                                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis Summary */}
                    {analysis && (
                        <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl border border-brand-100 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-brand-100 rounded-xl">
                                    <BrainCircuit size={20} className="text-brand-600" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">AI Analysis Summary</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-white dark:bg-neutral-900 rounded-xl">
                                    <p className="text-2xl font-black text-brand-600">{analysis.overallScore}%</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Overall</p>
                                </div>
                                <div className="text-center p-3 bg-white dark:bg-neutral-900 rounded-xl">
                                    <p className="text-2xl font-black text-emerald-600">{analysis.communicationScore}%</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Communication</p>
                                </div>
                                <div className="text-center p-3 bg-white dark:bg-neutral-900 rounded-xl">
                                    <p className="text-2xl font-black text-purple-600">{analysis.technicalScore}%</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Technical</p>
                                </div>
                                <div className="text-center p-3 bg-white dark:bg-neutral-900 rounded-xl">
                                    <p className="text-2xl font-black text-amber-600">{analysis.sentimentScore}%</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Sentiment</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Tab Selection */}
                    <div className="bg-white dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800 inline-flex w-full">
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'transcript'
                                ? 'bg-brand-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            <MessageSquare size={16} />
                            Transcript
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'analysis'
                                ? 'bg-brand-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            <BrainCircuit size={16} />
                            Analysis
                        </button>
                    </div>

                    {/* Transcript Tab */}
                    {activeTab === 'transcript' && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
                                <h3 className="font-bold text-slate-900 dark:text-white">Interview Transcript</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Click any segment to jump to that moment</p>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {transcript.map((segment) => (
                                    <button
                                        key={segment.id}
                                        onClick={() => jumpToTranscript(segment.timestamp)}
                                        className={`w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-all ${currentTime >= segment.timestamp && currentTime < segment.timestamp + segment.duration
                                            ? 'bg-brand-50 border-l-4 border-l-brand-500'
                                            : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 w-12 shrink-0">
                                                {formatTime(segment.timestamp)}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${segment.speaker === 'interviewer'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : segment.speaker === 'ai'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {segment.speaker === 'interviewer' ? 'Interviewer' : segment.speaker === 'ai' ? 'AI' : 'Candidate'}
                                                    </span>
                                                    {segment.sentiment && (
                                                        <span className={`text-xs ${segment.sentiment === 'positive' ? 'text-emerald-500' :
                                                            segment.sentiment === 'negative' ? 'text-danger-500' : 'text-slate-600 dark:text-slate-400'
                                                            }`}>
                                                            {segment.sentiment === 'positive' ? '😊' : segment.sentiment === 'negative' ? '😟' : '😐'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">{segment.text}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Analysis Tab */}
                    {activeTab === 'analysis' && analysis && (
                        <div className="space-y-4">
                            {/* Keywords */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Keywords Detected</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.map((keyword, i) => (
                                        <span key={i} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Topics */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Topics Covered</h3>
                                <div className="space-y-2">
                                    {analysis.topics.map((topic, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                                            {topic}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Highlights */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Key Highlights</h3>
                                <div className="space-y-3">
                                    {analysis.highlights.map((highlight, i) => (
                                        <button
                                            key={i}
                                            onClick={() => jumpToTranscript(highlight.timestamp)}
                                            className={`w-full p-3 rounded-xl text-left transition-all ${highlight.type === 'strength'
                                                ? 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100'
                                                : highlight.type === 'concern'
                                                    ? 'bg-amber-50 border border-amber-100 hover:bg-amber-100'
                                                    : 'bg-slate-50 border border-slate-100 dark:border-neutral-800 hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                {highlight.type === 'strength' ? (
                                                    <ThumbsUp size={14} className="text-emerald-600" />
                                                ) : highlight.type === 'concern' ? (
                                                    <AlertCircle size={14} className="text-amber-600" />
                                                ) : (
                                                    <Bookmark size={14} className="text-brand-600" />
                                                )}
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {formatTime(highlight.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{highlight.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Lightbulb size={16} className="text-amber-500" />
                                    Recommendations
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, i) => (
                                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                            <span className="text-brand-500 mt-1">•</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecordingPlayback;
