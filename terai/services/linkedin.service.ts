/**
 * LinkedIn Integration Service
 * Handles LinkedIn OAuth and data import for candidate sourcing
 */

export interface LinkedInProfile {
    id: string;
    firstName: string;
    lastName: string;
    headline: string;
    summary: string;
    location: string;
    industry: string;
    pictureUrl?: string;
    email?: string;
    positions: LinkedInPosition[];
    educations: LinkedInEducation[];
    skills: string[];
    certifications: LinkedInCertification[];
    languages: string[];
}

export interface LinkedInPosition {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    summary?: string;
}

export interface LinkedInEducation {
    id: string;
    school: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
}

export interface LinkedInCertification {
    name: string;
    authority: string;
    licenseNumber?: string;
    startDate?: string;
    endDate?: string;
    url?: string;
}

export interface LinkedInSearchParams {
    keywords: string;
    location?: string;
    industry?: string;
    jobTitle?: string;
    skills?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
    limit?: number;
}

export interface LinkedInImportResult {
    success: boolean;
    profile?: LinkedInProfile;
    error?: string;
}

class LinkedInService {
    private clientId: string;
    private redirectUri: string;
    private scope: string[];

    constructor() {
        this.clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';
        this.redirectUri = import.meta.env.VITE_LINKEDIN_REDIRECT_URI || `${window.location.origin}/linkedin/callback`;
        this.scope = ['r_liteprofile', 'r_emailaddress', 'r_basicprofile'];
    }

    /**
     * Check if LinkedIn integration is configured
     */
    isConfigured(): boolean {
        return !!this.clientId;
    }

