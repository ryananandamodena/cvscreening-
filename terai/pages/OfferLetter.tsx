import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
   FileSignature, Send, Download, CheckCircle2, XCircle, Clock, Plus,
   Search, Filter, Trash2, Eye, Edit3, Loader2, ChevronDown,
   User, Briefcase, DollarSign, Calendar, AlertCircle, X, RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';

interface OfferLetter {
   id: number;
   candidateId: number;
   jobId: number;
   status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
   templateType: string;
   salaryAmount: number;
   salaryCurrency: string;
   positionTitle: string;
   startDate: string | null;
   offerExpiry: string | null;
   notes: string;
   sentAt: string | null;
   respondedAt: string | null;
   createdAt: string;
   updatedAt: string;
   candidateName: string;
   candidateEmail: string;
   jobTitle: string;
}

interface Candidate {
   id: number;
   fullName: string;
   email: string;
}

interface Job {
   id: number;
   title: string;
   department: string;
}

const OfferLetter: React.FC = () => {
   const { t, lang } = useLanguage();
   const { addNotification } = useNotifications();
   const [offers, setOffers] = useState<OfferLetter[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');
   const [filterStatus, setFilterStatus] = useState('all');
   const [showCreate, setShowCreate] = useState(false);
   const [viewOffer, setViewOffer] = useState<OfferLetter | null>(null);
   const [saving, setSaving] = useState(false);
   const [actionLoading, setActionLoading] = useState<number | null>(null);
   const [error, setError] = useState<string | null>(null);

   // Candidates & Jobs for the create form
   const [candidates, setCandidates] = useState<Candidate[]>([]);
   const [jobs, setJobs] = useState<Job[]>([]);

   const [form, setForm] = useState({
      candidateId: '',
      jobId: '',
      positionTitle: '',
      salaryAmount: '',
      salaryCurrency: 'IDR',
      startDate: '',
      offerExpiry: '',
      templateType: 'standard',
      notes: '',
   });

   const STATUS_CONFIG = {
      draft: { label: t('offers.stats.draft'), color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Edit3 size={12} /> },
      sent: { label: t('offers.stats.sent'), color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Send size={12} /> },
      accepted: { label: t('offers.stats.accepted'), color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 size={12} /> },
      declined: { label: t('offers.stats.declined'), color: 'bg-rose-50 text-rose-700 border-rose-100', icon: <XCircle size={12} /> },
      expired: { label: t('offers.stats.expired'), color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Clock size={12} /> },
   };

   const fetchOffers = useCallback(async () => {
      setLoading(true);
      try {
         const res = await apiService.getOfferLetters();
         setOffers(res.data || []);
      } catch (e) {
         console.error('Failed to fetch offers:', e);
      } finally {
         setLoading(false);
      }
   }, []);

   const fetchCandidatesAndJobs = async () => {
      try {
         const [cRes, jRes] = await Promise.all([
            apiService.getCandidates(),
            apiService.getJobs(),
         ]);
         setCandidates(cRes.data || cRes || []);
         // getJobs already returns data or array
         setJobs(jRes);
      } catch (e) {
         console.error('Failed to fetch candidates/jobs:', e);
      }
   };

   const [searchParams, setSearchParams] = useSearchParams();

   useEffect(() => {
      fetchOffers();
      fetchCandidatesAndJobs();

      // Check URL params for pre-fill
      const createMode = searchParams.get('create');
      const paramCandidateId = searchParams.get('candidateId');
      const paramJobId = searchParams.get('jobId');

      if (createMode === 'true') {
         setShowCreate(true);
         if (paramCandidateId || paramJobId) {
            setForm(prev => ({
               ...prev,
               candidateId: paramCandidateId || prev.candidateId,
               jobId: paramJobId || prev.jobId
            }));
         }
      }
   }, [fetchOffers, searchParams]);

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);
      try {
         await apiService.createOfferLetter({
            candidateId: parseInt(form.candidateId),
            jobId: parseInt(form.jobId),
            positionTitle: form.positionTitle,
            salaryAmount: parseFloat(form.salaryAmount),
            salaryCurrency: form.salaryCurrency,
            startDate: form.startDate,
            offerExpiry: form.offerExpiry,
            templateType: form.templateType,
            notes: form.notes,
         });
         await fetchOffers();
         addNotification('offer_created', t('notifications.offerCreated'), t('notifications.offerCreatedMsg').replace('{candidate}', form.positionTitle || ''));
         setShowCreate(false);
         resetForm();
      } catch (e: any) {
         setError(e.message || t('offers.form.createFailed'));
      } finally {
         setSaving(false);
      }
   };

   const handleSend = async (id: number) => {
      setActionLoading(id);
      try {
         await apiService.sendOfferLetter(id);
         await fetchOffers();
         addNotification('offer_created', t('notifications.offerSent'), t('notifications.offerSentMsg').replace('{candidate}', viewOffer?.candidateName || ''));
         if (viewOffer?.id === id) {
            setViewOffer(prev => prev ? { ...prev, status: 'sent' } : null);
         }
      } catch (e) {
         console.error('Failed to send offer:', e);
      } finally {
         setActionLoading(null);
      }
   };

   const handleStatusUpdate = async (id: number, status: string) => {
      setActionLoading(id);
      try {
         await apiService.updateOfferLetterStatus(id, status);
         await fetchOffers();
         if (viewOffer?.id === id) {
            setViewOffer(prev => prev ? { ...prev, status: status as any } : null);
         }
      } catch (e) {
         console.error('Failed to update status:', e);
      } finally {
         setActionLoading(null);
      }
   };

   const handleDelete = async (id: number) => {
      if (!window.confirm(t('offers.deleteConfirm'))) return;
      setActionLoading(id);
      try {
         await apiService.deleteOfferLetter(id);
         await fetchOffers();
      } catch (e) {
         console.error('Failed to delete offer:', e);
      } finally {
         setActionLoading(null);
      }
   };

   const resetForm = () => {
      setForm({
         candidateId: '', jobId: '', positionTitle: '',
         salaryAmount: '', salaryCurrency: 'IDR',
         startDate: '', offerExpiry: '', templateType: 'standard', notes: '',
      });
      setError(null);
   };

   const filtered = offers.filter(o => {
      const matchSearch =
         o.candidateName.toLowerCase().includes(search.toLowerCase()) ||
         o.positionTitle.toLowerCase().includes(search.toLowerCase()) ||
         o.jobTitle.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      return matchSearch && matchStatus;
   });

   const stats = [
      { id: 'total', label: t('offers.stats.total'), value: offers.length, color: 'text-slate-900', bg: 'bg-slate-50' },
      { id: 'draft', label: t('offers.stats.draft'), value: offers.filter(o => o.status === 'draft').length, color: 'text-slate-500', bg: 'bg-white' },
      { id: 'sent', label: t('offers.stats.sent'), value: offers.filter(o => o.status === 'sent').length, color: 'text-blue-600', bg: 'bg-blue-50/30' },
      { id: 'accepted', label: t('offers.stats.accepted'), value: offers.filter(o => o.status === 'accepted').length, color: 'text-emerald-600', bg: 'bg-emerald-50/30' },
      { id: 'declined', label: t('offers.stats.declined'), value: offers.filter(o => o.status === 'declined').length, color: 'text-rose-600', bg: 'bg-rose-50/30' },
   ];

   const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
         style: 'currency', currency: currency === 'IDR' ? 'IDR' : 'USD',
         minimumFractionDigits: 0, maximumFractionDigits: 0
      }).format(amount);
   };

   const formatDate = (d: string | null) =>
      d ? new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

   return (
      <div className="mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
                  <FileSignature size={12} /> {t('offers.recruitmentFlow')}
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('offers.title')}</h1>
               <p className="text-slate-500 font-medium">{t('offers.subtitle')}</p>
            </div>
            <button
               onClick={() => { setShowCreate(true); resetForm(); }}
               className="group relative px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all overflow-hidden flex items-center gap-3 shadow-2xl"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
               <Plus size={20} className="relative z-10" />
               <span className="relative z-10">{t('offers.create')}</span>
            </button>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((s) => (
               <div key={s.id} className={`${s.bg} p-6 rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                  <p className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
               </div>
            ))}
         </div>

         {/* Advanced Filters */}
         <div className="bg-white/50 backdrop-blur-md p-4 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <input
                  type="text"
                  placeholder={t('common.search') + "..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 focus:border-indigo-600 rounded-2xl text-sm font-medium transition-all outline-none"
               />
            </div>
            <div className="relative">
               <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none px-6 py-3.5 pr-12 bg-white border-2 border-slate-100 focus:border-indigo-600 rounded-2xl text-sm font-black cursor-pointer outline-none"
               >
                  <option value="all">{t('offers.allStatus')}</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                     <option key={k} value={k}>{v.label}</option>
                  ))}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <button
               onClick={fetchOffers}
               className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 hover:text-indigo-600"
               title={t('common.refresh')}
            >
               <RefreshCw size={18} />
            </button>
         </div>

         {/* Modern List View */}
         <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('offers.table.candidate')}</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('offers.table.position')}</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('offers.table.salary')}</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('offers.table.startDate')}</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('offers.table.status')}</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('offers.table.actions')}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {loading ? (
                        <tr>
                           <td colSpan={6} className="px-8 py-32 text-center">
                              <Loader2 size={40} className="mx-auto text-indigo-600 animate-spin mb-4" />
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
                           </td>
                        </tr>
                     ) : filtered.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-8 py-32 text-center">
                              <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                 <FileSignature size={32} className="text-slate-200" />
                              </div>
                              <h3 className="text-lg font-black text-slate-900">{t('common.noData')}</h3>
                              <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mt-2">
                                 {search || filterStatus !== 'all' ? t('offers.noFilterResults') : t('offers.emptyState')}
                              </p>
                              {!search && filterStatus === 'all' && (
                                 <button
                                    onClick={() => setShowCreate(true)}
                                    className="mt-8 px-8 py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                 >
                                    {t('offers.create')}
                                 </button>
                              )}
                           </td>
                        </tr>
                     ) : (
                        filtered.map(o => {
                           const sc = STATUS_CONFIG[o.status];
                           return (
                              <tr key={o.id} className="hover:bg-slate-50/80 transition-colors group">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="size-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white font-black shadow-lg">
                                          {o.candidateName.charAt(0).toUpperCase() || '?'}
                                       </div>
                                       <div>
                                          <p className="font-black text-slate-900 leading-tight">{o.candidateName || '—'}</p>
                                          <p className="text-xs text-slate-400 font-medium mt-0.5">{o.candidateEmail}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <p className="font-bold text-slate-800 text-sm leading-tight">{o.positionTitle || o.jobTitle}</p>
                                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1.5">{o.jobTitle}</p>
                                 </td>
                                 <td className="px-8 py-6">
                                    <p className="font-black text-slate-900 text-sm">{formatCurrency(o.salaryAmount, o.salaryCurrency)}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{o.salaryCurrency} / {t('offers.form.perYear')}</p>
                                 </td>
                                 <td className="px-8 py-6 font-bold text-slate-600 text-sm">
                                    {formatDate(o.startDate)}
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${sc.color}`}>
                                       {sc.icon} {sc.label}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="flex items-center justify-end gap-2 pr-1">
                                       <button
                                          onClick={() => setViewOffer(o)}
                                          className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all shadow-sm"
                                          title={t('common.viewDetails')}
                                       >
                                          <Eye size={16} />
                                       </button>
                                       {o.status === 'draft' && (
                                          <>
                                             <button
                                                onClick={() => handleSend(o.id)}
                                                disabled={actionLoading === o.id}
                                                className="p-3 bg-white border border-slate-100 text-indigo-500 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm disabled:opacity-50"
                                                title={t('offers.detail.issueOffer')}
                                             >
                                                {actionLoading === o.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                             </button>
                                             <button
                                                onClick={() => handleDelete(o.id)}
                                                disabled={actionLoading === o.id}
                                                className="p-3 bg-white border border-slate-100 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm disabled:opacity-50"
                                                title={t('common.delete')}
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                          </>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           );
                        })
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Glassmorphic Create Modal */}
         {showCreate && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-[0_32px_128px_-16px_rgba(15,23,42,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto border border-white/20">
                  <div className="p-10">
                     <div className="flex items-center justify-between mb-10">
                        <div>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('offers.form.title')}</h2>
                           <p className="text-slate-500 font-medium mt-1">{t('offers.form.subtitle')}</p>
                        </div>
                        <button onClick={() => setShowCreate(false)} className="size-12 flex items-center justify-center bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all group">
                           <X size={24} className="text-slate-400 group-hover:text-rose-600" />
                        </button>
                     </div>

                     {error && (
                        <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600 font-black text-sm animate-shake">
                           <AlertCircle size={20} /> {error}
                        </div>
                     )}

                     <form onSubmit={handleCreate} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><User size={12} className="text-indigo-500" /> {t('offers.form.candidate')} *</label>
                              <div className="relative">
                                 <select
                                    required
                                    value={form.candidateId}
                                    onChange={e => setForm({ ...form, candidateId: e.target.value })}
                                    className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-bold outline-none appearance-none transition-all shadow-inner"
                                 >
                                    <option value="">{t('offers.form.selectCandidate')}</option>
                                    {candidates.map(c => (
                                       <option key={c.id} value={c.id}>{c.fullName} — {c.email}</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                           <div className="space-y-2.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Briefcase size={12} className="text-indigo-500" /> {t('offers.form.job')} *</label>
                              <div className="relative">
                                 <select
                                    required
                                    value={form.jobId}
                                    onChange={e => {
                                       const job = jobs.find(j => j.id === parseInt(e.target.value));
                                       setForm({ ...form, jobId: e.target.value, positionTitle: job?.title || form.positionTitle });
                                    }}
                                    className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-bold outline-none appearance-none transition-all shadow-inner"
                                 >
                                    <option value="">{t('offers.form.selectPosition')}</option>
                                    {jobs.map(j => (
                                       <option key={j.id} value={j.id}>{j.title} — {j.department}</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-2.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('offers.form.positionTitle')}</label>
                           <input
                              type="text"
                              required
                              value={form.positionTitle}
                              onChange={e => setForm({ ...form, positionTitle: e.target.value })}
                              placeholder="e.g. Lead Product Engineer"
                              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-bold outline-none transition-all shadow-inner"
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><DollarSign size={12} className="text-emerald-500" /> {t('offers.form.salary')} *</label>
                              <input
                                 type="number"
                                 required
                                 min={0}
                                 value={form.salaryAmount}
                                 onChange={e => setForm({ ...form, salaryAmount: e.target.value })}
                                 placeholder="120000000"
                                 className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-bold outline-none transition-all shadow-inner"
                              />
                           </div>
                           <div className="space-y-2.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('offers.form.currency')}</label>
                              <div className="relative">
                                 <select
                                    value={form.salaryCurrency}
                                    onChange={e => setForm({ ...form, salaryCurrency: e.target.value })}
                                    className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-bold outline-none appearance-none transition-all shadow-inner"
                                 >
                                    <option value="IDR">IDR (Rupiah)</option>
                                    <option value="USD">USD (Dollar)</option>
                                 </select>
                                 <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><Calendar size={12} className="text-indigo-500" /> {t('offers.form.startDate')}</label>
                              <input
                                 type="date"
                                 value={form.startDate}
                                 onChange={e => setForm({ ...form, startDate: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-bold outline-none transition-all shadow-inner"
                              />
                           </div>
                           <div className="space-y-2.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('offers.form.expiry')}</label>
                              <input
                                 type="date"
                                 value={form.offerExpiry}
                                 onChange={e => setForm({ ...form, offerExpiry: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-bold outline-none transition-all shadow-inner"
                              />
                           </div>
                        </div>

                        <div className="space-y-2.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('offers.form.notes')}</label>
                           <textarea
                              rows={4}
                              value={form.notes}
                              onChange={e => setForm({ ...form, notes: e.target.value })}
                              placeholder="Describe benefits, conditions, or specific instructions for the candidate..."
                              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[20px] text-sm font-medium outline-none resize-none transition-all shadow-inner"
                           />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                           <button
                              type="button"
                              onClick={() => setShowCreate(false)}
                              className="flex-1 py-5 bg-slate-50 text-slate-500 font-black rounded-[20px] hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
                           >
                              {t('common.cancel')}
                           </button>
                           <button
                              type="submit"
                              disabled={saving}
                              className="flex-[2] py-5 bg-slate-900 text-white font-black rounded-[20px] hover:bg-indigo-600 hover:shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                           >
                              {saving ? <Loader2 size={18} className="animate-spin" /> : <FileSignature size={18} />}
                              {saving ? t('common.loading') : t('offers.form.saveDraft')}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* Visual Offer Detail Modal */}
         {viewOffer && (
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xl z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500 max-h-[95vh] flex flex-col border border-white/20">
                  <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-rose-500" />

                  <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                     <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                           <div className="size-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black italic shadow-xl">R_AI</div>
                           <div>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('offers.detail.title')}</h2>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{viewOffer.id} · {formatDate(viewOffer.createdAt)}</p>
                           </div>
                        </div>
                        <button onClick={() => setViewOffer(null)} className="size-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                           <X size={20} className="text-slate-400" />
                        </button>
                     </div>

                     <div className="space-y-10">
                        {/* Status Ribbon */}
                        <div className={`p-8 rounded-[32px] border flex items-center justify-between shadow-sm ${STATUS_CONFIG[viewOffer.status].color}`}>
                           <div className="flex items-center gap-4">
                              <div className="size-12 bg-white/50 rounded-2xl flex items-center justify-center shadow-sm">
                                 {React.cloneElement(STATUS_CONFIG[viewOffer.status].icon as React.ReactElement, { size: 24 })}
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('offers.detail.currentStatus')}</p>
                                 <p className="text-xl font-black uppercase tracking-widest">{STATUS_CONFIG[viewOffer.status].label}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('offers.detail.docId')}</p>
                              <p className="text-xs font-black font-mono mt-1">OFFER-{viewOffer.id}-{viewOffer.candidateName.split(' ')[0].toUpperCase()}</p>
                           </div>
                        </div>

                        {/* Letter Content */}
                        <div className="space-y-6 px-4">
                           <div className="space-y-2">
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('offers.detail.employmentOffer')}</h3>
                              <div className="h-1 w-20 bg-indigo-600 rounded-full" />
                           </div>
                           <div className="text-slate-600 text-lg leading-relaxed font-medium">
                              <p className="mb-4">{t('offers.detail.dear').replace('{name}', viewOffer.candidateName)},</p>
                              <p>
                                 {t('offers.detail.proudToOffer').replace('{position}', `"${viewOffer.positionTitle || viewOffer.jobTitle}"`)}
                              </p>
                              {viewOffer.notes && (
                                 <p className="mt-6 p-6 bg-slate-50 border-l-4 border-indigo-600 rounded-r-3xl text-base italic text-slate-500">
                                    "{viewOffer.notes}"
                                 </p>
                              )}
                           </div>
                        </div>

                        {/* Financial Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-8 bg-slate-950 text-white rounded-[32px] shadow-2xl shadow-slate-900/20">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">{t('offers.detail.annualSalary')}</p>
                              <p className="text-3xl font-black tracking-tighter">{formatCurrency(viewOffer.salaryAmount, viewOffer.salaryCurrency)}</p>
                              <div className="mt-4 flex items-center gap-2">
                                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{viewOffer.salaryCurrency} {t('offers.detail.guaranteed')}</span>
                              </div>
                           </div>
                           <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[32px]">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">{t('offers.table.startDate')}</p>
                              <p className="text-3xl font-black text-indigo-900 tracking-tighter">{formatDate(viewOffer.startDate)}</p>
                              <div className="mt-4 flex items-center gap-2">
                                 <Calendar size={14} className="text-indigo-400" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{viewOffer.jobTitle}</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                              <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><User size={20} /></div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('offers.detail.candidateEmail')}</p>
                                 <p className="text-sm font-bold text-slate-700">{viewOffer.candidateEmail}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                              <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><Clock size={20} /></div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('offers.form.expiry')}</p>
                                 <p className="text-sm font-bold text-slate-700">{formatDate(viewOffer.offerExpiry)}</p>
                              </div>
                           </div>
                        </div>

                        {viewOffer.sentAt && (
                           <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between text-blue-700 text-xs font-black uppercase tracking-widest">
                              <div className="flex items-center gap-2"><Send size={14} /> {t('offers.detail.sentAtLabel')}</div>
                              <span>{new Date(viewOffer.sentAt).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}</span>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                     {viewOffer.status === 'draft' && (
                        <button
                           onClick={() => handleSend(viewOffer.id)}
                           disabled={actionLoading === viewOffer.id}
                           className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                           {actionLoading === viewOffer.id ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                           {t('offers.detail.issueOffer')}
                        </button>
                     )}
                     {viewOffer.status === 'sent' && (
                        <>
                           <button
                              onClick={() => handleStatusUpdate(viewOffer.id, 'accepted')}
                              disabled={actionLoading === viewOffer.id}
                              className="flex-1 py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                           >
                              <CheckCircle2 size={20} /> {t('offers.detail.accepted')}
                           </button>
                           <button
                              onClick={() => handleStatusUpdate(viewOffer.id, 'declined')}
                              disabled={actionLoading === viewOffer.id}
                              className="flex-1 py-5 bg-rose-100 text-rose-700 font-black rounded-2xl hover:bg-rose-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                           >
                              <XCircle size={20} /> {t('offers.detail.declined')}
                           </button>
                        </>
                     )}
                     <button
                        onClick={() => setViewOffer(null)}
                        className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                     >
                        {t('offers.detail.close')}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default OfferLetter;
