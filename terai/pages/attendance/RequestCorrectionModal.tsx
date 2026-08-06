import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { attendanceCorrectionService, CORRECTION_TYPE_LABELS } from '../../services/attendanceCorrection.service';
import { useToast } from '../../contexts/ToastContext';

interface RequestCorrectionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EVIDENCE_REQUIRED_TYPES = ['business_trip', 'remote_working', 'official_duty', 'system_error'];

const todayISO = () => new Date().toISOString().slice(0, 10);

const RequestCorrectionModal: React.FC<RequestCorrectionModalProps> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [attendanceDate, setAttendanceDate] = useState(todayISO());
  const [correctionType, setCorrectionType] = useState('forgot_check_in');
  const [requestedClockIn, setRequestedClockIn] = useState('');
  const [requestedClockOut, setRequestedClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const evidenceRequired = EVIDENCE_REQUIRED_TYPES.includes(correctionType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('error', 'Alasan koreksi wajib diisi');
      return;
    }
    if (evidenceRequired && !evidenceUrl.trim()) {
      showToast('error', 'Bukti pendukung wajib untuk jenis koreksi ini');
      return;
    }
    setSubmitting(true);
    try {
      await attendanceCorrectionService.submit({
        attendanceDate,
        correctionType,
        requestedClockIn: requestedClockIn || undefined,
        requestedClockOut: requestedClockOut || undefined,
        reason,
        evidenceUrl: evidenceUrl || undefined,
        notes: notes || undefined,
      });
      showToast('success', 'Pengajuan koreksi berhasil dikirim');
      onSuccess();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal mengajukan koreksi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg card max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ajukan Koreksi Absensi</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Tanggal Absensi</label>
            <input
              type="date"
              value={attendanceDate}
              max={todayISO()}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Jenis Koreksi</label>
            <select
              value={correctionType}
              onChange={(e) => setCorrectionType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
            >
              {Object.entries(CORRECTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Jam Check In (opsional)</label>
              <input
                type="time"
                value={requestedClockIn}
                onChange={(e) => setRequestedClockIn(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Jam Check Out (opsional)</label>
              <input
                type="time"
                value={requestedClockOut}
                onChange={(e) => setRequestedClockOut(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Alasan <span className="text-danger-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white resize-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
              Bukti Pendukung (URL) {evidenceRequired && <span className="text-danger-500">*</span>}
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="Link foto/dokumen pendukung"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
              required={evidenceRequired}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Catatan Tambahan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white resize-none"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full justify-center" loading={submitting}>
            Kirim Pengajuan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RequestCorrectionModal;
