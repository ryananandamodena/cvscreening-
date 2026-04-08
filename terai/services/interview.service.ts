/**
 * Interview Service
 * Handles interview scheduling, scorecards, notes, and sentiment analysis
 */

export interface InterviewSchedule {
    id: string;
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    recruiterId: string;
    recruiterName: string;
    scheduledAt: string;
    duration: number;
    type: 'video' | 'phone' | 'onsite';
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rescheduled';
    location?: string;
    meetingUrl?: string;
    notes?: string;
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface InterviewScorecard {
    id: string;
    interviewId: string;
    candidateId: string;
    evaluatorId: string;
    evaluatorName: string;
    overallRating: 1 | 2 | 3 | 4 | 5;
    recommendation: 'strong-hire' | 'hire' | 'no-hire' | 'strong-no-hire';
    criteria: ScorecardCriteria[];
    strengths: string[];
    weaknesses: string[];
    notes: string;
    submittedAt?: string;
}

export interface ScorecardCriteria {
    id: string;
    name: string;
    description: string;
    rating: 1 | 2 | 3 | 4 | 5;
    weight: number;
    comment?: string;
}

export interface InterviewNote {
    id: string;
    interviewId: string;
    userId: string;
    userName: string;
    timestamp: string;
    content: string;
    type: 'general' | 'question' | 'answer' | 'observation' | 'concern' | 'highlight';
    tags: string[];
}

export interface SentimentAnalysis {
    id: string;
    interviewId: string;
    timestamp: string;
    overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    confidence: number;
    emotions: {
        joy: number;
        sadness: number;
        anger: number;
        fear: number;
        surprise: number;
        trust: number;
    };
    keywords: Array<{
        word: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        score: number;
    }>;
    phrases: Array<{
        text: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        confidence: number;
    }>;
    trends: Array<{
        timestamp: string;
        sentiment: number;
    }>;
}

export interface InterviewTemplate {
    id: string;
    name: string;
    description: string;
    jobType: string;
    duration: number;
    sections: InterviewSection[];
    createdBy: string;
    isPublic: boolean;
}

export interface InterviewSection {
    id: string;
    name: string;
    description: string;
    duration: number;
    questions: InterviewQuestion[];
}

export interface InterviewQuestion {
    id: string;
    text: string;
    type: 'behavioral' | 'technical' | 'situational' | 'case' | 'general';
    expectedDuration: number;
    followUpQuestions?: string[];
    evaluationCriteria?: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}

class InterviewService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
    }

    private getAuthHeader(): Record<string, string> {
        const token = localStorage.getItem('access_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // ==================== SCHEDULING ====================

    /**
     * Create a new interview schedule
     */
    async createSchedule(schedule: Partial<InterviewSchedule>): Promise<InterviewSchedule> {
        const response = await fetch(`${this.baseUrl}/interviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify({
                candidate_id: schedule.candidateId,
                job_id: schedule.jobId,
                candidate_name: schedule.candidateName,
                job_title: schedule.jobTitle,
                scheduled_at: schedule.scheduledAt,
                duration: schedule.duration,
                interview_type: schedule.type,
                location: schedule.location,
                notes: schedule.notes,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to create schedule');
        }
        return response.json();
    }

    /**
     * Get all scheduled interviews
     */
    async getSchedules(filters?: {
        candidateId?: string;
        recruiterId?: string;
        jobId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<InterviewSchedule[]> {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }

        const queryString = params.toString();
        const url = queryString ? `${this.baseUrl}/interviews?${queryString}` : `${this.baseUrl}/interviews`;
        
        // Remove potential double slashes
        const sanitizedUrl = url.replace(/([^:]\/)\/+/g, "$1");
        
        const response = await fetch(sanitizedUrl, {
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to fetch schedules');
        }
        return response.json();
    }

    /**
     * Get single schedule by ID
     */
    async getSchedule(id: string): Promise<InterviewSchedule | null> {
        if (!id || id === ":id" || id === "undefined") {
            console.warn("getSchedule called with invalid ID, skipping request");
            return null;
        }
        
        const response = await fetch(`${this.baseUrl}/interviews/${id}`.replace(/([^:]\/)\/+/g, "$1"), {
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to fetch schedule');
        }
        return response.json();
    }

    /**
     * Update interview schedule
     */
    async updateSchedule(id: string, updates: Partial<InterviewSchedule>): Promise<InterviewSchedule> {
        const response = await fetch(`${this.baseUrl}/interviews/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to update schedule');
        }
        return response.json();
    }

    /**
     * Cancel interview
     */
    async cancelSchedule(id: string, reason?: string): Promise<void> {
        if (!id || id === ":id" || id === "undefined") return;

        await fetch(`${this.baseUrl}/interviews/${id}/cancel`.replace(/([^:]\/)\/+/g, "$1"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify({ reason }),
        });
    }

    // ==================== SCORECARD ====================

    /**
     * Create or update scorecard — saves ALL data to the new dedicated endpoint
     */
    async submitScorecard(scorecard: Partial<InterviewScorecard>): Promise<InterviewScorecard> {
        const interviewId = scorecard.interviewId;

        // Try to get existing scorecard first
        let existingId: number | null = null;
        try {
            const existing = await this.getScorecard(interviewId || '');
            if (existing && existing.id) {
                existingId = parseInt(existing.id);
            }
        } catch {
            // No existing scorecard, will create new
        }

        const payload = {
            evaluatorName: scorecard.evaluatorName || '',
            overallScore: scorecard.overallRating || 3,
            recommendation: scorecard.recommendation || 'hire',
            criteria: (scorecard.criteria || []).map(c => ({
                id: c.id,
                name: c.name,
                rating: c.rating,
                weight: c.weight,
                comment: c.comment || '',
            })),
            strengths: scorecard.strengths || [],
            weaknesses: scorecard.weaknesses || [],
            notes: scorecard.notes || '',
            status: scorecard.submittedAt ? 'submitted' : 'draft',
        };

        if (existingId) {
            // Update existing scorecard
            const response = await fetch(`${this.baseUrl}/scorecards/${existingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader(),
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Failed to update scorecard');
            }
        } else {
            // Create new scorecard
            const response = await fetch(`${this.baseUrl}/interviews/${interviewId}/scorecard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader(),
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Failed to create scorecard');
            }
        }

        // Also update the basic interview feedback for backward compatibility
        try {
            await fetch(`${this.baseUrl}/interviews/${interviewId}/feedback`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader(),
                },
                body: JSON.stringify({
                    rating: scorecard.overallRating,
                    recommendation: scorecard.recommendation,
                    interviewer_notes: scorecard.notes,
                }),
            });
        } catch {
            // Non-critical, scorecard is already saved
        }

        return scorecard as InterviewScorecard;
    }

    /**
     * Get scorecard for interview — loads from dedicated scorecard endpoint
     */
    async getScorecard(interviewId: string): Promise<InterviewScorecard | null> {
        if (!interviewId || interviewId === ":id" || interviewId === "undefined") {
            return null;
        }

        const response = await fetch(`${this.baseUrl}/interviews/${interviewId}/scorecard`.replace(/([^:]\/)\/+/g, "$1"), {
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            // Fallback to basic interview data
            try {
                const fallbackResp = await fetch(`${this.baseUrl}/interviews/${interviewId}`, {
                    headers: this.getAuthHeader(),
                });
                if (fallbackResp.ok) {
                    const data = await fallbackResp.json();
                    if (data.rating || data.interviewer_notes) {
                        return {
                            id: `sc_${interviewId}`,
                            interviewId,
                            candidateId: data.candidate_id || '',
                            evaluatorId: '',
                            evaluatorName: '',
                            overallRating: data.rating || 3,
                            recommendation: data.recommendation || 'hire',
                            criteria: [],
                            strengths: [],
                            weaknesses: [],
                            notes: data.interviewer_notes || '',
                            submittedAt: data.updated_at,
                        };
                    }
                }
            } catch {
                // No fallback data either
            }
            return null;
        }

        const data = await response.json();
        if (!data || !data.id) return null;

        return {
            id: String(data.id),
            interviewId: String(data.interviewId),
            candidateId: '',
            evaluatorId: data.evaluatorId ? String(data.evaluatorId) : '',
            evaluatorName: data.evaluatorName || '',
            overallRating: data.overallScore || 3,
            recommendation: data.recommendation || 'hire',
            criteria: (data.criteria || []).map((c: any) => ({
                id: c.id || '',
                name: c.name || '',
                description: '',
                rating: c.rating || 3,
                weight: c.weight || 20,
                comment: c.comment || '',
            })),
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
            notes: data.notes || '',
            submittedAt: data.submittedAt || undefined,
        };
    }

    /**
     * Get default scorecard template criteria
     */
    getDefaultScorecardTemplate(): ScorecardCriteria[] {
        return [
            { id: '1', name: 'interviewScorecard.criteria.technical', description: 'Technical proficiency and depth', rating: 3, weight: 30 },
            { id: '2', name: 'interviewScorecard.criteria.experience', description: 'Relevance of past work experience', rating: 3, weight: 20 },
            { id: '3', name: 'interviewScorecard.criteria.problemSolving', description: 'Analytical and logical thinking', rating: 3, weight: 20 },
            { id: '4', name: 'interviewScorecard.criteria.communication', description: 'Clarity and articulation', rating: 3, weight: 15 },
            { id: '5', name: 'interviewScorecard.criteria.culture', description: 'Alignment with company values', rating: 3, weight: 15 },
        ];
    }
}

export const interviewService = new InterviewService();
