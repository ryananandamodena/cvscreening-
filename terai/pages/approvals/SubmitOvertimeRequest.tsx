import React, { useState } from 'react';
import { Clock3 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { overtimeRequestService } from '../../services/overtimeRequest.service';
import { useToast } from '../../contexts/ToastContext';

const todayISO = () => new Date().toISOString().slice(0, 10);

interface SubmitOvertimeRequestProps {
  onSubmitted?: () => void;
}

const SubmitOvertimeRequest: React.FC<SubmitOvertimeRequestProps> = ({ onSubmitted }) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [overtimeDate, setOvertimeDate] = useState(todayISO());
  const [hours, setHours] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('error', 'Alasan lembur wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      await overtimeRequestService.submit({ overtimeDate, hours: parseFloat(hours), reason });
      showToast('success', 'Pengajuan lembur berhasil dikirim untuk approval');
      setReason('');
      setOpen(false);
      onSubmitted?.();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal mengajukan lembur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock3 size={20} className="text-brand-600 dark:text-brand-400" /> Pengajuan Lembur
        </h3>
        <Button variant="primary" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Tutup' : 'Ajukan Lembur'}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Tanggal</label>
              <input
                type="date"
                value={overtimeDate}
                max={todayISO()}
                onChange={(e) => setOvertimeDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Jumlah Jam</label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Alasan</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white resize-none"
              required
            />
          </div>
          <Button type="submit" variant="primary" size="sm" loading={submitting}>Kirim Pengajuan</Button>
        </form>
      )}
    </div>
  );
};

export default SubmitOvertimeRequest;
