import React, { useEffect, useState } from 'react';
import { Target, Plus, Edit, Trash2, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { performanceService, PerformanceGoal } from '../../services/performance.service';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { useConfirmation } from '../../utils/confirmation';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type GoalFormData = {
  title: string;
  description: string;
  category: PerformanceGoal['category'];
  weight: number;
  target: string;
  dueDate: string;
};

const initialFormData: GoalFormData = {
  title: '',
  description: '',
  category: 'individual',
  weight: 10,
  target: '',
  dueDate: ''
};

const GoalManagement: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, ConfirmationDialogComponent } = useConfirmation();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>(initialFormData);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await performanceService.getGoals();
      setGoals(data || []);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      const message = 'Gagal memuat data goals. Silakan refresh halaman.';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingGoal(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (goal: PerformanceGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      weight: goal.weight,
      target: goal.target,
      dueDate: goal.dueDate.split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (goal: PerformanceGoal) => {
    const confirmed = await confirm({
      title: 'Hapus Goal',
      message: `Hapus goal "${goal.title}"?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await performanceService.deleteGoal(goal.id);
      showToast('success', 'Goal berhasil dihapus');
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
      showToast('error', 'Gagal menghapus goal');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.target || !formData.dueDate) return;

    const goalData: Partial<PerformanceGoal> = {
      ...formData,
      startDate: new Date().toISOString(),
      status: 'not_started'
    };

    try {
      setSaving(true);
      if (editingGoal) {
        await performanceService.updateGoal(editingGoal.id, goalData);
        showToast('success', 'Goal berhasil diperbarui');
      } else {
        await performanceService.createGoal(goalData);
        showToast('success', 'Goal berhasil dibuat');
      }
      setShowModal(false);
      resetForm();
      fetchGoals();
    } catch (err) {
      console.error('Failed to save goal:', err);
      showToast('error', editingGoal ? 'Gagal memperbarui goal' : 'Gagal membuat goal');
    } finally {
      setSaving(false);
    }
  };

  const statusTone = (status: PerformanceGoal['status']): 'success' | 'info' | 'danger' | 'neutral' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'overdue': return 'danger';
      default: return 'neutral';
    }
  };

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    inProgress: goals.filter(g => g.status === 'in_progress').length,
    overdue: goals.filter(g => g.status === 'overdue').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Target className="text-brand-600 dark:text-brand-400" size={36} /> Goal Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Kelola target performance individu, tim, dan perusahaan.</p>
        </div>
        <Button variant="primary" size="lg" onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={18} /> New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-5"><p className="text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">Total</p><p className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p></div>
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-5"><p className="text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">In Progress</p><p className="text-3xl font-black text-info-600 dark:text-info-400">{stats.inProgress}</p></div>
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-5"><p className="text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">Completed</p><p className="text-3xl font-black text-success-600 dark:text-success-400">{stats.completed}</p></div>
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-5"><p className="text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">Overdue</p><p className="text-3xl font-black text-danger-600 dark:text-danger-400">{stats.overdue}</p></div>
      </div>

      <div className="bg-white/80 dark:bg-[#111111]/80 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400">Loading goals...</div>
        ) : error ? (
          <div className="p-12 text-center text-danger-600 dark:text-danger-400 flex flex-col items-center gap-3"><AlertCircle />{error}</div>
        ) : goals.length === 0 ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400">Belum ada goal.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-neutral-800">
            {goals.map(goal => (
              <div key={goal.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{goal.title}</h3>
                    <Badge tone={statusTone(goal.status)}>{goal.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">{goal.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1"><Calendar size={14} /> Due {new Date(goal.dueDate).toLocaleDateString()}</span>
                    <span>Category: {goal.category}</span>
                    <span>Weight: {goal.weight}%</span>
                    <span>Target: {goal.target}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {goal.status === 'completed' ? <CheckCircle2 className="text-success-600 dark:text-success-400" /> : <Clock className="text-slate-600 dark:text-slate-400" />}
                  <button onClick={() => handleEdit(goal)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(goal)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-500 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingGoal ? 'Edit Goal' : 'New Goal'}</h2>
            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white" />
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description" className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white min-h-24" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as PerformanceGoal['category'] })} className="px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white">
                <option value="individual">Individual</option>
                <option value="team">Team</option>
                <option value="company">Company</option>
              </select>
              <input type="number" min="0" max="100" value={formData.weight} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} className="px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white" />
            </div>
            <input value={formData.target} onChange={e => setFormData({ ...formData, target: e.target.value })} placeholder="Target" className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white" />
            <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white" />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Goal'}</Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationDialogComponent />
    </div>
  );
};

export default GoalManagement;


