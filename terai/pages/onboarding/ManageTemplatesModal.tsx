import React, { useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { onboardingService, OnboardingTemplate, OnboardingTemplateTask } from '../../services/onboarding.service';
import { useToast } from '../../contexts/ToastContext';

interface ManageTemplatesModalProps {
  templates: OnboardingTemplate[];
  onClose: () => void;
  onChanged: () => void;
}

const ROLE_OPTIONS = ['hr', 'it', 'manager', 'employee', 'finance', 'facility'];

const emptyTask = (): OnboardingTemplateTask => ({ title: '', description: '', category: 'other', dueDays: 0, assignedRole: 'hr' });

const ManageTemplatesModal: React.FC<ManageTemplatesModalProps> = ({ templates, onClose, onChanged }) => {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState<OnboardingTemplateTask[]>([emptyTask()]);
  const [submitting, setSubmitting] = useState(false);

  const updateTask = (idx: number, patch: Partial<OnboardingTemplateTask>) =>
    setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const addTaskRow = () => setTasks((prev) => [...prev, emptyTask()]);
  const removeTaskRow = (idx: number) => setTasks((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nama template wajib diisi');
      return;
    }
    if (tasks.some((t) => !t.title.trim())) {
      showToast('error', 'Judul setiap task wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      await onboardingService.createTemplate({ name, tasks });
      showToast('success', 'Template berhasil dibuat');
      setName('');
      setTasks([emptyTask()]);
      setShowForm(false);
      onChanged();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal membuat template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (t: OnboardingTemplate) => {
    try {
      await onboardingService.setTemplateActive(t.id, !t.isActive);
      onChanged();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await onboardingService.deleteTemplate(id);
      showToast('success', 'Template dihapus');
      onChanged();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus template');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl card max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kelola Template Onboarding</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Tutup Form' : 'Buat Template Baru'}
            </Button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50/50 dark:bg-neutral-800/40 rounded-xl border border-slate-200 dark:border-neutral-700">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Nama Template</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Permanent Employee Onboarding"
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Daftar Task</label>
                {tasks.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-700">
                    <input
                      type="text" placeholder="Judul task" value={t.title}
                      onChange={(e) => updateTask(idx, { title: e.target.value })}
                      className="col-span-4 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                    />
                    <select
                      value={t.assignedRole} onChange={(e) => updateTask(idx, { assignedRole: e.target.value })}
                      className="col-span-3 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                    <input
                      type="number" placeholder="H+" value={t.dueDays}
                      onChange={(e) => updateTask(idx, { dueDays: parseInt(e.target.value, 10) || 0 })}
                      className="col-span-2 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                      title="Jatuh tempo (hari setelah mulai onboarding)"
                    />
                    <input
                      type="text" placeholder="Kategori" value={t.category}
                      onChange={(e) => updateTask(idx, { category: e.target.value })}
                      className="col-span-2 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                    />
                    <button type="button" onClick={() => removeTaskRow(idx)} className="col-span-1 text-slate-400 hover:text-danger-600 flex justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={addTaskRow}>Tambah Task</Button>
              </div>

              <Button type="submit" variant="primary" size="md" loading={submitting}>Simpan Template</Button>
            </form>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Template Terdaftar</h4>
            {templates.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada template.</p>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.tasks.length} task</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={t.isActive ? 'success' : 'neutral'}>{t.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                        <button onClick={() => handleToggleActive(t)} title="Toggle aktif" className="text-slate-400 hover:text-brand-600">
                          <Power size={16} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} title="Hapus" className="text-slate-400 hover:text-danger-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {t.tasks.map((task, i) => (
                        <span key={i} className="text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-full px-2.5 py-1 text-slate-600 dark:text-slate-300">
                          H+{task.dueDays} {task.title} ({task.assignedRole})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTemplatesModal;
