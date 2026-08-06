import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, X as XIcon } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { attendanceCorrectionService, AttendanceCorrection, CORRECTION_TYPE_LABELS } from '../../services/attendanceCorrection.service';
import { useToast } from '../../contexts/ToastContext';

interface CorrectionApprovalsProps {
  scope: 'manager' | 'hr';
}

const CorrectionApprovals: React.FC<CorrectionApprovalsProps> = ({ scope }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = scope === 'manager'
        ? await attendanceCorrectionService.getPendingForManager()
        : await attendanceCorrectionService.getPendingForHR();
      setItems(data);
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memuat data approval');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const handleReview = async (id: number, approve: boolean) => {
    const comment = comments[id]?.trim();
    if (!comment) {
      showToast('error', 'Komentar wajib diisi untuk approve/reject');
      return;
    }
    setBusyId(id);
    try {
      if (scope === 'manager') {
        await attendanceCorrectionService.managerReview(id, approve, comment);
      } else {
        await attendanceCorrectionService.hrReview(id, approve, comment);
      }
      showToast('success', approve ? 'Pengajuan disetujui' : 'Pengajuan ditolak');
      fetchData();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memproses review');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <ShieldCheck size={20} className="text-brand-600 dark:text-brand-400" />
        {scope === 'manager' ? 'Persetujuan Manager' : 'Persetujuan HR (Final)'}
      </h3>

      {loading ? (
        <div className="animate-pulse h-16 bg-slate-200 dark:bg-neutral-700/50 rounded-xl"></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada pengajuan yang menunggu review.</p>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <div key={c.id} className="p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {c.employeeName} — {new Date(c.attendanceDate).toLocaleDateString('id-ID')}
                  </p>
                  <Badge tone="brand" className="mt-1">{CORRECTION_TYPE_LABELS[c.correctionType] || c.correctionType}</Badge>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{c.reason}</p>
                  {(c.requestedClockIn || c.requestedClockOut) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Diajukan: {c.requestedClockIn || '-'} — {c.requestedClockOut || '-'}
                    </p>
                  )}
                  {c.evidenceUrl && (
                    <a href={c.evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400 underline mt-1 inline-block">
                      Lihat bukti pendukung
                    </a>
                  )}
                  {scope === 'hr' && c.managerComment && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Catatan Manager: {c.managerComment}</p>
                  )}
                </div>
              </div>

              <input
                type="text"
                placeholder="Komentar (wajib diisi)"
                value={comments[c.id] || ''}
                onChange={(e) => setComments((prev) => ({ ...prev, [c.id]: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
              />

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Check size={14} />}
                  loading={busyId === c.id}
                  onClick={() => handleReview(c.id, true)}
                >
                  Setujui
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XIcon size={14} />}
                  loading={busyId === c.id}
                  onClick={() => handleReview(c.id, false)}
                >
                  Tolak
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorrectionApprovals;
