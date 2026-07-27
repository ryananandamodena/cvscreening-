import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Briefcase, ChevronRight, FileUp, Sparkles, CheckCircle2, ShieldCheck, Zap, AlertCircle, X, FileText, Users, Target } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';

const NewJob = () => {
  const [step, setStep] = useState(1);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    description: '',
    employmentType: 'full-time',
    location: 'Remote'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState(0);

  const handleStartScreening = async () => {
    setStep(3);
    setLoading(true);
    setError(null);
    setAnalyzingProgress(10);
    setBulkResults([]);

    try {
      // 1. Create Job first
      setAnalyzingProgress(20);
      const jobRes = await apiService.post<any>('/jobs', {
        title: formData.title,
        department: formData.department,
        description: formData.description,
        requirements: "Extracted from JD",
        location: formData.location,
        employmentType: formData.employmentType,
        status: 'active'
      });

      setAnalyzingProgress(30);

      const result = await apiService.uploadBulkScreening(jobRes.id, formData.description, selectedFiles);
      setAnalyzingProgress(100);
      setBulkResults(result.results || []);

      // Delay to show results
      setTimeout(() => {
        setStep(4); // Show results page
        setLoading(false);
      }, 1000);

    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const viewScreeningResult = (screeningId: number) => {
    navigate(`/screening/${screeningId}`);
  };

  return (
    <div className="mx-auto py-8 space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{t('newJob.title')}</h1>
        <p className="text-slate-700 dark:text-slate-300 text-lg font-medium">{t('newJob.subtitle')}</p>

        <div className="flex justify-center items-center gap-8 pt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className={`size-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${step >= i ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20 scale-110' : 'bg-slate-200 text-slate-600 dark:text-slate-400'
                }`}>
                {step > i ? <CheckCircle2 size={20} /> : i}
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${step >= i ? 'text-brand-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {i === 1 ? t('newJob.step1') : i === 2 ? t('newJob.step2') : t('newJob.step3')}
              </span>
              {i < 3 && <div className="w-12 h-0.5 bg-slate-100"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-12 rounded-[40px] border border-slate-200/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-600 via-purple-600 to-emerald-500"></div>

        {error && (
          <div className="mb-8 p-4 bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-500/20 rounded-2xl flex items-center gap-3 text-danger-600 dark:text-danger-500 font-bold animate-in fade-in zoom-in-95">
            <AlertCircle size={20} />
            {error}
            <button onClick={() => setStep(1)} className="ml-auto text-xs underline">{t('common.restart')}</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.jobTitle')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lead Frontend Architect"
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('jobs.department')}</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-bold appearance-none"
                >
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Human Resources</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('screening.jdLabel')}</label>
              <textarea
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:bg-neutral-900 rounded-2xl transition-all outline-none font-medium text-slate-700 dark:text-slate-300"
                placeholder={t('screening.jdPlaceholder')}
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.description}
              className="w-full py-5 bg-brand-600 text-white font-black rounded-3xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-brand-600/30 transition-all flex items-center justify-center gap-3"
            >
              {t('screening.continueUpload')} <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="relative border-4 border-dashed border-slate-100 dark:border-neutral-800 rounded-[32px] p-16 text-center hover:border-brand-600 transition-all cursor-pointer group bg-slate-50/50">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,text/plain"
                multiple
              />
              <div className="size-24 bg-white dark:bg-neutral-900 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                <FileUp size={40} className={selectedFiles.length > 0 ? "text-emerald-500" : "text-brand-600"} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                {selectedFiles.length > 0 ? t('screening.filesSelected', { count: selectedFiles.length.toString() }) : t('screening.bulkUploadTitle')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium max-w-sm mx-auto">
                {selectedFiles.length > 0 ? t('screening.addMore') : t('screening.dragDrop')}
              </p>
              <button className="mt-8 px-8 py-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all pointer-events-none">
                {selectedFiles.length > 0 ? t('newJob.addMoreFiles') : t('newJob.selectFiles')}
              </button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('screening.selectedFiles', { count: selectedFiles.length.toString() })}</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-brand-600" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{file.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-2 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-xl transition-all text-danger-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all">{t('common.back')}</button>
              <button
                onClick={handleStartScreening}
                disabled={selectedFiles.length === 0}
                className="flex-[2] py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 disabled:opacity-50 shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Sparkles size={18} /> {t('screening.runAI', { count: selectedFiles.length.toString() })}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10 space-y-12 animate-in fade-in duration-500">
            <div className="relative inline-block">
              <div className="size-48 border-[12px] border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{analyzingProgress}%</span>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('screening.complete')}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Zap className="text-brand-600 animate-pulse" size={24} />
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{t('screening.neuralProcessing')}</h3>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium max-w-md mx-auto">
                {t('screening.analyzingCVs', { count: selectedFiles.length.toString() })}
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-100 dark:border-neutral-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-2 rounded-full ${analyzingProgress > 40 ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`}></div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('newJob.skillAlignment')}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{analyzingProgress > 40 ? t('newJob.ready') : t('newJob.scanning')}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 dark:border-neutral-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-2 rounded-full ${analyzingProgress > 80 ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`}></div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('newJob.experienceVerification')}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{analyzingProgress > 80 ? t('newJob.ready') : t('newJob.scanning')}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-brand-600">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('newJob.biasProtocol')}</span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="size-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('screening.bulkComplete')}</h2>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {t('screening.processedCount', { success: bulkResults.filter(r => r.status === 'success').length.toString(), total: bulkResults.length.toString() })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 dark:border-neutral-800 space-y-2">
                <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('newJob.avgScore')}</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">{
                    bulkResults.filter(r => r.status === 'success').length > 0
                      ? Math.round(bulkResults.filter(r => r.status === 'success').reduce((acc, r) => acc + (r.score || 0), 0) / bulkResults.filter(r => r.status === 'success').length)
                      : 0
                  }%</h4>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('newJob.acrossBatch')}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 dark:border-neutral-800 space-y-2">
                <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('newJob.highMatch')}</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-emerald-600">{bulkResults.filter(r => r.status === 'success' && (r.score || 0) >= 80).length}</h4>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('newJob.scored80')}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 dark:border-neutral-800 space-y-2">
                <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('newJob.successRate')}</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-brand-600">{Math.round((bulkResults.filter(r => r.status === 'success').length / (bulkResults.length || 1)) * 100)}%</h4>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('newJob.processed')}</span>
                </div>
              </div>
            </div>

            {bulkResults.filter(r => r.status === 'success').length > 0 && (
              <div className="bg-brand-50/50 p-8 rounded-[32px] border border-brand-100/50 mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/20">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t('newJob.batchIntelligence')}</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{t('newJob.commonGaps')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const gaps: Record<string, number> = {};
                    bulkResults.filter(r => r.status === 'success').forEach(r => {
                      (r.missingSkills || []).forEach((s: string) => gaps[s] = (gaps[s] || 0) + 1);
                    });
                    const topGaps = Object.entries(gaps).sort((a, b) => b[1] - a[1]).slice(0, 3);
                    return topGaps.length > 0 ? topGaps.map(([skill, count]) => (
                      <div key={skill} className="px-4 py-2 bg-white dark:bg-neutral-900 border border-brand-100 rounded-2xl flex items-center gap-3 shadow-sm">
                        <span className="text-sm font-bold text-brand-600">{skill}</span>
                        <div className="w-px h-4 bg-brand-100"></div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{count} {t('newJob.missing')}</span>
                      </div>
                    )) : <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest italic">{t('newJob.noGaps')}</p>;
                  })()}
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-4">{t('newJob.detailedResults', { count: bulkResults.length.toString() })}</h4>
              {bulkResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-3xl border-2 transition-all group ${result.status === 'success'
                    ? 'bg-white dark:bg-neutral-900 border-slate-100 dark:border-neutral-800 hover:border-brand-600 hover:shadow-xl hover:shadow-brand-600/5 cursor-pointer'
                    : 'bg-danger-50 dark:bg-danger-500/10 border-danger-100 dark:border-danger-500/20'
                    }`}
                  onClick={() => result.status === 'success' && result.screeningId && viewScreeningResult(result.screeningId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      <div className={`size-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${result.status === 'success'
                        ? result.score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'
                        : 'bg-danger-100 dark:bg-danger-500/20 text-danger-600 dark:text-danger-500'
                        }`}>
                        {result.status === 'success' ? (
                          <div className="text-center">
                            <span className="text-xl font-black">{result.score}</span>
                            <span className="text-[8px] block font-black uppercase opacity-60">Match</span>
                          </div>
                        ) : <AlertCircle size={28} />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-black text-slate-900 dark:text-white tracking-tight">{result.fileName}</h3>
                          {result.status === 'success' && result.score >= 80 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase tracking-widest">{t('dashboard.highMatch')}</span>
                          )}
                        </div>
                        {result.status === 'success' ? (
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-slate-600 dark:text-slate-400" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{result.candidateName || t('common.unknown')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <FileText size={14} />
                              <span className="text-[10px] font-medium">{result.email}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-danger-600 dark:text-danger-500 font-bold">{result.error}</p>
                        )}
                      </div>
                    </div>
                    {result.status === 'success' && (
                      <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-brand-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                        <ChevronRight size={20} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedFiles([]);
                  setBulkResults([]);
                  setFormData({
                    title: '',
                    department: 'Engineering',
                    description: '',
                    employmentType: 'full-time',
                    location: 'Remote'
                  });
                }}
                className="flex-1 py-4 bg-slate-100 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                {t('screening.startNew')}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 shadow-xl transition-all"
              >
                {t('newJob.goToDashboard')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewJob;
