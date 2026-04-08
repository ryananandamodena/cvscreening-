import React, { useState, useEffect } from 'react';
import {
    Linkedin, Search, UserPlus, Filter, MapPin, Briefcase,
    GraduationCap, Award, Loader2, CheckCircle2, AlertCircle,
    ExternalLink, ChevronDown, X, Users, Building2, Clock
} from 'lucide-react';
import { linkedInService, LinkedInProfile, LinkedInSearchParams } from '../services/linkedin.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const LinkedInImport: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [experienceLevel, setExperienceLevel] = useState<string>('');
    const [candidates, setCandidates] = useState<LinkedInProfile[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [importingIds, setImportingIds] = useState<string[]>([]);
    const [importedIds, setImportedIds] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Add skill to filter
    const addSkill = () => {
        if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
            setSelectedSkills([...selectedSkills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    // Remove skill from filter
    const removeSkill = (skill: string) => {
        setSelectedSkills(selectedSkills.filter(s => s !== skill));
    };

    // Search candidates
    const searchCandidates = async () => {
        if (!searchQuery.trim()) {
            showToast('error', 'Please enter search keywords');
            return;
        }

        setIsLoading(true);
        try {
            const params: LinkedInSearchParams = {
                keywords: searchQuery,
                location: location || undefined,
                jobTitle: jobTitle || undefined,
                skills: selectedSkills.length > 0 ? selectedSkills : undefined,
                experienceLevel: experienceLevel as any || undefined,
                limit: 20,
            };

            const results = await linkedInService.searchCandidates(params);
            setCandidates(results);
            setSelectedCandidates([]);
            showToast('success', `Found ${results.length} candidates`);
        } catch (error) {
            showToast('error', 'Failed to search candidates');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle candidate selection
    const toggleCandidate = (id: string) => {
        if (selectedCandidates.includes(id)) {
            setSelectedCandidates(selectedCandidates.filter(c => c !== id));
        } else {
            setSelectedCandidates([...selectedCandidates, id]);
        }
    };

    // Select all candidates
    const selectAll = () => {
        if (selectedCandidates.length === candidates.length) {
            setSelectedCandidates([]);
        } else {
            setSelectedCandidates(candidates.map(c => c.id));
        }
    };

    // Import single candidate
    const importCandidate = async (profile: LinkedInProfile) => {
        setImportingIds([...importingIds, profile.id]);
        try {
            const result = await linkedInService.importCandidate(profile);
            if (result.success) {
                setImportedIds([...importedIds, profile.id]);
                showToast('success', `Successfully imported ${profile.firstName} ${profile.lastName}`);
            } else {
                showToast('error', `Failed to import: ${result.error}`);
            }
        } catch (error) {
            showToast('error', 'Failed to import candidate');
        } finally {
            setImportingIds(importingIds.filter(id => id !== profile.id));
        }
    };

    // Import selected candidates
    const importSelected = async () => {
        if (selectedCandidates.length === 0) {
            showToast('error', 'Please select candidates to import');
            return;
        }

        const toImport = candidates.filter(c => selectedCandidates.includes(c.id) && !importedIds.includes(c.id));

        for (const candidate of toImport) {
            await importCandidate(candidate);
        }
    };

    // Calculate years of experience
    const calculateExperience = (positions: LinkedInProfile['positions']) => {
        let totalMonths = 0;
        const now = new Date();

        positions.forEach(pos => {
            const startParts = pos.startDate.split('-');
            const startYear = parseInt(startParts[0]);
            const startMonth = parseInt(startParts[1] || '1');

            let endYear: number, endMonth: number;
            if (pos.isCurrent || !pos.endDate) {
                endYear = now.getFullYear();
                endMonth = now.getMonth() + 1;
            } else {
                const endParts = pos.endDate.split('-');
                endYear = parseInt(endParts[0]);
                endMonth = parseInt(endParts[1] || '1');
            }

            totalMonths += (endYear - startYear) * 12 + (endMonth - startMonth);
        });

        return Math.round(totalMonths / 12 * 10) / 10;
    };

    return (
        <div className="mx-auto py-8 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-[#0077B5] p-4 rounded-2xl shadow-lg">
                    <Linkedin size={32} className="text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        LinkedIn Import
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Search and import candidates from LinkedIn
                    </p>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-6 space-y-4">
                {/* Main Search */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchCandidates()}
                            placeholder="Search by name, skills, or keywords..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/20 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${showFilters
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Filter size={18} />
                        Filters
                        <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={searchCandidates}
                        disabled={isLoading}
                        className="px-6 py-3 bg-[#0077B5] text-white rounded-xl font-bold hover:bg-[#006399] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search size={20} />
                                Search
                            </>
                        )}
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Location</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., Jakarta, Indonesia"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Job Title</label>
                            <div className="relative">
                                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    placeholder="e.g., Software Engineer"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Experience Level</label>
                            <select
                                value={experienceLevel}
                                onChange={(e) => setExperienceLevel(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/20 outline-none transition-all"
                            >
                                <option value="">All Levels</option>
                                <option value="entry">Entry Level (0-2 years)</option>
                                <option value="mid">Mid Level (2-5 years)</option>
                                <option value="senior">Senior Level (5-10 years)</option>
                                <option value="executive">Executive (10+ years)</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-600 mb-2">Required Skills</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                    placeholder="Add a skill filter..."
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/20 outline-none transition-all"
                                />
                                <button
                                    onClick={addSkill}
                                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-all"
                                >
                                    Add
                                </button>
                            </div>
                            {selectedSkills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedSkills.map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-[#0077B5]/10 text-[#0077B5] rounded-full text-sm font-medium flex items-center gap-1"
                                        >
                                            {skill}
                                            <button onClick={() => removeSkill(skill)} className="hover:text-[#006399]">
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            {candidates.length > 0 && (
                <div className="space-y-4">
                    {/* Actions Bar */}
                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/60 p-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={selectAll}
                                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-all"
                            >
                                {selectedCandidates.length === candidates.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-sm text-slate-400">
                                {selectedCandidates.length} selected
                            </span>
                        </div>
                        {selectedCandidates.length > 0 && (
                            <button
                                onClick={importSelected}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                            >
                                <UserPlus size={18} />
                                Import Selected ({selectedCandidates.length})
                            </button>
                        )}
                    </div>

                    {/* Candidate Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {candidates.map(candidate => {
                            const isSelected = selectedCandidates.includes(candidate.id);
                            const isImporting = importingIds.includes(candidate.id);
                            const isImported = importedIds.includes(candidate.id);
                            const yearsExp = calculateExperience(candidate.positions);

                            return (
                                <div
                                    key={candidate.id}
                                    className={`bg-white rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                                        ? 'border-[#0077B5] shadow-lg shadow-[#0077B5]/10'
                                        : 'border-slate-200/60 hover:border-slate-300'
                                        } ${isImported ? 'opacity-60' : ''}`}
                                    onClick={() => !isImported && toggleCandidate(candidate.id)}
                                >
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={candidate.pictureUrl || `https://ui-avatars.com/api/?name=${candidate.firstName}+${candidate.lastName}&background=0077B5&color=fff`}
                                                alt={`${candidate.firstName} ${candidate.lastName}`}
                                                className="w-16 h-16 rounded-xl object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 truncate">
                                                        {candidate.firstName} {candidate.lastName}
                                                    </h3>
                                                    {isImported && (
                                                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 truncate">{candidate.headline}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                    {candidate.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {candidate.location}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {yearsExp} years exp
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isSelected && !isImported && (
                                                    <div className="w-6 h-6 bg-[#0077B5] rounded-full flex items-center justify-center">
                                                        <CheckCircle2 size={16} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        {candidate.summary && (
                                            <p className="mt-4 text-sm text-slate-600 line-clamp-2">
                                                {candidate.summary}
                                            </p>
                                        )}

                                        {/* Skills */}
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {candidate.skills.slice(0, 6).map(skill => (
                                                <span
                                                    key={skill}
                                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length > 6 && (
                                                <span className="px-2 py-0.5 text-slate-400 text-xs">
                                                    +{candidate.skills.length - 6} more
                                                </span>
                                            )}
                                        </div>

                                        {/* Experience */}
                                        {candidate.positions.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                    <Building2 size={14} />
                                                    Current Position
                                                </div>
                                                <div className="text-sm">
                                                    <span className="font-medium text-slate-900">
                                                        {candidate.positions[0].title}
                                                    </span>
                                                    <span className="text-slate-400 mx-1">at</span>
                                                    <span className="text-slate-600">
                                                        {candidate.positions[0].company}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Education */}
                                        {candidate.educations.length > 0 && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                                <GraduationCap size={14} />
                                                {candidate.educations[0].school}
                                                {candidate.educations[0].degree && (
                                                    <span className="text-slate-400">
                                                        - {candidate.educations[0].degree}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {candidate.certifications.length > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                                                        <Award size={12} />
                                                        {candidate.certifications.length} Certifications
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    importCandidate(candidate);
                                                }}
                                                disabled={isImporting || isImported}
                                                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-1 ${isImported
                                                    ? 'bg-green-100 text-green-700 cursor-default'
                                                    : isImporting
                                                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                                                        : 'bg-[#0077B5] text-white hover:bg-[#006399]'
                                                    }`}
                                            >
                                                {isImported ? (
                                                    <>
                                                        <CheckCircle2 size={14} />
                                                        Imported
                                                    </>
                                                ) : isImporting ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Importing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={14} />
                                                        Import
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {candidates.length === 0 && !isLoading && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-12 text-center">
                    <Linkedin size={64} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Search LinkedIn Candidates</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Enter keywords, skills, or job titles to find potential candidates from LinkedIn.
                        Use filters to narrow down your search.
                    </p>
                </div>
            )}
        </div>
    );
};

export default LinkedInImport;
