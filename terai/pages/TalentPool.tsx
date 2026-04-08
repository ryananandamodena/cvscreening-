
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { useToast } from '../contexts/ToastContext';
import { CardSkeleton } from '../components/Skeleton';
import {
  Search,
  Filter,
  Mail,
  Calendar,
  MoreVertical,
  Star,
  Download,
  MapPin,
  X,
  ShieldCheck,
  Zap,
  Target,
  FileText,
  Video,
  // Add missing icons used in the component
  Check,
  ChevronRight,
  Linkedin
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { exportService } from '../services/export.service';

const CandidateDetail = ({ candidate, onClose }: { candidate: any, onClose: () => void }) => {
  const { addToast } = useToast();
  const { t } = useLanguage();

  const handleSchedule = () => {
    addToast('success', t('pool.successSchedule') || 'Interview request sent to candidate');
  };

  const handleRequestDocs = () => {
    addToast('success', t('pool.successDocs') || 'Document request sent to candidate');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[50px] shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-500 border border-white/20">
        {/* Left Profile Panel */}
        <div className="w-[380px] bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all mb-10"><X size={20} /></button>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} className="size-32 rounded-[40px] bg-white p-2 shadow-2xl mb-8" alt="" />
            <h2 className="text-4xl font-black tracking-tight">{candidate.name}</h2>
            <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-2">{candidate.role}</p>

            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin size={18} />
                <span className="font-medium text-sm">{candidate.loc}</span>
              </div>
              <div className="flex items-center gap-3 text-indigo-400">
                <Star size={18} fill="currentColor" />
                <span className="font-black text-sm tracking-widest uppercase">{t('pool.matching')}: {candidate.score}%</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/10">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('pool.detail.verification')}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{t('pool.detail.verificationSub')}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-16 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-4">
              <div className="flex gap-2">
                {candidate.tags.map((t: string) => (
                  <span key={t} className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600">{t}</span>
                ))}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('pool.detail.title')}</h3>
            </div>
            <div className="flex gap-3">
              <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all"><FileText size={24} /></button>
              <button className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all"><Video size={24} /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('pool.detail.insights')}</h4>
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-4">
                    <span className="text-xs font-bold text-slate-600">Frontend Logic</span>
                    <div className="h-2 w-32 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-[95%]"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Architectural Thinking</span>
                    <div className="h-2 w-32 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-[88%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('dashboard.recentScreenings')}</h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="size-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Check size={20} /></div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Passed Level 1 Screening</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">AI Evaluator: Zephyr</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Zap size={20} />
                  <h4 className="font-black uppercase tracking-widest text-[10px]">{t('pool.detail.recommendation')}</h4>
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  "This candidate demonstrates elite system design capabilities. <strong>Recommended</strong> for high-complexity architectural roles in APAC or US timezones."
                </p>
              </div>

              <div className="space-y-4 pt-10">
                <button
                  onClick={handleSchedule}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all"
                >
                  {t('pool.detail.schedule')}
                </button>
                <button
                  onClick={handleRequestDocs}
                  className="w-full py-5 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-3xl hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={18} /> {t('pool.detail.requestDocs')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TalentPool = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { addToast } = useToast();
  const { t } = useLanguage();

  const fetchCandidates = async (query = '') => {
    setLoading(true);
    setIsSearching(!!query);
    try {
      const endpoint = query
        ? `/search/candidates?q=${encodeURIComponent(query)}`
        : '/candidates';

      const response = await apiService.get<any>(endpoint);
      if (!response) return;

      const data = Array.isArray(response) ? response : (response.data || []);

      const mapped = data.map((c: any) => ({
        ...c,
        id: c.id,
        name: c.fullName,
        role: c.currentPosition || 'New Candidate',
        exp: `${c.experienceYears || 0}y`,
        loc: 'Remote',
        score: c.score || 85,
        tags: (c.skills && c.skills.length > 0) ? c.skills.slice(0, 3) : ['New Profile'],
        fullSkills: c.skills || [],
        education: c.education || [],
        email: c.email,
        phone: c.phone
      }));
      setCandidates(mapped);

      if (query && data.length > 0) {
        addToast('success', t('pool.foundMatching', { count: String(data.length) }));
      } else if (query && data.length === 0) {
        addToast('info', t('pool.noMatching'));
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      addToast('error', t('pool.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSmartSearch = () => {
    if (!searchQuery.trim()) return;
    fetchCandidates(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchCandidates();
  };

  const handleExport = () => {
    exportService.exportCandidatesToCSV(candidates, 'Talent_Pool_Candidates');
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-slate-200/80 rounded-xl animate-pulse"></div>
            <div className="h-6 w-96 bg-slate-200/80 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-12 w-48 bg-slate-200/80 rounded-2xl animate-pulse"></div>
        </div>
        <div className="h-32 w-full bg-slate-200/80 rounded-[32px] animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 overflow-x-hidden">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-indigo-600 rounded-full"></div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">{t('pool.title')}</h1>
          <p className="text-slate-500 font-medium text-lg mt-1 tracking-tight">{t('pool.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/linkedin-import" className="px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Linkedin size={20} className="text-[#0077B5]" /> {t('pool.importLinkedIn')}
          </Link>
          <button
            onClick={handleExport}
            className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/20"
          >
            <Download size={20} /> {t('pool.exportList')}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl flex flex-col md:flex-row gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <Zap className="text-indigo-600/20" size={32} />
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
            placeholder={t('pool.searchPlaceholder')}
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-2xl text-sm transition-all outline-none font-bold"
          />
        </div>
        <div className="flex gap-4">
          {isSearching && (
            <button onClick={handleClearSearch} className="px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs">
              <X size={18} /> {t('pool.clear')}
            </button>
          )}
          <button className="px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl flex items-center gap-2 hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">
            <Filter size={18} /> {t('pool.filters')}
          </button>
          <button onClick={handleSmartSearch} className="relative overflow-hidden px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 group/btn">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <Target size={18} className="relative z-10" />
            <span className="relative z-10">{t('pool.smartSearch')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {candidates.map((c, i) => (
          <div
            key={i}
            onClick={() => setSelectedCandidate(c)}
            className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:border-indigo-600/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
              <ChevronRight className="text-indigo-600" size={24} />
            </div>

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`} className="size-20 rounded-[32px] bg-slate-50 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500 object-cover" alt="" />
                  <div className="absolute -bottom-1 -right-1 size-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-black text-2xl text-slate-900 group-hover:text-indigo-600 transition-all tracking-tight leading-tight">{c.name}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-[0.2em]">{c.role}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {c.tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-8">
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('pool.location')}</p>
                <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                  <MapPin size={14} className="text-slate-400" /> {c.loc}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('pool.matching')}</p>
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs">
                  <Target size={14} /> {c.score}%
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
              <button className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all">
                {t('pool.contact')}
              </button>
              <button className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">
                {t('pool.profile')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};

export default TalentPool;
