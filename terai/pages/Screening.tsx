import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload, FileUp, Search, BrainCircuit, Printer, Download, Sparkles,
  CheckCircle2, XCircle, AlertCircle, FileText, ChevronLeft, ChevronRight,
  Zap, FileSignature, ArrowRight, UserCheck, Users, Clock, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

import { apiService } from '../services/api.service';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import { pdfReportService } from '../services/pdf.service';
import { exportService } from '../services/export.service';

type TabType = 'single' | 'bulk' | 'leaderboard' | 'history' | 'detail';

// --- Framer Motion Shared Variants ---
const pageVariants: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
};

const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.08 } }
};

const fadeUpVariant: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function Screening() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (id) return 'detail';
    const tab = searchParams.get('tab');
    return (tab as TabType) || 'history';
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/screening?tab=${tab}`);
  };

  if (id) {
    return <ScreeningDetail id={id} onBack={() => navigate('/screening?tab=history')} />;
  }

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'single', label: t('screening.singleTab') || 'Single CV', icon: <FileUp size={16} /> },
    { id: 'bulk', label: t('screening.bulkTab') || 'Bulk Upload', icon: <Upload size={16} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Sparkles size={16} /> },
    { id: 'history', label: t('screening.historyTab') || 'History & Analytics', icon: <Search size={16} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 pt-8 pb-4 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('screening.title') || 'CV Screening'}
            </h1>
            <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium mt-1 md:mt-2 max-w-xl">
              {t('screening.subtitle') || 'AI-powered candidate analysis and matching engine.'}
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/skill-matching')}
            className="px-5 py-2.5 bg-white border border-slate-200/80 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
          >
            <BrainCircuit size={18} className="text-brand-600" />
            {t('screening.skillTool') || 'Skill Matrix Tool'}
          </motion.button>
        </div>

        {/* Modern Animated Tabs */}
        <div className="max-w-7xl mx-auto mt-8 flex overflow-x-auto hide-scrollbar gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-5 py-2.5 text-sm font-bold rounded-full transition-colors whitespace-nowrap flex items-center gap-2 z-10 ${
                  isActive ? 'text-blue-700' : 'text-slate-700 dark:text-slate-300 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabScreening"
                    className="absolute inset-0 bg-blue-50/80 border border-blue-100/50 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`${isActive ? 'opacity-100' : 'opacity-70'}`}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {activeTab === 'single' && <SingleScreeningTab />}
            {activeTab === 'bulk' && <BulkScreeningTab />}
            {activeTab === 'leaderboard' && <LeaderboardTab onViewDetail={(id) => navigate(`/screening/${id}`)} />}
            {activeTab === 'history' && <HistoryTab onViewDetail={(id) => navigate(`/screening/${id}`)} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ==========================================
// 1. SINGLE SCREENING TAB
// ==========================================
const SingleScreeningTab: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await apiService.getJobs();
      setJobs(data?.filter((j: any) => j.status === 'active') || []);
      const jobId = searchParams.get('jobId');
      if (jobId) setSelectedJob(Number(jobId));
    };
    fetchJobs();
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!selectedJob || !selectedFile) return;
    const job = jobs.find(j => j.id === selectedJob);
    if (!job || !job.description) {
      addToast('error', t('screening.noJobDescription') || 'Job description is required for analysis');
      return;
    }

    setAnalyzing(true);
    try {
      const data = await apiService.uploadScreening(selectedJob, job.description, selectedFile);
      addToast('success', t('screening.successToast') || 'Analysis complete');
      addNotification('screening_complete', 'Screening Complete', `Analyzed ${selectedFile.name}`);
      navigate(`/screening/${data.id || data.screeningId}`);
    } catch (error) {
      console.error('Screening failed:', error);
      addToast('error', t('screening.errorToast') || 'Screening Failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (analyzing) return <AnalyzingState />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Upload Single Candidate</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-6">Instantly analyze a resume against a specific job requirement.</p>
          
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('screening.selectJob')}</label>
            <div className="relative">
              <select
                value={selectedJob || ''}
                onChange={(e) => setSelectedJob(Number(e.target.value))}
                className="w-full p-4 pl-5 pr-12 bg-slate-50 hover:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all outline-none font-semibold appearance-none text-slate-800 shadow-sm"
              >
                <option value="" disabled>{t('screening.chooseJob')}</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title} — {job.department}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 pointer-events-none rotate-90" size={18} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('screening.uploadCVLabel')}</label>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              selectedFile ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf"
            />
            <div className={`size-16 rounded-2xl shadow-sm flex items-center justify-center transition-all ${selectedFile ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-blue-500 border border-slate-200'}`}>
              <FileUp size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {selectedFile ? selectedFile.name : t('screening.clickUpload') || 'Click to Upload CV'}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1">
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : t('screening.formatHint') || 'PDF files only (max 5MB)'}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!selectedJob || !selectedFile}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={18} />
          {t('screening.startAI') || 'Analyze with AI'}
        </motion.button>
      </div>
    </div>
  );
};

