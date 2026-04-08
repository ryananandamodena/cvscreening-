/**
 * Video Recording Service
 * Handles video/audio recording, storage, and playback for interviews
 */

export interface RecordingMetadata {
    id: string;
    interviewId: string;
    candidateId: string;
    candidateName: string;
    startTime: string;
    endTime?: string;
    duration: number; // in seconds
    fileSize: number; // in bytes
    format: 'webm' | 'mp4' | 'ogg';
    type: 'video' | 'audio';
    status: 'recording' | 'processing' | 'completed' | 'failed';
    thumbnailUrl?: string;
    playbackUrl?: string;
    downloadUrl?: string;
    transcript?: TranscriptSegment[];
    aiAnalysis?: AIAnalysis;
}

export interface TranscriptSegment {
    id: string;
    timestamp: number; // seconds from start
    duration: number;
    speaker: 'interviewer' | 'candidate' | 'ai';
    text: string;
    confidence: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface AIAnalysis {
    overallScore: number;
    communicationScore: number;
    technicalScore: number;
    sentimentScore: number;
    keywords: string[];
    topics: string[];
    highlights: Array<{
        timestamp: number;
        type: 'strength' | 'concern' | 'question' | 'answer';
        description: string;
    }>;
    recommendations: string[];
}

export interface RecordingConfig {
    video: boolean;
    audio: boolean;
    screenShare: boolean;
    quality: 'low' | 'medium' | 'high';
    maxDuration: number; // in minutes
    autoTranscribe: boolean;
    autoAnalyze: boolean;
}

class RecordingService {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private startTime: Date | null = null;
    private recordingId: string | null = null;

    /**
     * Initialize recording with specified configuration
     */
    async initializeRecording(config: RecordingConfig): Promise<MediaStream> {
        const constraints: MediaStreamConstraints = {
            video: config.video ? {
                width: { ideal: config.quality === 'high' ? 1920 : config.quality === 'medium' ? 1280 : 640 },
                height: { ideal: config.quality === 'high' ? 1080 : config.quality === 'medium' ? 720 : 480 },
                frameRate: { ideal: 30 }
            } : false,
            audio: config.audio ? {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            } : false
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        return this.stream;
    }

    /**
     * Start recording
     */
    async startRecording(
        interviewId: string,
        candidateId: string,
        config: RecordingConfig
    ): Promise<string> {
        if (!this.stream) {
            await this.initializeRecording(config);
        }

        this.recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.recordedChunks = [];
        this.startTime = new Date();

        const mimeType = this.getSupportedMimeType();
        this.mediaRecorder = new MediaRecorder(this.stream!, {
            mimeType,
            videoBitsPerSecond: config.quality === 'high' ? 5000000 : config.quality === 'medium' ? 2500000 : 1000000
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.start(1000); // Collect data every second

        // Save metadata to backend
        await this.saveRecordingMetadata({
            id: this.recordingId,
            interviewId,
            candidateId,
            candidateName: '',
            startTime: this.startTime.toISOString(),
            duration: 0,
            fileSize: 0,
            format: mimeType.includes('webm') ? 'webm' : 'mp4',
            type: config.video ? 'video' : 'audio',
            status: 'recording'
        });

        return this.recordingId;
    }

    /**
     * Stop recording and finalize
     */
    async stopRecording(): Promise<RecordingMetadata> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || !this.recordingId) {
                reject(new Error('No active recording'));
                return;
            }

            this.mediaRecorder.onstop = async () => {
                const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder!.mimeType });
                const endTime = new Date();
                const duration = this.startTime ? (endTime.getTime() - this.startTime.getTime()) / 1000 : 0;

                const metadata: RecordingMetadata = {
                    id: this.recordingId!,
                    interviewId: '',
                    candidateId: '',
                    candidateName: '',
                    startTime: this.startTime!.toISOString(),
                    endTime: endTime.toISOString(),
                    duration,
                    fileSize: blob.size,
                    format: this.mediaRecorder!.mimeType.includes('webm') ? 'webm' : 'mp4',
                    type: this.mediaRecorder!.mimeType.includes('video') ? 'video' : 'audio',
                    status: 'processing'
                };

                // Upload recording
                try {
                    const uploadResult = await this.uploadRecording(blob, metadata);
                    metadata.playbackUrl = uploadResult.playbackUrl;
                    metadata.downloadUrl = uploadResult.downloadUrl;
                    metadata.thumbnailUrl = uploadResult.thumbnailUrl;
                    metadata.status = 'completed';
                } catch (error) {
                    metadata.status = 'failed';
                    console.error('Failed to upload recording:', error);
                }

                // Cleanup
                this.cleanup();

                resolve(metadata);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Pause recording
     */
    pauseRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
        }
    }

