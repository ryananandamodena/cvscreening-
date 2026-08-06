import React, { useEffect, useState } from 'react';
import { Settings2, Plus, Trash2, Power } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { approvalEngineService, ApprovalFlow, MODULE_LABELS } from '../../services/approvalEngine.service';
import { useToast } from '../../contexts/ToastContext';

interface LevelDraft {
  levelOrder: number;
  levelName: string;
  approverType: 'manager_of_requester' | 'role' | 'specific_user';
  approverRole: string;
  approverEmployeeId: string;
}

const MODULE_OPTIONS = Object.keys(MODULE_LABELS);

const emptyLevel = (order: number): LevelDraft => ({
  levelOrder: order, levelName: '', approverType: 'manager_of_requester', approverRole: '', approverEmployeeId: '',
});

const ApprovalFlowConfig: React.FC = () => {
  const { showToast } = useToast();
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [moduleName, setModuleName] = useState(MODULE_OPTIONS[0]);
  const [flowName, setFlowName] = useState('');
  const [levels, setLevels] = useState<LevelDraft[]>([emptyLevel(1)]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      setFlows(await approvalEngineService.getFlows());
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memuat data flow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addLevel = () => setLevels((prev) => [...prev, emptyLevel(prev.length + 1)]);
  const removeLevel = (idx: number) => setLevels((prev) => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, levelOrder: i + 1 })));
  const updateLevel = (idx: number, patch: Partial<LevelDraft>) =>
    setLevels((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim()) {
      showToast('error', 'Nama flow wajib diisi');
      return;
    }
    for (const l of levels) {
      if (!l.levelName.trim()) {
        showToast('error', 'Nama setiap level wajib diisi');
        return;
      }
      if (l.approverType === 'role' && !l.approverRole.trim()) {
        showToast('error', 'Role approver wajib diisi untuk tipe "role"');
        return;
      }
      if (l.approverType === 'specific_user' && !l.approverEmployeeId.trim()) {
        showToast('error', 'Employee ID wajib diisi untuk tipe "specific_user"');
        return;
      }
    }

    setSubmitting(true);
    try {
      await approvalEngineService.createFlow({
        moduleName,
        flowName,
        isActive: true,
        levels: levels.map((l) => ({
          levelOrder: l.levelOrder,
          levelName: l.levelName,
          approverType: l.approverType,
          approverRole: l.approverType === 'role' ? l.approverRole : undefined,
          approverEmployeeId: l.approverType === 'specific_user' ? parseInt(l.approverEmployeeId, 10) : undefined,
        })),
      });
      showToast('success', 'Approval flow berhasil dibuat');
      setFlowName('');
      setLevels([emptyLevel(1)]);
      setShowForm(false);
      fetchData();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal membuat flow');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (flow: ApprovalFlow) => {
    try {
      await approvalEngineService.setFlowActive(flow.id, !flow.isActive);
      fetchData();
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings2 size={20} className="text-brand-600 dark:text-brand-400" /> Konfigurasi Approval Flow
          </h3>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Tutup' : 'Buat Flow Baru'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50/50 dark:bg-neutral-800/40 rounded-xl border border-slate-200 dark:border-neutral-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Modul</label>
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
                >
                  {MODULE_OPTIONS.map((m) => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Nama Flow</label>
                <input
                  type="text"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Contoh: Approval Lembur Standar"
                  className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-brand-600 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Level Persetujuan (berurutan)</label>
              {levels.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-white dark:bg-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-700">
                  <span className="col-span-1 text-center text-xs font-bold text-slate-500">#{l.levelOrder}</span>
                  <input
                    type="text"
                    placeholder="Nama level (mis. Manager)"
                    value={l.levelName}
                    onChange={(e) => updateLevel(idx, { levelName: e.target.value })}
                    className="col-span-3 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                  />
                  <select
                    value={l.approverType}
                    onChange={(e) => updateLevel(idx, { approverType: e.target.value as LevelDraft['approverType'] })}
                    className="col-span-3 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                  >
                    <option value="manager_of_requester">Manager Pengaju</option>
                    <option value="role">Role Tertentu</option>
                    <option value="specific_user">User Tertentu (Employee ID)</option>
                  </select>
                  {l.approverType === 'role' && (
                    <input
                      type="text"
                      placeholder="e.g. hr, admin"
                      value={l.approverRole}
                      onChange={(e) => updateLevel(idx, { approverRole: e.target.value })}
                      className="col-span-4 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                    />
                  )}
                  {l.approverType === 'specific_user' && (
                    <input
                      type="number"
                      placeholder="Employee ID"
                      value={l.approverEmployeeId}
                      onChange={(e) => updateLevel(idx, { approverEmployeeId: e.target.value })}
                      className="col-span-4 px-2 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-xs outline-none text-slate-900 dark:text-white"
                    />
                  )}
                  {l.approverType === 'manager_of_requester' && <div className="col-span-4" />}
                  <button type="button" onClick={() => removeLevel(idx)} className="col-span-1 text-slate-400 hover:text-danger-600 flex justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={addLevel}>Tambah Level</Button>
            </div>

            <Button type="submit" variant="primary" size="md" loading={submitting}>Simpan Flow</Button>
          </form>
        )}
      </div>

      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Flow yang Terdaftar</h3>
        {loading ? (
          <div className="animate-pulse h-16 bg-slate-200 dark:bg-neutral-700/50 rounded-xl"></div>
        ) : flows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada approval flow yang dikonfigurasi.</p>
        ) : (
          <div className="space-y-3">
            {flows.map((f) => (
              <div key={f.id} className="p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Badge tone="brand" className="mb-1.5">{MODULE_LABELS[f.moduleName] || f.moduleName}</Badge>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{f.flowName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={f.isActive ? 'success' : 'neutral'}>{f.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                    <button onClick={() => toggleActive(f)} title="Toggle aktif" className="text-slate-400 hover:text-brand-600">
                      <Power size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {f.levels.map((l) => (
                    <span key={l.levelOrder} className="text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-full px-3 py-1 text-slate-600 dark:text-slate-300">
                      {l.levelOrder}. {l.levelName} ({l.approverType === 'manager_of_requester' ? 'Manager' : l.approverType === 'role' ? `Role: ${l.approverRole}` : `User: ${l.approverEmployeeName || l.approverEmployeeId}`})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalFlowConfig;
