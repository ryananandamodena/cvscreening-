import React, { useState, useEffect } from 'react';
import { Wallet, Users, ChevronRight, Download } from 'lucide-react';
import { payrollService, Payslip, SalaryComponent } from '../../services/payroll.service';
import Badge from '../../components/ui/Badge';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const statusTone = (status: string): 'success' | 'warning' | 'neutral' => {
  if (status === 'paid') return 'success';
  if (status === 'released') return 'warning';
  return 'neutral';
};

const MyPayslip: React.FC = () => {
  const [tab, setTab] = useState<'mine' | 'team'>('mine');
  const [myPayslips, setMyPayslips] = useState<Payslip[]>([]);
  const [teamPayslips, setTeamPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payslip | null>(null);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mine, team] = await Promise.all([
          payrollService.getMyPayslips(),
          payrollService.getTeamPayslips().catch(() => []),
        ]);
        setMyPayslips(mine || []);
        setTeamPayslips(team || []);
      } catch (err) {
        console.error('Failed to load payslips:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openDetail = async (p: Payslip) => {
    setSelected(p);
    setLoadingDetail(true);
    try {
      const comps = await payrollService.getMyPayslipComponents(p.id);
      setComponents(comps || []);
    } catch (err) {
      console.error('Failed to load payslip detail:', err);
      setComponents([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const list = tab === 'mine' ? myPayslips : teamPayslips;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Wallet className="text-brand-600 dark:text-brand-400" size={26} />
          Slip Gaji Saya
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Lihat riwayat dan rincian slip gaji Anda.</p>
      </div>

      {teamPayslips.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => setTab('mine')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'mine' ? 'bg-brand-600 text-white' : 'bg-white/50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-neutral-800'
            }`}
          >
            Slip Gaji Saya
          </button>
          <button
            onClick={() => setTab('team')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              tab === 'team' ? 'bg-brand-600 text-white' : 'bg-white/50 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-neutral-800'
            }`}
          >
            <Users size={16} /> Tim Saya ({teamPayslips.length})
          </button>
        </div>
      )}

      <div className="bg-white/50 dark:bg-[#000000]/50 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="mx-auto text-slate-400 mb-3" size={32} />
            <p className="text-slate-700 dark:text-slate-300 font-medium">Belum ada slip gaji yang dirilis</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/50 dark:divide-neutral-800/50">
            {list.map((p) => (
              <div
                key={p.id}
                onClick={() => openDetail(p)}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-100 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
              >
                <div>
                  {tab === 'team' && <p className="text-sm font-bold text-slate-900 dark:text-white">{p.employeeName}</p>}
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{p.departmentName || `Periode #${p.periodId}`}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.employeeIdStr}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(p.netSalary)}</p>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.departmentName || `Periode #${selected.periodId}`}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{selected.employeeName} &middot; {selected.employeeIdStr}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {loadingDetail ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tunjangan</p>
                    <div className="space-y-1.5">
                      {components.filter((c) => c.type === 'allowance').map((c) => (
                        <div key={c.id} className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{c.name}</span>
                          <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Potongan</p>
                    <div className="space-y-1.5">
                      {components.filter((c) => c.type === 'deduction').map((c) => (
                        <div key={c.id} className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{c.name}</span>
                          <span className="text-danger-600 dark:text-danger-500 font-medium">-{formatCurrency(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex justify-between items-center">
                    <span className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Gaji Bersih</span>
                    <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(selected.netSalary)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPayslip;
