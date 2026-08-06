import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, Save } from 'lucide-react';
import { payrollService, DeductionType, EmployeeDeduction, SalaryConfiguration } from '../../services/payroll.service';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const emptyType = (): Partial<DeductionType> => ({
  name: '', description: '', calculationType: 'fixed', defaultAmount: 0, defaultRate: 0,
});

interface Props {
  employees: SalaryConfiguration[];
}

const DeductionManagementPanel: React.FC<Props> = ({ employees }) => {
  const { showToast } = useToast();
  const [types, setTypes] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newType, setNewType] = useState<Partial<DeductionType>>(emptyType());

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [assignments, setAssignments] = useState<EmployeeDeduction[]>([]);
  const [newAssignment, setNewAssignment] = useState<Partial<EmployeeDeduction>>({});

  const fetchTypes = async () => {
    try {
      const data = await payrollService.getDeductionTypes();
      setTypes(data || []);
    } catch (err) {
      console.error('Failed to load deduction types:', err);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchTypes();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setAssignments([]);
      return;
    }
    payrollService.getEmployeeDeductions(selectedEmployeeId as number)
      .then(setAssignments)
      .catch((err) => console.error('Failed to load employee deductions:', err));
  }, [selectedEmployeeId]);

  const submitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.name?.trim()) {
      showToast('error', 'Nama jenis potongan wajib diisi');
      return;
    }
    try {
      await payrollService.createDeductionType(newType);
      showToast('success', 'Jenis potongan berhasil dibuat');
      setNewType(emptyType());
      setShowTypeForm(false);
      fetchTypes();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal membuat jenis potongan');
    }
  };

  const toggleTypeActive = async (t: DeductionType) => {
    try {
      await payrollService.updateDeductionType(t.id, { ...t, isActive: !t.isActive });
      fetchTypes();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status');
    }
  };

  const deleteType = async (id: number) => {
    try {
      await payrollService.deleteDeductionType(id);
      showToast('success', 'Jenis potongan dihapus');
      fetchTypes();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus (mungkin masih dipakai karyawan)');
    }
  };

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !newAssignment.deductionTypeId) {
      showToast('error', 'Pilih karyawan dan jenis potongan');
      return;
    }
    try {
      await payrollService.createEmployeeDeduction({ ...newAssignment, employeeId: selectedEmployeeId as number });
      showToast('success', 'Potongan berhasil ditambahkan ke karyawan');
      setNewAssignment({});
      const data = await payrollService.getEmployeeDeductions(selectedEmployeeId as number);
      setAssignments(data);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambahkan potongan');
    }
  };

  const toggleAssignmentActive = async (a: EmployeeDeduction) => {
    try {
      await payrollService.setEmployeeDeductionActive(a.id, !a.isActive);
      const data = await payrollService.getEmployeeDeductions(selectedEmployeeId as number);
      setAssignments(data);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status');
    }
  };

  const deleteAssignment = async (id: number) => {
    try {
      await payrollService.deleteEmployeeDeduction(id);
      showToast('success', 'Potongan dihapus dari karyawan');
      const data = await payrollService.getEmployeeDeductions(selectedEmployeeId as number);
      setAssignments(data);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Catalog */}
      <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Katalog Jenis Potongan</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cicilan pinjaman, koperasi, denda, dll — bisa ditambah kapan saja tanpa bantuan IT.</p>
          </div>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowTypeForm((v) => !v)}>
            {showTypeForm ? 'Tutup Form' : 'Jenis Baru'}
          </Button>
        </div>

        {showTypeForm && (
          <form onSubmit={submitType} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 mb-5 bg-slate-50/50 dark:bg-neutral-800/40 rounded-xl border border-slate-200 dark:border-neutral-700">
            <input
              type="text" placeholder="Nama potongan" value={newType.name}
              onChange={(e) => setNewType({ ...newType, name: e.target.value })}
              className="md:col-span-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
            />
            <select
              value={newType.calculationType}
              onChange={(e) => setNewType({ ...newType, calculationType: e.target.value as any })}
              className="px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
            >
              <option value="fixed">Nominal Tetap</option>
              <option value="percentage_of_base">% dari Gaji Pokok</option>
            </select>
            {newType.calculationType === 'percentage_of_base' ? (
              <input
                type="number" step="0.01" placeholder="Tarif (%)"
                value={(newType.defaultRate || 0) * 100}
                onChange={(e) => setNewType({ ...newType, defaultRate: Number(e.target.value) / 100 })}
                className="px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white font-mono"
              />
            ) : (
              <input
                type="number" placeholder="Nominal Default (Rp)"
                value={newType.defaultAmount || 0}
                onChange={(e) => setNewType({ ...newType, defaultAmount: Number(e.target.value) })}
                className="px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white font-mono"
              />
            )}
            <Button type="submit" size="sm" icon={<Save size={14} />}>Simpan</Button>
          </form>
        )}

        <div className="space-y-2">
          {types.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.calculationType === 'percentage_of_base' ? `${(t.defaultRate * 100).toFixed(2)}% dari gaji pokok` : `Rp ${t.defaultAmount.toLocaleString()} / bulan`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={t.isActive ? 'success' : 'neutral'}>{t.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                <button onClick={() => toggleTypeActive(t)} className="text-slate-400 hover:text-brand-600" title="Toggle aktif"><Power size={16} /></button>
                <button onClick={() => deleteType(t.id)} className="text-slate-400 hover:text-danger-600" title="Hapus"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign to employee */}
      <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 rounded-2xl p-8">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5">Terapkan ke Karyawan</h3>

        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
          className="w-full mb-5 px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500"
        >
          <option value="">-- Pilih Karyawan --</option>
          {employees.map((e) => <option key={e.employeeId} value={e.employeeId}>{e.employeeName}</option>)}
        </select>

        {selectedEmployeeId && (
          <>
            <form onSubmit={submitAssignment} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 mb-5 bg-slate-50/50 dark:bg-neutral-800/40 rounded-xl border border-slate-200 dark:border-neutral-700">
              <select
                value={newAssignment.deductionTypeId || ''}
                onChange={(e) => setNewAssignment({ ...newAssignment, deductionTypeId: Number(e.target.value) })}
                className="md:col-span-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
              >
                <option value="">-- Jenis Potongan --</option>
                {types.filter((t) => t.isActive).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input
                type="number" placeholder="Override Nominal (opsional)"
                value={newAssignment.amount ?? ''}
                onChange={(e) => setNewAssignment({ ...newAssignment, amount: e.target.value === '' ? null : Number(e.target.value) })}
                className="px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white font-mono"
              />
              <input
                type="number" placeholder="Sisa Saldo (utk cicilan)"
                value={newAssignment.remainingBalance ?? ''}
                onChange={(e) => setNewAssignment({ ...newAssignment, remainingBalance: e.target.value === '' ? null : Number(e.target.value) })}
                className="px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm outline-none text-slate-900 dark:text-white font-mono"
              />
              <Button type="submit" size="sm" icon={<Plus size={14} />}>Tambahkan</Button>
            </form>

            <div className="space-y-2">
              {assignments.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada potongan untuk karyawan ini.</p>
              ) : (
                assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50/40 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{a.deductionName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {a.remainingBalance != null ? `Sisa saldo: Rp ${a.remainingBalance.toLocaleString()}` : (a.notes || 'Berulang tiap bulan')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={a.isActive ? 'success' : 'neutral'}>{a.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                      <button onClick={() => toggleAssignmentActive(a)} className="text-slate-400 hover:text-brand-600" title="Toggle aktif"><Power size={16} /></button>
                      <button onClick={() => deleteAssignment(a.id)} className="text-slate-400 hover:text-danger-600" title="Hapus"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeductionManagementPanel;
