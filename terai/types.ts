
/**
 * DOMAIN LAYER - Contract Definitions
 */
export type CandidateStatus = 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Candidate {
  id: string;
  name: string;
  role: string;
  status: CandidateStatus;
  matchScore: number;
  tags: string[];
  lastActive: string;
  experience: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  bio?: string;
  skills: string[];
  missingSkills: string[];
}

export interface ScreeningResult {
  id?: number;
  screeningId?: number; // For backward compatibility if needed
  createdAt?: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  biasCorrection: string;
  confidence: number;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  token: string;
  status: 'pending' | 'active' | 'completed';
}
