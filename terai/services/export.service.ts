// CSV/Excel Export Service
// Generates downloadable CSV files from structured data

export interface ExportColumn {
    key: string;
    label: string;
    formatter?: (value: any) => string;
}

class ExportService {

    /**
     * Generic CSV export from any data array
     */
    exportToCSV(data: Record<string, any>[], columns: ExportColumn[], filename: string): void {
        if (!data.length) return;

        const header = columns.map(c => `"${c.label}"`).join(',');
        const rows = data.map(row =>
            columns.map(col => {
                let val = this.getNestedValue(row, col.key);
                if (col.formatter) val = col.formatter(val);
                if (val === null || val === undefined) val = '';
                // Escape quotes and wrap in quotes
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
        );

        const csvContent = [header, ...rows].join('\n');
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        this.downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
    }

    /**
     * Export screening results to CSV
     */
    exportScreeningsToCSV(screenings: any[], filename?: string): void {
        const columns: ExportColumn[] = [
            { key: 'id', label: 'ID' },
            { key: 'candidateName', label: 'Candidate Name' },
            { key: 'email', label: 'Email' },
            { key: 'jobTitle', label: 'Position' },
            { key: 'score', label: 'Score (%)' },
            { key: 'status', label: 'Status' },
            { key: 'matchedSkills', label: 'Matched Skills', formatter: (v) => Array.isArray(v) ? v.join('; ') : String(v || '') },
            { key: 'missingSkills', label: 'Missing Skills', formatter: (v) => Array.isArray(v) ? v.join('; ') : String(v || '') },
            { key: 'createdAt', label: 'Date', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
        ];

        this.exportToCSV(
            screenings.map(s => ({
                ...s,
                candidateName: s.candidateName || s.candidate_name,
                jobTitle: s.jobTitle || s.job_title,
                matchedSkills: s.matchedSkills || s.matched_skills,
                missingSkills: s.missingSkills || s.missing_skills,
                createdAt: s.createdAt || s.created_at,
            })),
            columns,
            filename || `Screening_Results_${new Date().toISOString().split('T')[0]}`
        );
    }

    /**
     * Export candidates list to CSV
     */
    exportCandidatesToCSV(candidates: any[], filename?: string): void {
        const columns: ExportColumn[] = [
            { key: 'id', label: 'ID' },
            { key: 'fullName', label: 'Full Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'experienceYears', label: 'Experience (Years)' },
            { key: 'currentPosition', label: 'Current Position' },
            { key: 'currentCompany', label: 'Current Company' },
            { key: 'skills', label: 'Skills', formatter: (v) => Array.isArray(v) ? v.join('; ') : String(v || '') },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Added Date', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
        ];

        this.exportToCSV(
            candidates.map(c => ({
                ...c,
                fullName: c.fullName || c.full_name,
                experienceYears: c.experienceYears || c.experience_years,
                currentPosition: c.currentPosition || c.current_position,
                currentCompany: c.currentCompany || c.current_company,
                createdAt: c.createdAt || c.created_at,
            })),
            columns,
            filename || `Candidates_${new Date().toISOString().split('T')[0]}`
        );
    }

    /**
     * Export interviews to CSV
     */
    exportInterviewsToCSV(interviews: any[], filename?: string): void {
        const columns: ExportColumn[] = [
            { key: 'id', label: 'ID' },
            { key: 'candidateName', label: 'Candidate' },
            { key: 'jobTitle', label: 'Position' },
            { key: 'scheduledAt', label: 'Date', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
            { key: 'interviewType', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'rating', label: 'Rating' },
            { key: 'interviewer', label: 'Interviewer' },
        ];

        this.exportToCSV(
            interviews.map(i => ({
                ...i,
                candidateName: i.candidateName || i.candidate_name,
                jobTitle: i.jobTitle || i.job_title,
                scheduledAt: i.scheduledAt || i.scheduled_at,
                interviewType: i.interviewType || i.interview_type,
            })),
            columns,
            filename || `Interviews_${new Date().toISOString().split('T')[0]}`
        );
    }

    // ─── Helpers ─────────────────────────────────────

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

export const exportService = new ExportService();
export default exportService;
