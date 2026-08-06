import React, { useEffect, useState } from 'react';
import { FileEdit, X } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { attendanceCorrectionService, AttendanceCorrection, CORRECTION_TYPE_LABELS } from '../../services/attendanceCorrection.service';
import { useToast } from '../../contexts/ToastContext';
import RequestCorrectionModal from './RequestCorrectionModal';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Menunggu Manager',
  manager_approved: 'Menunggu HR',
  rejected_by_manager: 'Ditolak Manager',
  hr_approved: 'Disetujui',
  rejected_by_hr: 'Ditolak HR',
  cancelled: 'Dibatalkan',
};

const statusTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' => {
  if (status === 'hr_approved') return 'success';
  if (status === 'rejected_by_manager' || status === 'rejected_by_hr') return 'danger';
  if (status === 'cancelled') return 'neutral';
  return 'warning';
};

const MyCorrections: React.FC = () => {
  const { showToast } = useToast();
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await attendanceCorrectionService.getMine();
      setCorrections(data);
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memuat data koreksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await attendanceCorrectionService.cancel(id);
      showToast('success', 'Pengajuan dibatalkan');
      fetchData();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal membatalkan pengajuan');
    }
  };

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileEdit size={20} className="text-brand-600 dark:text-brand-400" /> Pengajuan Koreksi Absensi
        </h3>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>Ajukan Koreksi</Button>
      </div>

      {loading ? (
        <div className="animate-pulse h-16 bg-slate-200 dark:bg-neutral-700/50 rounded-xl"></div>
      ) : corrections.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pengajuan koreksi.</p>
      ) : (
        <div className="space-y-3">
          {corrections.map((c) => (
            <div key={c.id} className="p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {new Date(c.attendanceDate).toLocaleDateString('id-ID')} — {CORRECTION_TYPE_LABELS[c.correctionType] || c.correctionType}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{c.reason}</p>
                  {c.managerComment && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manager: {c.managerComment}</p>}
                  {c.hrComment && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">HR: {c.hrComment}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={statusTone(c.status)}>{STATUS_LABELS[c.status] || c.status}</Badge>
                  {(c.status === 'submitted' || c.status === 'manager_approved') && (
                    <button onClick={() => handleCancel(c.id)} title="Batalkan" className="text-slate-400 hover:text-danger-600">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RequestCorrectionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
};

export default MyCorrections;
