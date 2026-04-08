// Interview Session Utilities
// Handles session persistence, recovery, and browser compatibility

export interface InterviewSession {
    sessionId: string;
    interviewId?: number;
    candidateId?: number;
    jobId?: number;
    startTime: number;
    lastActivity: number;
    status: 'active' | 'paused' | 'disconnected';
    transcript: string[];
    audioChunks?: number;
}

const SESSION_STORAGE_KEY = 'live_interview_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Save interview session to localStorage
 */
export function saveSession(session: InterviewSession): void {
    try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
        console.error('Failed to save session:', error);
    }
}

/**
 * Load interview session from localStorage
 */
export function loadSession(): InterviewSession | null {
    try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) return null;

        const session: InterviewSession = JSON.parse(stored);

        // Check if session is still valid (not expired)
        const now = Date.now();
        if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
            clearSession();
            return null;
        }

        return session;
    } catch (error) {
        console.error('Failed to load session:', error);
        return null;
    }
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(sessionId: string): void {
    const session = loadSession();
    if (session && session.sessionId === sessionId) {
        session.lastActivity = Date.now();
        saveSession(session);
    }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check browser compatibility for live interview features
 */
export interface BrowserCompatibility {
    isCompatible: boolean;
    missingFeatures: string[];
    warnings: string[];
}

export function checkBrowserCompatibility(): BrowserCompatibility {
    const missingFeatures: string[] = [];
    const warnings: string[] = [];

    // Check for getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        missingFeatures.push('Camera/Microphone access (getUserMedia)');
    }

    // Check for MediaRecorder
    if (typeof MediaRecorder === 'undefined') {
        missingFeatures.push('Media recording (MediaRecorder)');
    }

    // Check for AudioContext
    if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        missingFeatures.push('Audio processing (AudioContext)');
    }

    // Check for localStorage
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
    } catch (e) {
        warnings.push('Local storage is disabled - session recovery unavailable');
    }

    // Check for WebRTC
    if (typeof RTCPeerConnection === 'undefined') {
        warnings.push('WebRTC not fully supported - some features may be limited');
    }

    // Check for supported codecs
    if (typeof MediaRecorder !== 'undefined') {
        const supportedTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
        ];

        const hasSupport = supportedTypes.some(type => MediaRecorder.isTypeSupported(type));
        if (!hasSupport) {
            warnings.push('Preferred video codecs not supported - recording quality may vary');
        }
    }

    return {
        isCompatible: missingFeatures.length === 0,
        missingFeatures,
        warnings,
    };
}

/**
 * Auto-reconnect utility with exponential backoff
 */
export class AutoReconnect {
    private attempts = 0;
    private maxAttempts = 5;
    private baseDelay = 1000; // 1 second
    private maxDelay = 30000; // 30 seconds
    private reconnectCallback: () => Promise<boolean>;
    private timeoutId: number | null = null;

    constructor(reconnectCallback: () => Promise<boolean>, maxAttempts = 5) {
        this.reconnectCallback = reconnectCallback;
        this.maxAttempts = maxAttempts;
    }

    /**
     * Start reconnection attempts
     */
    async start(): Promise<boolean> {
        if (this.attempts >= this.maxAttempts) {
            console.error('Max reconnection attempts reached');
            return false;
        }

        this.attempts++;
        const delay = Math.min(this.baseDelay * Math.pow(2, this.attempts - 1), this.maxDelay);

        console.log(`Reconnection attempt ${this.attempts}/${this.maxAttempts} in ${delay}ms...`);

        return new Promise((resolve) => {
            this.timeoutId = window.setTimeout(async () => {
                try {
                    const success = await this.reconnectCallback();
                    if (success) {
                        console.log('Reconnection successful');
                        this.reset();
                        resolve(true);
                    } else {
                        // Try again
                        const result = await this.start();
                        resolve(result);
                    }
                } catch (error) {
                    console.error('Reconnection failed:', error);
                    const result = await this.start();
                    resolve(result);
                }
            }, delay);
        });
    }

    /**
     * Cancel ongoing reconnection attempts
     */
    cancel(): void {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.attempts = 0;
    }

    /**
     * Reset reconnection state
     */
    reset(): void {
        this.cancel();
    }

    /**
     * Get current attempt count
     */
    getAttempts(): number {
        return this.attempts;
    }
}

/**
 * Network status monitor
 */
export class NetworkMonitor {
    private onlineCallback: () => void;
    private offlineCallback: () => void;
    private isOnline = navigator.onLine;

    constructor(onlineCallback: () => void, offlineCallback: () => void) {
        this.onlineCallback = onlineCallback;
        this.offlineCallback = offlineCallback;
        this.setupListeners();
    }

    private setupListeners(): void {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    private handleOnline = (): void => {
        console.log('Network connection restored');
        this.isOnline = true;
        this.onlineCallback();
    };

    private handleOffline = (): void => {
        console.log('Network connection lost');
        this.isOnline = false;
        this.offlineCallback();
    };

    public getStatus(): boolean {
        return this.isOnline;
    }

    public cleanup(): void {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
    }
}
