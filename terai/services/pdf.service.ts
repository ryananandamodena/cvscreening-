// PDF Report Generation Service — Client-side with jsPDF
// Generates beautiful PDF reports without requiring backend endpoints

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiService } from './api.service';

export interface ScreeningReport {
    id: number;
    candidateName: string;
    email: string;
    phone?: string;
    jobTitle: string;
    department?: string;
    screeningDate: string;
    score: number;
    recommendation: string;
    skills: string[];
    experience: number;
    education?: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    aiAnalysis?: {
        overallAssessment: string;
        technicalFit: number;
        culturalFit: number;
        keyInsights: string[];
    };
}

export interface InterviewReport {
    id: number;
    candidateName: string;
    email: string;
    jobTitle: string;
    interviewDate: string;
    interviewer: string;
    overallScore: number;
    categories: {
        name: string;
        score: number;
        comments: string;
    }[];
    strengths: string[];
    improvements: string[];
    recommendation: 'hire' | 'no_hire' | 'maybe';
    notes?: string;
    transcript?: string;
    sentimentAnalysis?: {
        positive: number;
        neutral: number;
        negative: number;
    };
}

export interface AnalyticsReport {
    title: string;
    generatedAt: string;
    dateRange: {
        start: string;
        end: string;
    };
    metrics: {
        totalApplications: number;
        screenedCandidates: number;
        interviewsConducted: number;
        offersExtended: number;
        hiresMade: number;
        averageTimeToHire: number;
        topSources: { source: string; count: number }[];
        topJobs: { title: string; applications: number }[];
    };
    charts?: {
        applicationsByMonth: { month: string; count: number }[];
        screeningScores: { range: string; count: number }[];
        interviewOutcomes: { outcome: string; count: number }[];
    };
}

// ─── Color Palette ─────────────────────────────────
const COLORS = {
    primary: [79, 70, 229] as [number, number, number],      // indigo-600
    secondary: [100, 116, 139] as [number, number, number],  // slate-500
    success: [16, 185, 129] as [number, number, number],     // emerald-500
    danger: [244, 63, 94] as [number, number, number],       // rose-500
    warning: [245, 158, 11] as [number, number, number],     // amber-500
    dark: [15, 23, 42] as [number, number, number],          // slate-900
    light: [248, 250, 252] as [number, number, number],      // slate-50
    muted: [148, 163, 184] as [number, number, number],      // slate-400
};

class PDFReportService {

