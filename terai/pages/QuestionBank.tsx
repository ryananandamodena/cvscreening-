
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Filter, FileUp, Edit2, Trash2, X, Briefcase, Layers, Target, HelpCircle } from 'lucide-react';
import { apiService } from '../services/api.service';
import { exportService } from '../services/export.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const QuestionBank = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    question: '',
    category: 'Technical',
    difficulty: 'medium',
    jobId: ''
  });

  const domains = ['Technical', 'Behavioral', 'Situational', 'Soft Skills', 'System Design'];
  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questionsData, jobsData] = await Promise.all([
        apiService.get<any[]>('/questions'),
        apiService.get<any[]>('/jobs')
      ]);
      const qData: any = questionsData;
      const jData: any = jobsData;
      setQuestions(qData?.data || qData || []);
      setJobs(jData?.data || jData || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'question', label: 'Question' },
      { key: 'category', label: 'Category' },
      { key: 'difficulty', label: 'Difficulty' },
      { key: 'jobId', label: 'Job ID' },
    ];
    exportService.exportToCSV(questions, columns, 'question-bank-export');
  };

  const handleOpenModal = (question?: any) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question: question.question,
        category: question.category || 'Technical',
        difficulty: question.difficulty || 'medium',
        jobId: question.jobId || ''
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        question: '',
        category: 'Technical',
        difficulty: 'medium',
        jobId: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setFormData({
      question: '',
      category: 'Technical',
      difficulty: 'medium',
      jobId: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        jobId: formData.jobId ? parseInt(formData.jobId) : null
      };

      if (editingQuestion) {
        await apiService.put(`/questions/${editingQuestion.id}`, payload);
        addToast('success', t('common.saved') || 'Question updated successfully');
      } else {
        await apiService.post('/questions', payload);
        addToast('success', t('common.saved') || 'Question created successfully');
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save question:', err);
      addToast('error', t('common.error') || 'Failed to save question');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.confirmDelete') || 'Are you sure you want to delete this question?')) return;

    try {
      await apiService.delete(`/questions/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
      addToast('success', t('common.deleted') || 'Question deleted successfully');
    } catch (err) {
      console.error('Failed to delete question:', err);
      addToast('error', t('common.error') || 'Failed to delete question');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin size-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1.5 h-12 bg-indigo-600 rounded-full"></div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">{t('questions.bankTitle')}</h1>
          <p className="text-slate-500 font-medium text-lg mt-1 tracking-tight">{t('questions.bankSubtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="group relative px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all overflow-hidden flex items-center gap-3 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={20} className="relative z-10" />
          <span className="relative z-10">{t('questions.addQuestion')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <Layers size={18} className="text-indigo-600" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('questions.allCategories')}</h3>
            </div>
            <div className="space-y-1">
              {domains.map(d => (
                <label key={d} className="flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all group">
                  <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="peer appearance-none size-5 rounded-lg border-2 border-slate-200 checked:bg-indigo-600 checked:border-indigo-600 transition-all" />
                    <X size={12} className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 rotate-45 scale-75" />
                  </div>
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{d}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl flex flex-col md:flex-row gap-6 group">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input
                type="text"
                placeholder={t('questions.searchPlaceholder')}
                className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-2xl text-sm transition-all outline-none font-bold"
              />
            </div>
            <button className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">
              <Filter size={18} /> {t('questions.filter')}
            </button>
            <button
              onClick={handleExport}
              className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] shadow-sm"
            >
              <FileUp size={18} /> {t('questions.exportCsv')}
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('questions.questionText')}</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('questions.category')}</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('questions.difficulty')}</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-10 py-8 max-w-md">
                      <p className="font-bold text-slate-900 text-base leading-relaxed group-hover:text-indigo-600 transition-colors line-clamp-3">{q.question}</p>
                      {q.jobId && (
                        <div className="flex items-center gap-2 mt-3">
                          <Briefcase size={12} className="text-indigo-400" />
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                            {jobs.find(j => j.id === q.jobId)?.title || `ID ${q.jobId}`}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-8">
                      <span className="px-4 py-1.5 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100/50">{q.category || 'General'}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={() => handleOpenModal(q)}
                          className="p-3 bg-white border border-slate-100 hover:border-indigo-600 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-3 bg-white border border-slate-100 hover:border-rose-600 hover:text-rose-600 rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-10 py-32 text-center">
                      <div className="flex flex-col items-center gap-5 text-slate-300">
                        <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                          <BookOpen size={48} className="opacity-40" />
                        </div>
                        <p className="font-black uppercase tracking-[0.3em] text-xs pb-1 border-b-2 border-slate-100">{t('common.noData')}</p>
                        <p className="text-sm font-medium text-slate-400">Your organization's library is empty.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>

              <div className="relative z-10 flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingQuestion ? t('questions.editQuestion') : t('questions.addQuestion')}
                  </h2>
                  <p className="text-slate-500 font-medium mt-1">
                    {editingQuestion ? 'Update validated assessment criteria' : 'Define new high-fidelity interview probe'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="size-12 flex items-center justify-center bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all group"
                >
                  <X size={24} className="text-slate-400 group-hover:text-rose-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <HelpCircle size={12} className="text-indigo-500" /> {t('questions.questionText')}
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    required
                    rows={4}
                    placeholder="e.g. Describe a situation where you had to refactor a critical microservice..."
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-3xl text-sm font-bold transition-all resize-none outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Layers size={12} className="text-indigo-500" /> {t('questions.category')}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-[20px] text-sm font-black transition-all appearance-none cursor-pointer outline-none"
                    >
                      {domains.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Target size={12} className="text-indigo-500" /> {t('questions.difficulty')}
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-[20px] text-sm font-black transition-all appearance-none cursor-pointer outline-none"
                    >
                      {difficulties.map(d => (
                        <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Briefcase size={12} className="text-indigo-500" /> {t('questions.job')}
                  </label>
                  <select
                    value={formData.jobId}
                    onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-[20px] text-sm font-black transition-all appearance-none cursor-pointer outline-none"
                  >
                    <option value="">No specific job (General)</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-5 bg-slate-50 text-slate-500 font-black rounded-[20px] hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-5 bg-slate-900 text-white font-black rounded-[20px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest text-xs"
                  >
                    {editingQuestion ? t('common.save') : t('common.add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;

