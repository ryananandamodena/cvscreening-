
import { ScreeningResult } from "../types";

/**
 * RecruitAI Enterprise - AI Service Layer
 * 
 * SECURITY NOTE: All AI operations are proxied through the backend API for security.
 * The Gemini API key is NEVER exposed in the frontend bundle. All AI requests
 * go through secure backend endpoints (/api/ai/*) which handle the API key server-side.
 * 
 * This approach:
 * 1. Prevents API key exposure in the frontend bundle
 * 2. Allows for server-side rate limiting and usage tracking
 * 3. Enables secure credential rotation without frontend redeployment
 * 4. Provides a single point for audit logging of AI operations
 */

/**
 * Response type for skill matching operations
 */
export interface SkillMatchResult {
  matchPercentage: number;
  matchedSkills: Array<{
    skill: string;
    proficiency: 'expert' | 'advanced' | 'intermediate' | 'beginner';
    relevance: number;
  }>;
  missingSkills: Array<{
    skill: string;
    priority: 'critical' | 'important' | 'nice-to-have';
    learningPath: string;
  }>;
  skillGapAnalysis: string;
  recommendations?: string[];
}

/**
 * Response type for skill extraction from CV
 */
export interface ExtractedSkills {
  technicalSkills: Array<{
    name: string;
    yearsOfExperience: number;
    proficiency: 'expert' | 'advanced' | 'intermediate' | 'beginner';
  }>;
  softSkills: string[];
  domainKnowledge: string[];
  certifications?: string[];
  languages?: string[];
  totalExperience: number;
}

/**
 * Response type for candidate success prediction
 */
export interface SuccessPrediction {
  successProbability: number;
  retentionPrediction?: number;
  performancePrediction?: 'excellent' | 'good' | 'average' | 'below-average';
  riskFactors?: string[];
  strengths?: string[];
  developmentAreas?: string[];
  recommendation: 'strongly-recommend' | 'recommend' | 'consider' | 'not-recommended';
  reasoning: string;
}

/**
 * Configuration for live interview sessions
 */
export interface LiveInterviewConfig {
  systemInstruction?: string;
  onopen?: () => void;
  onmessage?: (data: any) => void;
  onerror?: (error: Error) => void;
}

/**
 * AI Service class - all operations proxied through backend for security
 */
