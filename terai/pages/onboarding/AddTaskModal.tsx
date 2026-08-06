import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { onboardingService } from '../../services/onboarding.service';
import { useToast } from '../../contexts/ToastContext';

interface AddTaskModalProps {
  sessionId: number;
  onClose: () => void;
  onCreated: () => void;
}

const ROLE_OPTIONS = ['hr', 'it', 'manager', 'employee', 'finance', 'facility'];

const AddTaskModal: React.FC<AddTaskModalProps> = ({ sessionId, onClose, onCreated }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [assignedRole, setAssignedRole] = useState('hr');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('error', 'Judul task wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      await onboardingService.createTask(sessionId, {
        title, description, category, assignedRole, dueDate: dueDate || undefined,
      });
      showToast('success', 'Task berhasil ditambahkan');
      onCreated();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambahkan task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Task Onboarding</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Judul Task</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Deskripsi</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Kategori</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
          >
            <option value="document">Document</option>
            <option value="training">Training</option>
            <option value="account_setup">Account Setup</option>
            <option value="introduction">Introduction</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Ditugaskan ke</label>
            <select
              value={assignedRole} onChange={(e) => setAssignedRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
            >
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Deadline</label>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <Button type="submit" variant="primary" size="md" className="w-full justify-center" loading={submitting}>
          Tambah Task
        </Button>
      </form>
    </div>
  );
};

export default AddTaskModal;
