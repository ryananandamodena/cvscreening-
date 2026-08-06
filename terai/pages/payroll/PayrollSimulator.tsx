import React, { useState } from 'react';
import { Calculator, Play, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { payrollService, SimulationResult } from '../../services/payroll.service';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const TAX_STATUS_OPTIONS = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const PayrollSimulator: React.FC = () => {
  const [form, setForm] = useState({
    baseSalary: 10000000,
    transportAllowance: 500000,
    mealAllowance: 500000,
    positionAllowance: 0,
    taxStatus: 'TK/0',
    bpjsKesehatanType: 'company_standard',
    bpjsKetenagakerjaanType: 'company_standard',
  });
  const [extraDeductions, setExtraDeductions] = useState<{ name: string; amount: number }[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExtraRow = () => setExtraDeductions((prev) => [...prev, { name: '', amount: 0 }]);
  const updateExtraRow = (idx: number, patch: Partial<{ name: string; amount: number }>) =>
    setExtraDeductions((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeExtraRow = (idx: number) => setExtraDeductions((prev) => prev.filter((_, i) => i !== idx));

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollService.simulate({
        ...form,
        extraDeductions: extraDeductions.filter((r) => r.name.trim() && r.amount > 0),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan simulasi');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="text-brand-600 dark:text-brand-400" size={26} />
          Simulator Gaji &amp; Pajak
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Coba skenario komponen gaji apa saja dan lihat estimasi potongan BPJS, PPh21, dan gaji bersihnya — memakai tarif yang sedang aktif, tanpa menyimpan data apapun.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white/50 dark:bg-[#000000]/50 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800/50 rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Komponen Gaji</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Gaji Pokok (Rp)</label>
            <input
              type="number" min="0"
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Transport</label>
              <input
                type="number" min="0"
                value={form.transportAllowance}
                onChange={(e) => setForm({ ...form, transportAllowance: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Makan</label>
              <input
                type="number" min="0"
                value={form.mealAllowance}
                onChange={(e) => setForm({ ...form, mealAllowance: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Jabatan</label>
              <input
                type="number" min="0"
                value={form.positionAllowance}
                onChange={(e) => setForm({ ...form, positionAllowance: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono text-sm"
              />
            </div>
          </div>

          <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest pt-2">Status Pajak &amp; BPJS</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Status PTKP</label>
            <select
              value={form.taxStatus}
              onChange={(e) => setForm({ ...form, taxStatus: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 appearance-none"
            >
              {TAX_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">BPJS Kesehatan</label>
              <select
                value={form.bpjsKesehatanType}
                onChange={(e) => setForm({ ...form, bpjsKesehatanType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 appearance-none"
              >
                <option value="company_standard">Standard</option>
                <option value="none">Tidak Ikut</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">BPJS Ketenagakerjaan</label>
              <select
                value={form.bpjsKetenagakerjaanType}
                onChange={(e) => setForm({ ...form, bpjsKetenagakerjaanType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 appearance-none"
              >
                <option value="company_standard">Standard</option>
                <option value="none">Tidak Ikut</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Potongan Lain</h2>
              <button onClick={addExtraRow} className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700">
                <Plus size={14} /> Tambah
              </button>
            </div>
            {extraDeductions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Contoh: cicilan pinjaman, koperasi, denda keterlambatan tambahan, dll.</p>
            ) : (
              <div className="space-y-2">
                {extraDeductions.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text" placeholder="Nama potongan"
                      value={row.name}
                      onChange={(e) => updateExtraRow(idx, { name: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-sm outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                    />
                    <input
                      type="number" min="0" placeholder="Jumlah (Rp)"
                      value={row.amount || ''}
                      onChange={(e) => updateExtraRow(idx, { amount: Number(e.target.value) })}
                      className="w-36 px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-sm outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
                    />
                    <button onClick={() => removeExtraRow(idx)} className="text-slate-400 hover:text-danger-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={runSimulation} loading={loading} icon={<Play size={16} />} size="lg" className="w-full justify-center mt-2">
            Jalankan Simulasi
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl p-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="bg-white/50 dark:bg-[#000000]/50 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800/50 rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-5">Hasil Estimasi</h2>

          {!result ? (
            <div className="text-center py-20">
              <Calculator className="mx-auto text-slate-400 mb-3" size={32} />
              <p className="text-slate-600 dark:text-slate-400 text-sm">Isi form di sebelah kiri lalu klik "Jalankan Simulasi"</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-neutral-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Gaji Kotor (Gross)</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(result.grossSalary)}</span>
              </div>

              <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Potongan</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">BPJS Kesehatan</span>
                    <span className="text-danger-600 dark:text-danger-500 font-medium">-{formatCurrency(result.bpjsKesehatan)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">BPJS JHT</span>
                    <span className="text-danger-600 dark:text-danger-500 font-medium">-{formatCurrency(result.bpjsJHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">BPJS JP</span>
                    <span className="text-danger-600 dark:text-danger-500 font-medium">-{formatCurrency(result.bpjsJP)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      PPh21 <Badge tone="neutral">TER {result.terCategory}</Badge>
                    </span>
                    <span className="text-danger-600 dark:text-danger-500 font-medium">-{formatCurrency(result.pph21)}</span>
                  </div>
                  {(result.extraDeductions || []).map((ed, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{ed.name}</span>
                      <span className="text-danger-600 dark:text-danger-500 font-medium">-{formatCurrency(ed.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-neutral-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Potongan</span>
                <span className="font-black text-slate-900 dark:text-white">{formatCurrency(result.totalDeduction)}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-brand-500/30">
                <span className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Gaji Bersih (Take Home)</span>
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(result.netSalary)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollSimulator;