export class AIService {
  /**
   * Get the base URL for API calls
   */
  private getBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
  }

  /**
   * Check if mock mode is enabled
   */
  private isMockEnabled(): boolean {
    return import.meta.env.VITE_ENABLE_MOCK === 'true';
  }

  /**
   * Make a secure API call to the backend AI endpoint
   */
  private async callBackend<T>(endpoint: string, data: any): Promise<T> {
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Fetch active jobs from backend
   */
  async getJobs(): Promise<any[]> {
    try {
      const baseUrl = this.getBaseUrl();

      if (this.isMockEnabled()) {
        return [
          { id: 1, title: 'Senior Golang Developer', department: 'Engineering' },
          { id: 2, title: 'Frontend Developer (React)', department: 'Engineering' },
          { id: 3, title: 'Product Manager', department: 'Product' }
        ];
      }

      const response = await fetch(`${baseUrl}/jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }

  /**
   * Upload CV file for analysis
   * Proxied through backend for secure processing
   */
  async uploadScreening(jobId: number, jd: string, file: File): Promise<ScreeningResult> {
    try {
      const baseUrl = this.getBaseUrl();

      const formData = new FormData();
      formData.append('jd', jd);
      if (jobId) formData.append('job_id', jobId.toString());
      formData.append('cv_file', file);

      const response = await fetch(`${baseUrl}/screening`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Screening failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Screening upload error:', error);
      throw error;
    }
  }

  /**
   * Deep CV Analysis using Backend Service
   * SECURITY: All AI processing happens server-side, API key is never exposed to frontend
   */
  async performScreening(jd: string, cv: string): Promise<ScreeningResult> {
    try {
      // If mock mode is enabled, use mock data
      if (this.isMockEnabled()) {
        return this.performScreeningMock(jd, cv);
      }

      // SECURITY: Call backend endpoint instead of direct Gemini API
      // The backend handles the API key securely
      return await this.callBackend<ScreeningResult>('/screening', { jd, cv });
    } catch (error) {
      console.error('Backend screening error:', error);
      // Fallback to mock on error
      return this.performScreeningMock(jd, cv);
    }
  }

  /**
   * Mock screening for testing when backend is unavailable
   */
  private async performScreeningMock(jd: string, cv: string): Promise<ScreeningResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      score: 75,
      matchedSkills: ["React", "TypeScript", "Node.js"],
      missingSkills: ["Go", "Microservices"],
      reasoning: "Mock data: Candidate demonstrates strong frontend skills but lacks backend experience.",
      biasCorrection: "Mock evaluation focused on technical qualifications.",
      confidence: 0.85
    };
  }

  /**
   * Establish a Secure Live Interview Session
   * SECURITY: Session is established through backend which holds the API credentials
   */
  async setupLiveInterview(config: LiveInterviewConfig): Promise<WebSocket> {
    const baseUrl = this.getBaseUrl().replace('http', 'ws');

    const defaultSystemInstruction = `You are an expert AI Interviewer for RecruitAI. 
        Your tone is professional, encouraging, and highly technical. 
        Ask one question at a time. Do not provide answers. 
        Analyze the candidate's technical depth and communication skills.`;

    // SECURITY: Connect to backend WebSocket endpoint which proxies to Gemini
    // The backend handles authentication with Gemini API securely
    const ws = new WebSocket(`${baseUrl}/ai/live-interview`);

    ws.onopen = () => {
      // Send configuration including system instruction
      ws.send(JSON.stringify({
        type: 'config',
        systemInstruction: config.systemInstruction || defaultSystemInstruction
      }));
      config.onopen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        config.onmessage?.(data);
      } catch (e) {
        config.onmessage?.(event.data);
      }
    };

    ws.onerror = (error) => {
      config.onerror?.(new Error('WebSocket error'));
    };

    return ws;
  }

  /**
   * Decode base64 string to Uint8Array
   */
  decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Encode Uint8Array to base64 string
   */
  encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert bytes to AudioBuffer for playback
   */
  async bytesToAudioBuffer(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  /**
   * Create PCM blob from float32 array for audio transmission
   */
  createPCMBlob(float32Array: Float32Array): { data: string; mimeType: string } {
    const l = float32Array.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = float32Array[i] * 32768;
    }
    return {
      data: this.encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  /**
   * AI-Powered Skill Matching Engine
   * SECURITY: All AI processing happens server-side
   */
  async matchSkills(candidateSkills: string[], jobRequirements: string[]): Promise<SkillMatchResult> {
    if (this.isMockEnabled()) {
      return {
        matchPercentage: 75,
        matchedSkills: candidateSkills.slice(0, 3).map(skill => ({
          skill,
          proficiency: 'intermediate' as const,
          relevance: 80
        })),
        missingSkills: jobRequirements.slice(0, 2).map(skill => ({
          skill,
          priority: 'important' as const,
          learningPath: `Recommended course for ${skill}`
        })),
        skillGapAnalysis: 'Mock analysis: Candidate has good foundational skills.',
        recommendations: ['Consider additional training in missing areas']
      };
    }

    // SECURITY: Call backend endpoint for skill matching
    return await this.callBackend<SkillMatchResult>('/ai/skill-match', {
      candidateSkills,
      jobRequirements
    });
  }

  /**
   * Extract skills from CV/Resume text using AI
   * SECURITY: All AI processing happens server-side
   */
  async extractSkillsFromCV(cvText: string): Promise<ExtractedSkills> {
    if (this.isMockEnabled()) {
      return {
        technicalSkills: [
          { name: 'JavaScript', yearsOfExperience: 3, proficiency: 'advanced' },
          { name: 'React', yearsOfExperience: 2, proficiency: 'intermediate' }
        ],
        softSkills: ['Communication', 'Teamwork'],
        domainKnowledge: ['Web Development'],
        certifications: [],
        languages: ['English'],
        totalExperience: 3
      };
    }

    // SECURITY: Call backend endpoint for skill extraction
    return await this.callBackend<ExtractedSkills>('/ai/extract-skills', {
      cvText
    });
  }

  /**
   * Predict candidate success probability based on historical data
   * SECURITY: All AI processing happens server-side
   */
  async predictCandidateSuccess(candidateProfile: any, jobRequirements: any): Promise<SuccessPrediction> {
    if (this.isMockEnabled()) {
      return {
        successProbability: 70,
        retentionPrediction: 24,
        performancePrediction: 'good',
        riskFactors: ['Limited experience with specific technology'],
        strengths: ['Strong problem-solving skills', 'Good cultural fit'],
        developmentAreas: ['Technical depth in specific areas'],
        recommendation: 'recommend',
        reasoning: 'Mock prediction based on profile analysis.'
      };
    }

    // SECURITY: Call backend endpoint for success prediction
    return await this.callBackend<SuccessPrediction>('/ai/predict-success', {
      candidateProfile,
      jobRequirements
    });
  }
}

export const aiService = new AIService();