    /**
     * Resume recording
     */
    resumeRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
        }
    }

    /**
     * Cancel recording
     */
    cancelRecording(): void {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        this.cleanup();
    }

    /**
     * Get current recording state
     */
    getRecordingState(): 'inactive' | 'recording' | 'paused' {
        return this.mediaRecorder?.state || 'inactive';
    }

    /**
     * Get current recording duration in seconds
     */
    getRecordingDuration(): number {
        if (!this.startTime) return 0;
        return (Date.now() - this.startTime.getTime()) / 1000;
    }

    /**
     * Get all recordings for an interview
     */
    async getRecordings(interviewId: string): Promise<RecordingMetadata[]> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            return this.getMockRecordings(interviewId);
        }

        const response = await fetch(`${baseUrl}/interviews/${interviewId}/recordings`);
        if (!response.ok) {
            throw new Error('Failed to fetch recordings');
        }
        const result = await response.json();
        const data = result.data || [];

        return data.map((rec: any) => this.mapBackendToFrontend(rec));
    }

    /**
     * Get a single recording by ID
     */
    async getRecording(recordingId: string): Promise<RecordingMetadata> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            const recordings = this.getMockRecordings('');
            return recordings.find(r => r.id === recordingId) || recordings[0];
        }

        const response = await fetch(`${baseUrl}/recordings/${recordingId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recording');
        }
        const data = await response.json();
        return this.mapBackendToFrontend(data);
    }

    /**
     * Helper to map backend fields to frontend interface
     */
    private mapBackendToFrontend(rec: any): RecordingMetadata {
        return {
            id: String(rec.id),
            interviewId: String(rec.interviewId),
            candidateId: rec.candidateId ? String(rec.candidateId) : '',
            candidateName: rec.candidateName || '',
            startTime: rec.createdAt || new Date().toISOString(),
            endTime: rec.updatedAt,
            duration: rec.durationSeconds || 0,
            fileSize: rec.fileSize || 0,
            format: rec.format || 'webm',
            type: rec.recordingType || 'video',
            status: rec.status || 'completed',
            thumbnailUrl: rec.thumbnailUrl,
            playbackUrl: rec.filePath ? (rec.filePath.startsWith('http') ? rec.filePath : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'}/../${rec.filePath}`) : undefined,
            downloadUrl: rec.filePath ? (rec.filePath.startsWith('http') ? rec.filePath : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'}/../${rec.filePath}`) : undefined,
            transcript: rec.transcript || [],
            aiAnalysis: rec.aiAnalysis
        };
    }

    /**
     * Delete a recording
     */
    async deleteRecording(recordingId: string): Promise<void> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

        const response = await fetch(`${baseUrl}/recordings/${recordingId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete recording');
        }
    }

    /**
     * Get transcript for a recording
     */
    async getTranscript(recordingId: string): Promise<TranscriptSegment[]> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            return this.getMockTranscript();
        }

        const response = await fetch(`${baseUrl}/recordings/${recordingId}/transcript`);
        if (!response.ok) {
            throw new Error('Failed to fetch transcript');
        }
        return response.json();
    }

    /**
     * Get AI analysis for a recording
     */
    async getAIAnalysis(recordingId: string): Promise<AIAnalysis> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            return this.getMockAIAnalysis();
        }

        const response = await fetch(`${baseUrl}/recordings/${recordingId}/analysis`);
        if (!response.ok) {
            throw new Error('Failed to fetch AI analysis');
        }
        return response.json();
    }

    /**
     * Download recording
     */
    downloadRecording(metadata: RecordingMetadata): void {
        if (metadata.downloadUrl) {
            const a = document.createElement('a');
            a.href = metadata.downloadUrl;
            a.download = `interview_${metadata.interviewId}_${metadata.id}.${metadata.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    /**
     * Cleanup resources
     */
    private cleanup(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.startTime = null;
        this.recordingId = null;
    }

    /**
     * Get supported MIME type
     */
    private getSupportedMimeType(): string {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'video/webm';
    }

    /**
     * Upload recording to storage
     */
    private async uploadRecording(blob: Blob, metadata: RecordingMetadata): Promise<{
        playbackUrl: string;
        downloadUrl: string;
        thumbnailUrl?: string;
    }> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            // Create local playback URL
            const playbackUrl = URL.createObjectURL(blob);
            return {
                playbackUrl,
                downloadUrl: playbackUrl,
                thumbnailUrl: undefined
            };
        }

        const formData = new FormData();
        formData.append('recording', blob, `recording.${metadata.format}`);
        formData.append('metadata', JSON.stringify(metadata));

        const response = await fetch(`${baseUrl}/recordings/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload recording');
        }

        return response.json();
    }

    /**
     * Save recording metadata
     */
    private async saveRecordingMetadata(metadata: Partial<RecordingMetadata>): Promise<void> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            return;
        }

        await fetch(`${baseUrl}/recordings/metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata)
        });
    }

    /**
     * Get mock recordings for testing
     */
    private getMockRecordings(interviewId: string): RecordingMetadata[] {
        return [
            {
                id: 'rec_001',
                interviewId: 'int_001',
                candidateId: 'cand_001',
                candidateName: 'John Doe',
                startTime: new Date(Date.now() - 3600000).toISOString(),
                endTime: new Date(Date.now() - 3000000).toISOString(),
                duration: 600,
                fileSize: 125000000,
                format: 'webm',
                type: 'video',
                status: 'completed',
                playbackUrl: 'https://example.com/recordings/rec_001.webm',
                downloadUrl: 'https://example.com/recordings/rec_001.webm',
                thumbnailUrl: 'https://ui-avatars.com/api/?name=John+Doe&size=400&background=6366f1&color=fff'
            },
            {
                id: 'rec_002',
                interviewId: 'int_002',
                candidateId: 'cand_002',
                candidateName: 'Jane Smith',
                startTime: new Date(Date.now() - 86400000).toISOString(),
                endTime: new Date(Date.now() - 85800000).toISOString(),
                duration: 1200,
                fileSize: 250000000,
                format: 'webm',
                type: 'video',
                status: 'completed',
                playbackUrl: 'https://example.com/recordings/rec_002.webm',
                downloadUrl: 'https://example.com/recordings/rec_002.webm',
                thumbnailUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&size=400&background=8b5cf6&color=fff'
            }
        ];
    }

    /**
     * Get mock transcript
     */
    private getMockTranscript(): TranscriptSegment[] {
        return [
            { id: '1', timestamp: 0, duration: 5, speaker: 'interviewer', text: 'Hello, thank you for joining today. Can you introduce yourself?', confidence: 0.95, sentiment: 'neutral' },
            { id: '2', timestamp: 5, duration: 15, speaker: 'candidate', text: 'Hi, my name is John. I have 5 years of experience in software development, primarily working with React and Node.js.', confidence: 0.92, sentiment: 'positive' },
            { id: '3', timestamp: 20, duration: 8, speaker: 'interviewer', text: 'Great! Can you tell me about a challenging project you worked on?', confidence: 0.94, sentiment: 'neutral' },
            { id: '4', timestamp: 28, duration: 25, speaker: 'candidate', text: 'I worked on a real-time collaboration platform. The main challenge was handling concurrent edits from multiple users. I implemented operational transformation to solve this.', confidence: 0.88, sentiment: 'positive' },
            { id: '5', timestamp: 53, duration: 10, speaker: 'interviewer', text: 'That sounds interesting. What technologies did you use?', confidence: 0.96, sentiment: 'neutral' },
            { id: '6', timestamp: 63, duration: 20, speaker: 'candidate', text: 'We used WebSockets for real-time communication, Redis for pub/sub, and PostgreSQL for persistent storage. The frontend was built with React and TypeScript.', confidence: 0.91, sentiment: 'positive' }
        ];
    }

    /**
     * Get mock AI analysis
     */
    private getMockAIAnalysis(): AIAnalysis {
        return {
            overallScore: 85,
            communicationScore: 88,
            technicalScore: 82,
            sentimentScore: 90,
            keywords: ['React', 'Node.js', 'WebSockets', 'Redis', 'PostgreSQL', 'TypeScript', 'real-time', 'collaboration'],
            topics: ['Software Development', 'Real-time Systems', 'Database Design', 'Frontend Architecture'],
            highlights: [
                { timestamp: 28, type: 'strength', description: 'Demonstrated strong problem-solving skills with operational transformation implementation' },
                { timestamp: 63, type: 'strength', description: 'Good technical stack knowledge and architecture understanding' },
                { timestamp: 5, type: 'answer', description: 'Clear and concise self-introduction' }
            ],
            recommendations: [
                'Consider asking more about testing strategies',
                'Explore candidate\'s experience with scaling systems',
                'Discuss leadership and team collaboration experience'
            ]
        };
    }
}

export const recordingService = new RecordingService();
