import React, { useEffect, useState } from 'react';
import { Inbox, Check, X as XIcon } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { approvalEngineService, ApprovalRequest, MODULE_LABELS } from '../../services/approvalEngine.service';
import { useToast } from '../../contexts/ToastContext';

const PendingApprovals: React.FC = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      setRequests(await approvalEngineService.getPending());
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memuat data approval');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const comment = comments[id]?.trim();
    if (!comment) {
      showToast('error', 'Komentar wajib diisi');
      return;
    }
    setBusyId(id);
    try {
      await approvalEngineService.act(id, action, comment);
      showToast('success', action === 'approve' ? 'Pengajuan disetujui' : 'Pengajuan ditolak');
      fetchData();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memproses aksi');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <Inbox size={20} className="text-brand-600 dark:text-brand-400" /> Menunggu Persetujuan Saya
      </h3>

      {loading ? (
        <div className="animate-pulse h-16 bg-slate-200 dark:bg-neutral-700/50 rounded-xl"></div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada pengajuan yang menunggu persetujuan Anda.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
              <div>
                <Badge tone="brand" className="mb-1.5">{MODULE_LABELS[r.moduleName] || r.moduleName}</Badge>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {r.requesterEmployeeName} — {r.summary}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {r.levels?.[0]?.levelName} • Level {r.currentLevel}
                </p>
              </div>

              <input
                type="text"
                placeholder="Komentar (wajib diisi)"
                value={comments[r.id] || ''}
                onChange={(e) => setComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
              />

              <div className="flex gap-2">
                <Button variant="primary" size="sm" icon={<Check size={14} />} loading={busyId === r.id} onClick={() => handleAction(r.id, 'approve')}>
                  Setujui
                </Button>
                <Button variant="danger" size="sm" icon={<XIcon size={14} />} loading={busyId === r.id} onClick={() => handleAction(r.id, 'reject')}>
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

export default PendingApprovals;