// ==========================================
// 2. BULK SCREENING TAB
// ==========================================
const BulkScreeningTab: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await apiService.getJobs();
      setJobs(data?.filter((j: any) => j.status === 'active') || []);
    };
    fetchJobs();
  }, []);

  const handleStartScreening = async () => {
    if (!selectedJob || selectedFiles.length === 0) return;
    setAnalyzing(true);
    try {
      const job = jobs.find(j => j.id === selectedJob);
      const res = await apiService.uploadBulkScreening(selectedJob, job.description, selectedFiles);
      setResults(res.results || []);
    } catch (err: any) {
      addToast('error', err.message || 'Bulk upload failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (analyzing) return <AnalyzingState isBulk count={selectedFiles.length} />;

  if (results.length > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4 mb-8">
          <div className="size-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm shadow-emerald-100">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bulk Analysis Complete</h2>
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            Successfully processed {results.filter(r => r.status === 'success').length} out of {results.length} resumes.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {results.map((result, i) => (
              <div
                key={i}
                onClick={() => result.status === 'success' && navigate(`/screening/${result.screeningId}`)}
                className={`p-5 flex items-center justify-between transition-colors ${
                  result.status === 'success' ? 'hover:bg-slate-50 cursor-pointer' : 'bg-danger-50 dark:bg-danger-500/10/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    result.status === 'success' 
                      ? result.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      : 'bg-danger-100 dark:bg-danger-500/20 text-danger-600 dark:text-danger-500'
                  }`}>
                    {result.status === 'success' ? <span className="font-black">{result.score}</span> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{result.fileName}</h3>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                      {result.status === 'success' ? result.candidateName || 'Unknown Candidate' : <span className="text-danger-500">{result.error}</span>}
                    </p>
                  </div>
                </div>
                {result.status === 'success' && <ChevronRight className="text-slate-700 dark:text-slate-300" size={20} />}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mt-4">
          <button onClick={() => { setResults([]); setSelectedFiles([]); }} className="px-6 py-3 font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
            Start New Batch
          </button>
          <button onClick={() => navigate(`/screening?tab=leaderboard&jobId=${selectedJob}`)} className="px-6 py-3 font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-[0_8px_20px_rgb(37,99,235,0.25)] transition-all">
            View Job Leaderboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
           <h3 className="font-bold text-slate-800 mb-4">1. Select Target Job</h3>
           <select
              value={selectedJob || ''}
              onChange={(e) => setSelectedJob(Number(e.target.value))}
              className="w-full p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-xl transition-all outline-none font-semibold text-sm text-slate-800"
            >
              <option value="" disabled>Choose a role...</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
        </div>
      </div>
      
      <div className="md:col-span-3">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <h3 className="font-bold text-slate-800">2. Upload Multiple Resumes</h3>
          
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`relative border-2 border-dashed rounded-3xl p-8 md:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              selectedFiles.length > 0 ? 'border-blue-300 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
            }`}
          >
            <input type="file" multiple onChange={(e) => {
              if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" />
            
            <div className={`size-16 rounded-2xl shadow-sm flex items-center justify-center mb-4 transition-all ${selectedFiles.length > 0 ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-blue-500 border border-slate-200'}`}>
               <Upload size={28} />
            </div>
            <p className="font-bold text-slate-800">{t('screening.dragDrop') || 'Drag & drop multiple files here'}</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">or click to browse local files</p>
          </motion.div>

          {selectedFiles.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{selectedFiles.length} files selected</span>
                <button onClick={() => setSelectedFiles([])} className="text-xs text-danger-600 dark:text-danger-500 font-bold hover:underline">Clear all</button>
              </div>
              <div className="space-y-2">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-700 truncate mr-4">{f.name}</span>
                    <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-600 dark:text-slate-400 hover:text-danger-500 transition-colors"><XCircle size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleStartScreening} disabled={!selectedJob || selectedFiles.length === 0}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Sparkles size={18} /> Analyze {selectedFiles.length > 0 ? selectedFiles.length : ''} Candidates
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. LEADERBOARD TAB
// ==========================================
import { Trophy, Medal, MapPin } from 'lucide-react';

const LeaderboardTab: React.FC<{ onViewDetail: (id: number) => void }> = ({ onViewDetail }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await apiService.getJobs();
      setJobs(data?.filter((j: any) => j.status === 'active') || []);
      const jobId = searchParams.get('jobId');
      if (jobId) {
        setSelectedJob(Number(jobId));
      }
    };
    fetchJobs();
  }, [searchParams]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedJob) return;
      setLoading(true);
      try {
        const data = await apiService.getLeaderboard(selectedJob);
        setCandidates(data.records || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedJob]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500 fill-amber-50" size={28} /> Target Job Leaderboard
            </h2>
            <p className="text-slate-700 dark:text-slate-300 font-medium mt-1">See how candidates rank against the ideal criteria.</p>
          </div>
          <div className="w-full md:w-72">
            <select
              value={selectedJob || ''}
              onChange={(e) => {
                setSelectedJob(Number(e.target.value));
                navigate(`/screening?tab=leaderboard&jobId=${e.target.value}`);
              }}
              className="w-full p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-xl transition-all outline-none font-bold text-sm text-slate-800"
            >
              <option value="" disabled>Select Job Target...</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedJob ? (
        <div className="bg-white/50 border border-slate-200/50 rounded-[2rem] p-16 text-center shadow-sm">
          <div className="size-20 bg-brand-50 border border-brand-100/50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600 dark:text-brand-400">
            <Trophy size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Select a Job</h3>
          <p className="text-slate-700 dark:text-slate-300 font-medium mt-2">Choose a job from the dropdown above to view the candidate rankings.</p>
        </div>
      ) : loading ? (
        <AnalyzingState isBulk count={0} />
      ) : candidates.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-[2rem] border border-slate-200/50 shadow-sm">
          <p className="font-semibold text-slate-700 dark:text-slate-300">No candidates analyzed for this job yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {candidates.map((candidate, index) => {
            const isTop3 = index < 3;
            const rankStyles = [
              "bg-gradient-to-r from-amber-50/80 to-yellow-50/30 border-amber-200/60 shadow-[0_8px_30px_rgb(251,191,36,0.15)]",
              "bg-gradient-to-r from-slate-50 to-gray-50/30 border-slate-200 shadow-sm",
              "bg-gradient-to-r from-orange-50/50 to-amber-50/10 border-orange-200/50 shadow-sm"
            ];
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={candidate.id}
                onClick={() => onViewDetail(candidate.id)}
                className={`relative p-5 md:p-6 rounded-[2rem] border cursor-pointer group transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  isTop3 ? rankStyles[index] : 'bg-white border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-brand-200'
                }`}
              >
                {/* Ranking Number */}
                <div className="absolute top-0 right-0 p-8 mr-[-10px] mt-[-20px] pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  <span className="text-[120px] font-black italic">{index + 1}</span>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`relative flex items-center justify-center font-black ${
                      isTop3 ? 'w-14 h-14 rounded-2xl shadow-sm text-xl' : 'w-10 h-10 rounded-xl text-lg text-slate-600 dark:text-slate-400 bg-slate-50 border border-slate-100'
                    } ${index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : index === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' : index === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' : ''}`}>
                      {isTop3 ? <Medal size={24} className={index === 0 ? 'fill-amber-400 text-amber-500' : index === 1 ? 'fill-slate-300 text-slate-600 dark:text-slate-400' : 'fill-orange-300 text-orange-600 dark:text-orange-400'} /> : `#${index + 1}`}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {candidate.candidateName || 'Unknown Applicant'}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{candidate.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-start md:self-auto ml-16 md:ml-0">
                    <div className="flex gap-2">
                       {candidate.matchedSkills?.slice(0, 3).map((skill: string) => (
                         <span key={skill} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${
                            isTop3 ? 'bg-white/60 text-slate-700 border border-black/5' : 'bg-slate-50 text-slate-600 border border-slate-100'
                         }`}>
                           {skill}
                         </span>
                       ))}
                       {candidate.matchedSkills?.length > 3 && (
                         <span className={`px-2 py-1 text-[10px] font-bold rounded-lg flex items-center ${isTop3 ? 'bg-white/40 text-slate-700 dark:text-slate-300' : 'bg-slate-50 text-slate-600 dark:text-slate-400'}`}>
                           +{candidate.matchedSkills.length - 3}
                         </span>
                       )}
                    </div>

                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={`text-3xl font-black tracking-tight ${
                          index === 0 ? 'text-amber-600' : candidate.score >= 80 ? 'text-emerald-500' : candidate.score >= 60 ? 'text-brand-500' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {candidate.score}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">%</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Match Score</span>
                    </div>
                    
                    <ChevronRight className={`transition-transform group-hover:translate-x-1 ${isTop3 ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`} size={20} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. HISTORY & ANALYTICS TAB (The main dashboard)
// ==========================================
const HistoryTab: React.FC<{ onViewDetail: (id: number) => void }> = ({ onViewDetail }) => {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { t } = useLanguage();
  const jobId = searchParams.get('jobId');

  useEffect(() => {
    const fetchScreenings = async () => {
      try {
        setLoading(true);
        const data = await apiService.get<any>(`/screenings?page=${page}&limit=12`);
        if (Array.isArray(data)) {
          setScreenings(data);
          setTotalPages(1);
        } else {
          setScreenings(data.data || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchScreenings();
  }, [page]);

  const filtered = jobId ? screenings.filter(s => s.jobId === Number(jobId)) : screenings;

  // Derive metrics
  const metrics = useMemo(() => ({
    total: filtered.length,
    passed: filtered.filter(s => s.status === 'passed').length,
    pending: filtered.filter(s => s.status === 'pending' || !s.status).length,
    avgScore: filtered.length ? Math.round(filtered.reduce((acc, s) => acc + (s.score || 0), 0) / filtered.length) : 0
  }), [filtered]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-600 dark:text-slate-400">
      <Loader2 className="animate-spin mb-4" size={32} />
      <span className="font-medium text-sm">Loading analytics...</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Metrics Cards (Animated) */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Processed" value={metrics.total} icon={<FileText size={20}/>} color="bg-blue-50 text-blue-600" />
        <MetricCard title="Shortlisted" value={metrics.passed} icon={<UserCheck size={20}/>} color="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Pending Review" value={metrics.pending} icon={<Clock size={20}/>} color="bg-amber-50 text-amber-600" />
        <MetricCard title="Avg Score" value={`${metrics.avgScore}%`} icon={<BrainCircuit size={20}/>} color="bg-brand-50 text-brand-600" />
      </motion.div>

      {/* Modern Table Card */}
      <motion.div variants={fadeUpVariant} initial="initial" animate="animate" className="bg-white rounded-[2rem] border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Screenings</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Printer size={14}/> PDF</button>
            <button className="px-4 py-2 bg-brand-50 border border-brand-100 rounded-xl text-xs font-bold text-brand-700 hover:bg-brand-100 flex items-center gap-2"><Download size={14}/> CSV</button>
          </div>
        </div>

        {filtered.length === 0 ? (
           <div className="p-16 text-center text-slate-600 dark:text-slate-400 flex flex-col items-center">
             <Search size={40} className="mb-4 opacity-50" />
             <p className="font-semibold text-slate-700 dark:text-slate-300">No candidates found in history.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Candidate</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hidden sm:table-cell">Applied Role</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Match Score</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr key={s.id} onClick={() => onViewDetail(s.id)} className="group hover:bg-slate-50/80 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{s.candidateName || 'Unknown Applicant'}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 truncate max-w-[150px]">{s.email}</p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm font-medium text-slate-600 truncate max-w-[200px]">{s.jobDescription}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                            s.score >= 80 ? 'bg-emerald-100 text-emerald-700' : s.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.score}
                        </div>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                           <div className={`h-full rounded-full ${s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${s.score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                         s.status === 'passed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                         s.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-700 dark:text-slate-300'
                       }`}>
                         {s.status === 'passed' ? 'Shortlisted' : s.status === 'rejected' ? 'Rejected' : 'Pending'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ArrowUpRight className="inline text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors" size={20} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Simple Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-30"><ChevronLeft size={16}/></button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-30"><ChevronRight size={16}/></button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color }: { title: string, value: string|number, icon: React.ReactNode, color: string }) => (
  <motion.div variants={fadeUpVariant} className="bg-white p-5 rounded-[2rem] border border-slate-200/50 shadow-sm flex flex-col justify-between min-h-[120px]">
    <div className="flex items-center justify-between">
      <div className={`size-10 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1">{title}</p>
    </div>
  </motion.div>
);

// ==========================================
// 4. DETAILED VIEW COMPONENT
// ==========================================
const ScreeningDetail: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { t } = useLanguage();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiService.get<any>(`/screenings/${id}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id && id !== ':id') fetchData();
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    try {
      await apiService.updateScreeningStatus(Number(id), status);
      addToast('success', `${t('common.success')} - ${status}`);
      // Refresh local data to show updated status if needed, or simply update state
      setData((prev:any) => ({ ...prev, status }));
      
      if (status === 'Passed') {
        addToast('info', 'Interview auto-scheduled and notification sent.');
      }

      // Automatically go back to list after a short delay so they can see the success message
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err) {
      console.error(err);
      addToast('error', t('common.error'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <AnalyzingState />;
  if (!data) return <div className="p-20 text-center font-bold text-slate-600 dark:text-slate-400">Resume not found.</div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen bg-slate-50/50 pb-20">
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="size-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm text-slate-600">
               <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{data.candidateName || 'Unknown Candidate'}</h1>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{data.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              disabled={updating}
              onClick={() => handleStatusUpdate('Rejected')}
              className="px-5 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-full text-sm hover:bg-rose-100 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
            <button 
              disabled={updating}
              onClick={() => handleStatusUpdate('Passed')}
              className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-full text-sm hover:bg-emerald-600 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {updating ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} 
              Shortlist
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-8">
        {/* Main Content Pane */}
        <div className="md:col-span-2 space-y-6">
           <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200/50 shadow-sm min-h-[600px] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none -mr-20 -mt-20"></div>
              
              <div className="relative z-10 space-y-10">
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-3 border-b border-slate-100 pb-2">Target Profile (JD)</h3>
                    <p className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed max-w-2xl">{data.jobDescription}</p>
                 </div>
                 
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 border-b border-slate-100 pb-2">Extracted Resume Content</h3>
                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{data.cvContent}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* AI Analysis Sidebar */}
        <div className="space-y-6">
           <div className="bg-brand-50 dark:bg-[#0f172a] text-slate-900 dark:text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
             
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-8 flex items-center gap-2">
               <Sparkles size={14} className="text-blue-600 dark:text-blue-400" /> AI Evaluation
             </h3>
             
             <div className="flex flex-col items-center mb-10 relative">
               <svg className="size-40 -rotate-90 transform" viewBox="0 0 36 36">
                  <circle className="stroke-slate-800" cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" />
                  <motion.circle 
                     initial={{ strokeDasharray: "0 100" }}
                     animate={{ strokeDasharray: `${data.score} 100` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="stroke-blue-500" cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">{data.score}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 mt-1">Match</span>
                </div>
             </div>

             <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest mb-2">Neural Reasoning</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">"{data.reasoning || 'No specific reasoning provided.'}"</p>
             </div>
           </div>

           <div className="bg-white p-8 rounded-[2rem] border border-slate-200/50 shadow-sm">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-6">Skill Analysis</h3>
             
             <div className="space-y-5">
               <div>
                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Found Matches</p>
                 <div className="flex flex-wrap gap-1.5">
                   {data.matchedSkills?.length ? data.matchedSkills.map((s:string) => (
                     <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold">{s}</span>
                   )) : <span className="text-xs text-slate-600 dark:text-slate-400">None detected.</span>}
                 </div>
               </div>
               
               <div>
                 <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Missing Skills</p>
                 <div className="flex flex-wrap gap-1.5">
                   {data.missingSkills?.length ? data.missingSkills.map((s:string) => (
                     <span key={s} className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[10px] font-bold">{s}</span>
                   )) : <span className="text-xs text-slate-600 dark:text-slate-400">None detected.</span>}
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// 5. HELPER STATE COMPONENTS
// ==========================================
import { Loader2 } from 'lucide-react';

export const AnalyzingState = ({ isBulk, count }: { isBulk?: boolean, count?: number }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
    <div className="relative">
       <div className="absolute inset-0 bg-brand-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
       <div className="size-32 border-[8px] border-slate-100 border-t-brand-600 rounded-full animate-spin relative z-10"></div>
       <Sparkles className="absolute inset-0 m-auto text-brand-600 animate-pulse" size={32} />
    </div>
    <div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Neural Processing</h2>
      <p className="text-slate-700 dark:text-slate-300 font-medium mt-2 max-w-sm">
        {isBulk ? `AI is reading and scoring ${count} resumes in parallel...` : 'AI is reading the curriculum vitae and cross-referencing against JD parameters...'}
      </p>
    </div>
  </motion.div>
);
