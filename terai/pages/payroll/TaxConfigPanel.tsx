import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ShieldCheck } from 'lucide-react';
import { payrollService, BPJSRateConfig, PPh21TERBracket } from '../../services/payroll.service';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';

const CATEGORY_LABEL: Record<string, string> = {
  A: 'Kategori A (TK/0, TK/1, K/0)',
  B: 'Kategori B (TK/2, TK/3, K/1, K/2)',
  C: 'Kategori C (K/3)',
};

const TaxConfigPanel: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bpjs, setBpjs] = useState<BPJSRateConfig | null>(null);
  const [allBrackets, setAllBrackets] = useState<PPh21TERBracket[]>([]);
  const [activeCategory, setActiveCategory] = useState<'A' | 'B' | 'C'>('A');
  const [savingBpjs, setSavingBpjs] = useState(false);
  const [savingBrackets, setSavingBrackets] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bpjsData, bracketData] = await Promise.all([
          payrollService.getBPJSConfig(),
          payrollService.getTERBrackets(),
        ]);
        setBpjs(bpjsData);
        setAllBrackets(bracketData || []);
      } catch (err) {
        console.error('Failed to load tax config:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categoryRows = allBrackets.filter((b) => b.category === activeCategory).sort((a, b) => a.bracketOrder - b.bracketOrder);

  const updateRow = (idx: number, patch: Partial<PPh21TERBracket>) => {
    setAllBrackets((prev) => {
      const rows = prev.filter((b) => b.category === activeCategory).sort((a, b) => a.bracketOrder - b.bracketOrder);
      const others = prev.filter((b) => b.category !== activeCategory);
      rows[idx] = { ...rows[idx], ...patch };
      return [...others, ...rows];
    });
  };

  const addRow = () => {
    setAllBrackets((prev) => {
      const rows = prev.filter((b) => b.category === activeCategory);
      const others = prev.filter((b) => b.category !== activeCategory);
      return [...others, ...rows, { category: activeCategory, bracketOrder: rows.length + 1, upTo: 0, rate: 0 }];
    });
  };

  const removeRow = (idx: number) => {
    setAllBrackets((prev) => {
      const rows = prev.filter((b) => b.category === activeCategory).sort((a, b) => a.bracketOrder - b.bracketOrder);
      const others = prev.filter((b) => b.category !== activeCategory);
      rows.splice(idx, 1);
      return [...others, ...rows];
    });
  };

  const saveBpjs = async () => {
    if (!bpjs) return;
    setSavingBpjs(true);
    try {
      await payrollService.updateBPJSConfig(bpjs);
      showToast('success', 'Tarif BPJS berhasil diperbarui');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memperbarui tarif BPJS');
    } finally {
      setSavingBpjs(false);
    }
  };

  const saveBrackets = async () => {
    setSavingBrackets(true);
    try {
      await payrollService.updateTERBrackets(activeCategory, categoryRows);
      showToast('success', `Bracket PPh21 ${activeCategory} berhasil diperbarui`);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memperbarui bracket PPh21');
    } finally {
      setSavingBrackets(false);
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
      {/* BPJS Rates */}
      <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="text-brand-600 dark:text-brand-400" size={20} /> Tarif BPJS (Porsi Karyawan)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Ubah tarif/cap ini kapan saja tanpa perlu bantuan tim IT.</p>
          </div>
          <Button onClick={saveBpjs} loading={savingBpjs} icon={<Save size={16} />} size="sm">Simpan</Button>
        </div>
        {bpjs && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">BPJS Kesehatan Rate (%)</label>
              <input
                type="number" step="0.01" min="0"
                value={bpjs.kesehatanRateEmployee * 100}
                onChange={(e) => setBpjs({ ...bpjs, kesehatanRateEmployee: Number(e.target.value) / 100 })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Cap Upah Kesehatan (Rp)</label>
              <input
                type="number" min="0"
                value={bpjs.kesehatanSalaryCap}
                onChange={(e) => setBpjs({ ...bpjs, kesehatanSalaryCap: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div />
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">JHT Rate (%)</label>
              <input
                type="number" step="0.01" min="0"
                value={bpjs.jhtRateEmployee * 100}
                onChange={(e) => setBpjs({ ...bpjs, jhtRateEmployee: Number(e.target.value) / 100 })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">JP Rate (%)</label>
              <input
                type="number" step="0.01" min="0"
                value={bpjs.jpRateEmployee * 100}
                onChange={(e) => setBpjs({ ...bpjs, jpRateEmployee: Number(e.target.value) / 100 })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Cap Upah JP (Rp)</label>
              <input
                type="number" min="0"
                value={bpjs.jpSalaryCap}
                onChange={(e) => setBpjs({ ...bpjs, jpSalaryCap: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* PPh21 TER Brackets */}
      <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Bracket PPh21 (Metode TER)</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sesuaikan bracket bila DJP merevisi tabel TER. Baris terakhir kosongkan "Sampai Dengan" untuk batas tak terhingga.</p>
          </div>
          <Button onClick={saveBrackets} loading={savingBrackets} icon={<Save size={16} />} size="sm">Simpan {activeCategory}</Button>
        </div>

        <div className="flex gap-3 mb-5">
          {(['A', 'B', 'C'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeCategory === cat ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-neutral-800 z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">#</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Sampai Dengan (Rp/bulan)</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Tarif (%)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
              {categoryRows.map((b, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number" min="0"
                      placeholder="Tak terhingga"
                      value={b.upTo ?? ''}
                      onChange={(e) => updateRow(idx, { upTo: e.target.value === '' ? null : Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number" step="0.01" min="0" max="100"
                      value={b.rate * 100}
                      onChange={(e) => updateRow(idx, { rate: Number(e.target.value) / 100 })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs outline-none focus:border-brand-500 text-slate-900 dark:text-white font-mono"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => removeRow(idx)} className="text-slate-400 hover:text-danger-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={addRow}
          className="mt-3 flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700"
        >
          <Plus size={14} /> Tambah Bracket
        </button>
      </div>
    </div>
  );
};

export default TaxConfigPanel;