    private addHeader(doc: jsPDF, title: string, subtitle?: string) {
        // Brand header
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, 0, 210, 35, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('HumanIQ', 15, 16);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(200, 200, 255);
        doc.text(title, 15, 25);

        if (subtitle) {
            doc.setFontSize(8);
            doc.text(subtitle, 15, 30);
        }

        // Date
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 255);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 195, 16, { align: 'right' });

        return 42; // Y position after header
    }

    private addSectionTitle(doc: jsPDF, title: string, y: number): number {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.dark);
        doc.text(title, 15, y);
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.8);
        doc.line(15, y + 2, 65, y + 2);
        return y + 10;
    }

    private addScoreBadge(doc: jsPDF, score: number, x: number, y: number) {
        const color = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger;
        doc.setFillColor(...color);
        doc.roundedRect(x, y, 30, 14, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(`${score}%`, x + 15, y + 10, { align: 'center' });
    }

    // ─── Screening Report PDF ────────────────────────
    async generateScreeningReport(screeningId: number): Promise<Blob> {
        let data: ScreeningReport;
        try {
            data = await apiService.get<ScreeningReport>(`/reports/screening/${screeningId}`);
        } catch {
            // Fallback for when API returns raw screening data
            const raw = await apiService.get<any>(`/screenings/${screeningId}`);
            data = {
                id: raw.id,
                candidateName: raw.candidateName || raw.candidate_name || 'Unknown',
                email: raw.email || '',
                jobTitle: raw.jobTitle || raw.job_title || '',
                screeningDate: raw.createdAt || raw.created_at || new Date().toISOString(),
                score: raw.score || 0,
                recommendation: raw.score >= 70 ? 'Recommended' : 'Not Recommended',
                skills: raw.matchedSkills || raw.matched_skills || [],
                experience: 0,
                summary: raw.reasoning || '',
                strengths: raw.matchedSkills || raw.matched_skills || [],
                weaknesses: raw.missingSkills || raw.missing_skills || [],
            };
        }

        const doc = new jsPDF();
        let y = this.addHeader(doc, 'CV Screening Report', `#SCR-${data.id}`);

        // Candidate Info
        y = this.addSectionTitle(doc, 'Candidate Information', y);
        const info = [
            ['Name', data.candidateName],
            ['Email', data.email],
            ['Position', data.jobTitle],
            ['Date', new Date(data.screeningDate).toLocaleDateString()],
        ];
        autoTable(doc, {
            startY: y,
            body: info,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35, textColor: COLORS.muted }, 1: { textColor: COLORS.dark } },
            margin: { left: 15, right: 15 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        // Score
        this.addScoreBadge(doc, data.score, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.secondary);
        doc.text(`Recommendation: ${data.recommendation}`, 50, y + 10);
        y += 22;

        // Summary
        if (data.summary) {
            y = this.addSectionTitle(doc, 'AI Analysis', y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.dark);
            const lines = doc.splitTextToSize(data.summary, 180);
            doc.text(lines, 15, y);
            y += lines.length * 5 + 8;
        }

        // Skills
        if (data.strengths?.length || data.weaknesses?.length) {
            y = this.addSectionTitle(doc, 'Skills Assessment', y);
            const skillsData: string[][] = [];
            (data.strengths || []).forEach(s => skillsData.push(['✓ Matched', typeof s === 'string' ? s : String(s)]));
            (data.weaknesses || []).forEach(s => skillsData.push(['✗ Missing', typeof s === 'string' ? s : String(s)]));

            autoTable(doc, {
                startY: y,
                head: [['Status', 'Skill']],
                body: skillsData,
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
                margin: { left: 15, right: 15 },
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(...COLORS.muted);
            doc.text(`HumanIQ — Confidential | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        return doc.output('blob');
    }

    // ─── Interview Report PDF ────────────────────────
    async generateInterviewReport(interviewId: number): Promise<Blob> {
        let data: InterviewReport;
        try {
            data = await apiService.get<InterviewReport>(`/reports/interview/${interviewId}`);
        } catch {
            const raw = await apiService.get<any>(`/interviews/${interviewId}`);
            data = {
                id: raw.id,
                candidateName: raw.candidateName || raw.candidate_name || 'Unknown',
                email: raw.email || '',
                jobTitle: raw.jobTitle || raw.job_title || '',
                interviewDate: raw.scheduledAt || raw.scheduled_at || new Date().toISOString(),
                interviewer: raw.interviewer || 'AI Interview',
                overallScore: raw.rating || 0,
                categories: [],
                strengths: [],
                improvements: [],
                recommendation: raw.rating && raw.rating >= 4 ? 'hire' : raw.rating >= 3 ? 'maybe' : 'no_hire',
                notes: raw.interviewerNotes || raw.interviewer_notes || '',
            };
        }

        const doc = new jsPDF();
        let y = this.addHeader(doc, 'Interview Report', `#INT-${data.id}`);

        // Candidate Info
        y = this.addSectionTitle(doc, 'Interview Summary', y);
        autoTable(doc, {
            startY: y,
            body: [
                ['Candidate', data.candidateName],
                ['Position', data.jobTitle],
                ['Interviewer', data.interviewer],
                ['Date', new Date(data.interviewDate).toLocaleDateString()],
                ['Recommendation', data.recommendation === 'hire' ? '✓ Hire' : data.recommendation === 'maybe' ? '? Consider' : '✗ No Hire'],
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35, textColor: COLORS.muted }, 1: { textColor: COLORS.dark } },
            margin: { left: 15, right: 15 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        // Score
        this.addScoreBadge(doc, data.overallScore * 20, 15, y); // Convert 1-5 to percentage
        y += 22;

        // Category scores
        if (data.categories?.length) {
            y = this.addSectionTitle(doc, 'Category Scores', y);
            autoTable(doc, {
                startY: y,
                head: [['Category', 'Score', 'Comments']],
                body: data.categories.map(c => [c.name, `${c.score}/5`, c.comments]),
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
                margin: { left: 15, right: 15 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
        }

        // Notes
        if (data.notes) {
            y = this.addSectionTitle(doc, 'Notes', y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.dark);
            const lines = doc.splitTextToSize(data.notes, 180);
            doc.text(lines, 15, y);
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(...COLORS.muted);
            doc.text(`HumanIQ — Confidential | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        return doc.output('blob');
    }

    // ─── Analytics Report PDF ────────────────────────
    async generateAnalyticsReport(dateRange: { start: Date; end: Date }): Promise<Blob> {
        let data: AnalyticsReport;
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start.toISOString(),
                endDate: dateRange.end.toISOString()
            });
            data = await apiService.get<AnalyticsReport>(`/reports/analytics?${params}`);
        } catch {
            // Build from available analytics data
            const analytics = await apiService.get<any>('/analytics');
            data = {
                title: 'Analytics Summary Report',
                generatedAt: new Date().toISOString(),
                dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() },
                metrics: {
                    totalApplications: analytics?.totalApplications || 0,
                    screenedCandidates: analytics?.screenedCandidates || 0,
                    interviewsConducted: analytics?.interviewsConducted || 0,
                    offersExtended: analytics?.offersExtended || 0,
                    hiresMade: analytics?.hiresMade || 0,
                    averageTimeToHire: analytics?.averageTimeToHire || 0,
                    topSources: analytics?.topSources || [],
                    topJobs: analytics?.topJobs || [],
                },
            };
        }

        const doc = new jsPDF();
        let y = this.addHeader(doc, 'Analytics Report', `${dateRange.start.toLocaleDateString()} — ${dateRange.end.toLocaleDateString()}`);

        // Key Metrics
        y = this.addSectionTitle(doc, 'Key Metrics', y);
        autoTable(doc, {
            startY: y,
            head: [['Metric', 'Value']],
            body: [
                ['Total Applications', data.metrics.totalApplications.toLocaleString()],
                ['Screened Candidates', data.metrics.screenedCandidates.toLocaleString()],
                ['Interviews Conducted', data.metrics.interviewsConducted.toLocaleString()],
                ['Offers Extended', data.metrics.offersExtended.toLocaleString()],
                ['Hires Made', data.metrics.hiresMade.toLocaleString()],
                ['Avg Time to Hire', `${data.metrics.averageTimeToHire} days`],
            ],
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
            margin: { left: 15, right: 15 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        // Top Jobs
        if (data.metrics.topJobs?.length) {
            y = this.addSectionTitle(doc, 'Top Positions', y);
            autoTable(doc, {
                startY: y,
                head: [['Position', 'Applications']],
                body: data.metrics.topJobs.map(j => [j.title, j.applications.toString()]),
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
                margin: { left: 15, right: 15 },
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(...COLORS.muted);
            doc.text(`HumanIQ — Confidential | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        return doc.output('blob');
    }

    // ─── Candidate Profile PDF ───────────────────────
    async generateCandidateProfile(candidateId: number): Promise<Blob> {
        const raw = await apiService.get<any>(`/candidates/${candidateId}`);

        const doc = new jsPDF();
        let y = this.addHeader(doc, 'Candidate Profile', raw.full_name || raw.fullName || '');

        y = this.addSectionTitle(doc, 'Personal Information', y);
        autoTable(doc, {
            startY: y,
            body: [
                ['Name', raw.full_name || raw.fullName || ''],
                ['Email', raw.email || ''],
                ['Phone', raw.phone || ''],
                ['Experience', `${raw.experience_years || raw.experienceYears || 0} years`],
                ['Current Position', raw.current_position || raw.currentPosition || ''],
                ['Current Company', raw.current_company || raw.currentCompany || ''],
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: COLORS.muted }, 1: { textColor: COLORS.dark } },
            margin: { left: 15, right: 15 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        // Skills
        const skills = raw.skills || [];
        if (skills.length) {
            y = this.addSectionTitle(doc, 'Skills', y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.dark);
            doc.text(skills.join(', '), 15, y);
        }

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text('HumanIQ — Confidential | Page 1 of 1', 105, 290, { align: 'center' });

        return doc.output('blob');
    }

    // ─── Batch Screening Report ──────────────────────
    async generateBatchScreeningReport(jobId: number): Promise<Blob> {
        const screenings = await apiService.get<any[]>(`/screenings?jobId=${jobId}`);

        const doc = new jsPDF();
        let y = this.addHeader(doc, 'Batch Screening Summary', `Job #${jobId}`);

        y = this.addSectionTitle(doc, 'All Screening Results', y);
        const rows = (screenings || []).map((s: any) => [
            s.candidateName || s.candidate_name || 'Unknown',
            `${s.score}%`,
            s.status || 'pending',
            new Date(s.createdAt || s.created_at).toLocaleDateString(),
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Candidate', 'Score', 'Status', 'Date']],
            body: rows,
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
            margin: { left: 15, right: 15 },
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(...COLORS.muted);
            doc.text(`HumanIQ — Confidential | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        return doc.output('blob');
    }

    // ─── Download Helpers ────────────────────────────
    downloadPDF(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    async downloadScreeningReport(screeningId: number, candidateName: string): Promise<void> {
        const blob = await this.generateScreeningReport(screeningId);
        const filename = `Screening_Report_${candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        this.downloadPDF(blob, filename);
    }

    async downloadInterviewReport(interviewId: number, candidateName: string): Promise<void> {
        const blob = await this.generateInterviewReport(interviewId);
        const filename = `Interview_Report_${candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        this.downloadPDF(blob, filename);
    }

    async downloadAnalyticsReport(dateRange: { start: Date; end: Date }): Promise<void> {
        const blob = await this.generateAnalyticsReport(dateRange);
        const filename = `Analytics_Report_${dateRange.start.toISOString().split('T')[0]}_to_${dateRange.end.toISOString().split('T')[0]}.pdf`;
        this.downloadPDF(blob, filename);
    }

    previewPDF(blob: Blob): void {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    // ─── Data Getters (for preview) ──────────────────
    async getScreeningReportData(screeningId: number): Promise<ScreeningReport> {
        return apiService.get<ScreeningReport>(`/reports/screening/${screeningId}`);
    }

    async getInterviewReportData(interviewId: number): Promise<InterviewReport> {
        return apiService.get<InterviewReport>(`/reports/interview/${interviewId}`);
    }

    async getAnalyticsReportData(dateRange: { start: Date; end: Date }): Promise<AnalyticsReport> {
        const params = new URLSearchParams({
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString()
        });
        return apiService.get<AnalyticsReport>(`/reports/analytics?${params}`);
    }
}

export const pdfReportService = new PDFReportService();
export default pdfReportService;
