import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { approvalEngineService, ApprovalRequest, MODULE_LABELS } from '../../services/approvalEngine.service';
import { useToast } from '../../contexts/ToastContext';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu Persetujuan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  returned: 'Dikembalikan',
  cancelled: 'Dibatalkan',
};

const statusTone = (status: string): 'success' | 'danger' | 'warning' | 'neutral' => {
  if (status === 'approved') return 'success';
  if (status === 'rejected' || status === 'returned') return 'danger';
  if (status === 'cancelled') return 'neutral';
  return 'warning';
};

const MyApprovalRequests: React.FC = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setRequests(await approvalEngineService.getMine());
      } catch (err) {
        showToast('error', (err as any).message || 'Gagal memuat data pengajuan');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <ClipboardList size={20} className="text-brand-600 dark:text-brand-400" /> Semua Pengajuan Saya
      </h3>

      {loading ? (
        <div className="animate-pulse h-16 bg-slate-200 dark:bg-neutral-700/50 rounded-xl"></div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pengajuan.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl flex items-start justify-between gap-3">
              <div>
                <Badge tone="brand" className="mb-1.5">{MODULE_LABELS[r.moduleName] || r.moduleName}</Badge>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.summary}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Level {r.currentLevel} • {new Date(r.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
              <Badge tone={statusTone(r.status)}>{STATUS_LABELS[r.status] || r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApprovalRequests;