    /**
     * Generate LinkedIn OAuth authorization URL
     */
    getAuthorizationUrl(state?: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope.join(' '),
            state: state || this.generateState(),
        });

        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }

    /**
     * Generate cryptographically secure random state for CSRF protection
     * SECURITY: Uses crypto.getRandomValues() instead of Math.random() to prevent
     * state prediction attacks during OAuth flow
     */
    private generateState(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

        const response = await fetch(`${baseUrl}/linkedin/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                redirect_uri: this.redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for token');
        }

        return response.json();
    }

    /**
     * Fetch LinkedIn profile data
     */
    async fetchProfile(accessToken: string): Promise<LinkedInProfile> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

        const response = await fetch(`${baseUrl}/linkedin/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch LinkedIn profile');
        }

        return response.json();
    }

    /**
     * Search candidates on LinkedIn (via backend proxy)
     */
    async searchCandidates(params: LinkedInSearchParams): Promise<LinkedInProfile[]> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            return this.getMockCandidates(params);
        }

        const response = await fetch(`${baseUrl}/linkedin/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error('Failed to search LinkedIn candidates');
        }

        const data = await response.json();
        return data.candidates || [];
    }

    /**
     * Import candidate from LinkedIn to Talent Pool
     */
    async importCandidate(profile: LinkedInProfile): Promise<LinkedInImportResult> {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
        const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true';

        if (enableMock) {
            return { success: true, profile };
        }

        try {
            const response = await fetch(`${baseUrl}/candidates/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: 'linkedin',
                    profile,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to import candidate');
            }

            return { success: true, profile };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Import multiple candidates from LinkedIn
     */
    async importCandidates(profiles: LinkedInProfile[]): Promise<LinkedInImportResult[]> {
        const results: LinkedInImportResult[] = [];

        for (const profile of profiles) {
            const result = await this.importCandidate(profile);
            results.push(result);
        }

        return results;
    }

    /**
     * Convert LinkedIn profile to Candidate format
     */
    convertToCandidate(profile: LinkedInProfile) {
        const totalExperience = this.calculateTotalExperience(profile.positions);

        return {
            id: `linkedin-${profile.id}`,
            name: `${profile.firstName} ${profile.lastName}`,
            email: profile.email || '',
            role: profile.headline || '',
            location: profile.location,
            industry: profile.industry,
            summary: profile.summary,
            picture: profile.pictureUrl,
            experience: totalExperience,
            skills: profile.skills,
            education: profile.educations.map(e => ({
                school: e.school,
                degree: e.degree,
                field: e.fieldOfStudy,
                year: e.endDate,
            })),
            workHistory: profile.positions.map(p => ({
                title: p.title,
                company: p.company,
                location: p.location,
                startDate: p.startDate,
                endDate: p.endDate,
                current: p.isCurrent,
                summary: p.summary,
            })),
            certifications: profile.certifications,
            languages: profile.languages,
            source: 'linkedin',
            importedAt: new Date().toISOString(),
        };
    }

    /**
     * Calculate total years of experience
     */
    private calculateTotalExperience(positions: LinkedInPosition[]): number {
        if (!positions || positions.length === 0) return 0;

        let totalMonths = 0;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        positions.forEach(pos => {
            const startParts = pos.startDate.split('-');
            const startYear = parseInt(startParts[0]);
            const startMonth = parseInt(startParts[1] || '1');

            let endYear: number, endMonth: number;
            if (pos.isCurrent || !pos.endDate) {
                endYear = currentYear;
                endMonth = currentMonth;
            } else {
                const endParts = pos.endDate.split('-');
                endYear = parseInt(endParts[0]);
                endMonth = parseInt(endParts[1] || '1');
            }

            const months = (endYear - startYear) * 12 + (endMonth - startMonth);
            totalMonths += Math.max(0, months);
        });

        return Math.round(totalMonths / 12 * 10) / 10;
    }

    /**
     * Get mock candidates for testing
     */
    private getMockCandidates(params: LinkedInSearchParams): LinkedInProfile[] {
        const mockProfiles: LinkedInProfile[] = [
            {
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                headline: 'Senior Software Engineer at Tech Company',
                summary: 'Experienced software engineer with 8+ years in full-stack development.',
                location: 'Jakarta, Indonesia',
                industry: 'Information Technology',
                pictureUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff',
                email: 'john.doe@example.com',
                positions: [
                    {
                        id: '1',
                        title: 'Senior Software Engineer',
                        company: 'Tech Company',
                        location: 'Jakarta',
                        startDate: '2020-01',
                        isCurrent: true,
                        summary: 'Leading frontend development team',
                    },
                    {
                        id: '2',
                        title: 'Software Engineer',
                        company: 'Startup XYZ',
                        location: 'Jakarta',
                        startDate: '2016-06',
                        endDate: '2019-12',
                        isCurrent: false,
                    },
                ],
                educations: [
                    {
                        id: '1',
                        school: 'Universitas Indonesia',
                        degree: 'Bachelor',
                        fieldOfStudy: 'Computer Science',
                        endDate: '2016',
                    },
                ],
                skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'AWS'],
                certifications: [
                    { name: 'AWS Solutions Architect', authority: 'Amazon Web Services' },
                ],
                languages: ['English', 'Indonesian'],
            },
            {
                id: '2',
                firstName: 'Jane',
                lastName: 'Smith',
                headline: 'Product Manager at Digital Agency',
                summary: 'Product manager with experience in B2B SaaS products.',
                location: 'Bandung, Indonesia',
                industry: 'Internet',
                pictureUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=8b5cf6&color=fff',
                email: 'jane.smith@example.com',
                positions: [
                    {
                        id: '1',
                        title: 'Product Manager',
                        company: 'Digital Agency',
                        location: 'Bandung',
                        startDate: '2019-03',
                        isCurrent: true,
                    },
                ],
                educations: [
                    {
                        id: '1',
                        school: 'ITB',
                        degree: 'Master',
                        fieldOfStudy: 'Business Administration',
                        endDate: '2018',
                    },
                ],
                skills: ['Product Management', 'Agile', 'Scrum', 'Data Analysis', 'UX Research'],
                certifications: [],
                languages: ['English', 'Indonesian'],
            },
            {
                id: '3',
                firstName: 'Ahmad',
                lastName: 'Rizki',
                headline: 'Full Stack Developer at FinTech Startup',
                summary: 'Passionate developer with expertise in Golang and React.',
                location: 'Surabaya, Indonesia',
                industry: 'Financial Services',
                pictureUrl: 'https://ui-avatars.com/api/?name=Ahmad+Rizki&background=10b981&color=fff',
                email: 'ahmad.rizki@example.com',
                positions: [
                    {
                        id: '1',
                        title: 'Full Stack Developer',
                        company: 'FinTech Startup',
                        location: 'Surabaya',
                        startDate: '2021-01',
                        isCurrent: true,
                    },
                    {
                        id: '2',
                        title: 'Backend Developer',
                        company: 'Software House',
                        location: 'Surabaya',
                        startDate: '2018-06',
                        endDate: '2020-12',
                        isCurrent: false,
                    },
                ],
                educations: [
                    {
                        id: '1',
                        school: 'ITS',
                        degree: 'Bachelor',
                        fieldOfStudy: 'Informatics Engineering',
                        endDate: '2018',
                    },
                ],
                skills: ['Golang', 'React', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
                certifications: [
                    { name: 'Certified Kubernetes Administrator', authority: 'CNCF' },
                ],
                languages: ['English', 'Indonesian', 'Javanese'],
            },
        ];

        // Filter by keywords if provided
        if (params.keywords) {
            const keywords = params.keywords.toLowerCase();
            return mockProfiles.filter(p =>
                p.headline.toLowerCase().includes(keywords) ||
                p.summary.toLowerCase().includes(keywords) ||
                p.skills.some(s => s.toLowerCase().includes(keywords))
            );
        }

        return mockProfiles.slice(0, params.limit || 10);
    }
}

export const linkedInService = new LinkedInService();
