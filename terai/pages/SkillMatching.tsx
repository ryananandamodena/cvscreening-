import React, { useState, useEffect } from 'react';
import {
    BrainCircuit, Target, TrendingUp, AlertTriangle, CheckCircle2,
    Lightbulb, Award, BookOpen, Zap, Loader2, Upload, FileText
} from 'lucide-react';
import { aiService, SkillMatchResult, ExtractedSkills, SuccessPrediction } from '../services/ai.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const SkillMatching: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
    const [jobRequirements, setJobRequirements] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [requirementInput, setRequirementInput] = useState('');
    const [cvText, setCvText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [matchResult, setMatchResult] = useState<SkillMatchResult | null>(null);
    const [extractedSkills, setExtractedSkills] = useState<ExtractedSkills | null>(null);
    const [prediction, setPrediction] = useState<SuccessPrediction | null>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'cv'>('manual');

    // Add skill to candidate skills list
    const addSkill = () => {
        if (skillInput.trim()) {
            setCandidateSkills([...candidateSkills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    // Add requirement to job requirements list
    const addRequirement = () => {
        if (requirementInput.trim()) {
            setJobRequirements([...jobRequirements, requirementInput.trim()]);
            setRequirementInput('');
        }
    };

    // Remove skill from list
    const removeSkill = (index: number) => {
        setCandidateSkills(candidateSkills.filter((_, i) => i !== index));
    };

    // Remove requirement from list
    const removeRequirement = (index: number) => {
        setJobRequirements(jobRequirements.filter((_, i) => i !== index));
    };

    // Perform skill matching
    const performMatching = async () => {
        if (candidateSkills.length === 0 || jobRequirements.length === 0) {
            showToast('error', 'Please add both candidate skills and job requirements');
            return;
        }

        setIsLoading(true);
        try {
            const result = await aiService.matchSkills(candidateSkills, jobRequirements);
            setMatchResult(result);
            showToast('success', 'Skill matching completed!');
        } catch (error) {
            showToast('error', 'Failed to perform skill matching');
        } finally {
            setIsLoading(false);
        }
    };

    // Extract skills from CV
    const extractFromCV = async () => {
        if (!cvText.trim()) {
            showToast('error', 'Please paste CV content');
            return;
        }

        setIsLoading(true);
        try {
            const skills = await aiService.extractSkillsFromCV(cvText);
            setExtractedSkills(skills);
            // Auto-populate candidate skills
            setCandidateSkills(skills.technicalSkills.map(s => s.name));
            showToast('success', 'Skills extracted successfully!');
        } catch (error) {
            showToast('error', 'Failed to extract skills from CV');
        } finally {
            setIsLoading(false);
        }
    };

    // Get match percentage color
    const getMatchColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-500';
        if (percentage >= 60) return 'text-yellow-500';
        return 'text-danger-500';
    };

    // Get priority badge color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-danger-100 dark:bg-danger-500/20 text-red-700 border-red-200';
            case 'important': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    // Get proficiency badge color
    const getProficiencyColor = (proficiency: string) => {
        switch (proficiency) {
            case 'expert': return 'bg-purple-100 text-purple-700';
            case 'advanced': return 'bg-green-100 text-green-700';
            case 'intermediate': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="mx-auto py-8 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-brand-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-brand-500/20">
                    <BrainCircuit size={32} className="text-slate-900 dark:text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        AI Skill Matching
                    </h1>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-1">
                        Match candidate skills with job requirements using AI
                    </p>
                </div>
            </div>

            {/* Tab Selection */}
            <div className="bg-white dark:bg-neutral-900 p-2 rounded-2xl border border-slate-200/60 shadow-lg inline-flex gap-2">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'manual'
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                >
                    <Zap size={18} className="inline mr-2" />
                    Manual Input
                </button>
                <button
                    onClick={() => setActiveTab('cv')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'cv'
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                >
                    <FileText size={18} className="inline mr-2" />
                    Extract from CV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    {activeTab === 'manual' ? (
                        <>
                            {/* Candidate Skills Input */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Award size={20} className="text-brand-500" />
                                    Candidate Skills
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                        placeholder="Enter a skill (e.g., React, Python, SQL)"
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    />
                                    <button
                                        onClick={addSkill}
                                        className="px-4 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {candidateSkills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg font-medium text-sm flex items-center gap-2"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill(index)}
                                                className="text-brand-600 dark:text-brand-400 hover:text-brand-600"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Job Requirements Input */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Target size={20} className="text-purple-500" />
                                    Job Requirements
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={requirementInput}
                                        onChange={(e) => setRequirementInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                                        placeholder="Enter a requirement (e.g., JavaScript, 5+ years experience)"
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                    />
                                    <button
                                        onClick={addRequirement}
                                        className="px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {jobRequirements.map((req, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm flex items-center gap-2"
                                        >
                                            {req}
                                            <button
                                                onClick={() => removeRequirement(index)}
                                                className="text-purple-600 dark:text-purple-400 hover:text-purple-600"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* CV Extract Tab */
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-6 space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Upload size={20} className="text-brand-500" />
                                Paste CV Content
                            </h3>
                            <textarea
                                value={cvText}
                                onChange={(e) => setCvText(e.target.value)}
                                placeholder="Paste the CV/resume content here to extract skills automatically..."
                                rows={12}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none font-mono text-sm"
                            />
                            <button
                                onClick={extractFromCV}
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-slate-900 dark:text-white rounded-xl font-bold hover:from-brand-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Extracting Skills...
                                    </>
                                ) : (
                                    <>
                                        <BrainCircuit size={20} />
                                        Extract Skills with AI
                                    </>
                                )}
                            </button>

                            {/* Extracted Skills Display */}
                            {extractedSkills && (
                                <div className="mt-6 space-y-4">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Extracted Skills</h4>

                                    {/* Technical Skills */}
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Technical Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {extractedSkills.technicalSkills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-3 py-1.5 rounded-lg font-medium text-sm ${getProficiencyColor(skill.proficiency)}`}
                                                >
                                                    {skill.name} ({skill.yearsOfExperience}y)
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Soft Skills */}
                                    {extractedSkills.softSkills.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Soft Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {extractedSkills.softSkills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium text-sm"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Certifications */}
                                    {extractedSkills.certifications && extractedSkills.certifications.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Certifications</p>
                                            <div className="flex flex-wrap gap-2">
                                                {extractedSkills.certifications.map((cert, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm"
                                                    >
                                                        {cert}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Match Button */}
                    <button
                        onClick={performMatching}
                        disabled={isLoading || candidateSkills.length === 0 || jobRequirements.length === 0}
                        className="w-full px-6 py-4 bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 text-slate-900 dark:text-white rounded-2xl font-bold text-lg hover:from-brand-700 hover:via-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                Analyzing Skills...
                            </>
                        ) : (
                            <>
                                <BrainCircuit size={24} />
                                Perform AI Skill Matching
                            </>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {matchResult ? (
                        <>
                            {/* Match Score */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-6">
                                <div className="text-center">
                                    <div className={`text-6xl font-black ${getMatchColor(matchResult.matchPercentage)}`}>
                                        {matchResult.matchPercentage}%
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-2">Overall Match Score</p>
                                </div>

                                {/* Visual Progress Bar */}
                                <div className="mt-6 h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${matchResult.matchPercentage >= 80
                                            ? 'bg-gradient-to-r from-green-400 to-green-500'
                                            : matchResult.matchPercentage >= 60
                                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                                : 'bg-gradient-to-r from-red-400 to-red-500'
                                            }`}
                                        style={{ width: `${matchResult.matchPercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Matched Skills */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                    <CheckCircle2 size={20} className="text-green-500" />
                                    Matched Skills ({matchResult.matchedSkills.length})
                                </h3>
                                <div className="space-y-3">
                                    {matchResult.matchedSkills.map((skill, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-slate-900 dark:text-white">{skill.skill}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getProficiencyColor(skill.proficiency)}`}>
                                                    {skill.proficiency}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-green-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${skill.relevance}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{skill.relevance}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Missing Skills */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                    <AlertTriangle size={20} className="text-amber-500" />
                                    Missing Skills ({matchResult.missingSkills.length})
                                </h3>
                                <div className="space-y-3">
                                    {matchResult.missingSkills.map((skill, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-amber-50 rounded-xl border border-amber-100"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-900 dark:text-white">{skill.skill}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPriorityColor(skill.priority)}`}>
                                                    {skill.priority}
                                                </span>
                                            </div>
                                            {skill.learningPath && (
                                                <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <BookOpen size={14} className="text-brand-500 mt-0.5 shrink-0" />
                                                    <span>{skill.learningPath}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Skill Gap Analysis */}
                            <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl border border-brand-100 p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                    <TrendingUp size={20} className="text-brand-500" />
                                    Skill Gap Analysis
                                </h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{matchResult.skillGapAnalysis}</p>
                            </div>

                            {/* Recommendations */}
                            {matchResult.recommendations && matchResult.recommendations.length > 0 && (
                                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                        <Lightbulb size={20} className="text-yellow-500" />
                                        Recommendations
                                    </h3>
                                    <ul className="space-y-2">
                                        {matchResult.recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                                <Zap size={16} className="text-brand-500 mt-1 shrink-0" />
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty State */
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 shadow-lg p-12 text-center">
                            <BrainCircuit size={64} className="text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Analysis Yet</h3>
                            <p className="text-slate-700 dark:text-slate-300">
                                Add candidate skills and job requirements, then click "Perform AI Skill Matching" to see the analysis.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkillMatching;
