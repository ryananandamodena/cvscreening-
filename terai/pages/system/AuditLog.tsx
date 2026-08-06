import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Cpu, Search, AlertTriangle, 
  TerminalSquare, Download, Filter, FileText
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface AuditLog {
  id: number;
  userEmail: string;
  action: string;
  module: string;
  entityType: string;
  ipAddress: string;
  createdAt: string;
}

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (moduleFilter) params.append('module', moduleFilter);
      if (actionFilter) params.append('action', actionFilter);
      const res = await apiService.get<any>(`/audit-trail?${params.toString()}`);
      // API might return standard structure
      let dataToSet = [];
      if (Array.isArray(res)) {
        dataToSet = res;
      } else if (res && Array.isArray(res.data)) {
        dataToSet = res.data;
      } else if (res && res.data && Array.isArray(res.data.data)) {
        dataToSet = res.data.data;
      }
      setLogs(dataToSet);
      setTotal(res.total || (res.data ? dataToSet.length : 0));
    } catch (err) {
      console.error(err);
      setError((err as any).message || 'Gagal memuat audit trail');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (log.userEmail || '').toLowerCase().includes(q) ||
      (log.ipAddress || '').toLowerCase().includes(q) ||
      (log.entityType || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q)
    );
  });

  const getActionTone = (action: string): 'success' | 'brand' | 'danger' | 'neutral' => {
    action = action.toLowerCase();
    if (action.includes('create') || action.includes('convert')) return 'success';
    if (action.includes('update')) return 'brand';
    if (action.includes('delete')) return 'danger';
    return 'neutral';
  };

  const handleExportCSV = () => {
    const header = ['Timestamp', 'User', 'Action', 'Module', 'Entity Type', 'IP Address'];
    const rows = filteredLogs.map((l) => [l.createdAt, l.userEmail || 'System', l.action, l.module, l.entityType, l.ipAddress]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <TerminalSquare className="text-brand-600 dark:text-brand-400 text-3xl" /> System Audit Trail
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
            Immutable ledger of platform activities and security events. Showing {filteredLogs.length} of {total} events.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={18} />} onClick={handleExportCSV}>Export (CSV)</Button>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, IPs, or users..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border focus:border-brand-500 border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-neutral-800 border focus:border-brand-500 border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none flex-1 md:w-40 appearance-none"
          >
             <option value="">All Modules</option>
             <option value="core_hr">Core HR</option>
             <option value="attendance">Attendance</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-neutral-800 border focus:border-brand-500 border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none flex-1 md:w-40 appearance-none"
          >
             <option value="">All Actions</option>
             <option value="create">Create</option>
             <option value="update">Update</option>
             <option value="delete">Delete</option>
             <option value="approve">Approve</option>
             <option value="reject">Reject</option>
          </select>
          <button
            onClick={() => { setSearch(''); setModuleFilter(''); setActionFilter(''); }}
            title="Reset filters"
            className="p-2.5 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl p-4 text-danger-700 dark:text-danger-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Log Feed */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="size-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Events Found</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {logs.length === 0 ? 'The audit trail is currently empty.' : 'No events match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-neutral-900/50 text-slate-600 dark:text-slate-400">
                <tr>
                   <th className="px-6 py-4 font-bold tracking-widest text-[10px] uppercase">Timestamp</th>
                   <th className="px-6 py-4 font-bold tracking-widest text-[10px] uppercase">User / Agent</th>
                   <th className="px-6 py-4 font-bold tracking-widest text-[10px] uppercase">Action</th>
                   <th className="px-6 py-4 font-bold tracking-widest text-[10px] uppercase">Target Entity</th>
                   <th className="px-6 py-4 font-bold tracking-widest text-[10px] uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-neutral-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-100 dark:hover:bg-neutral-800/50 transition-colors font-mono">
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                       {new Date(log.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-900 dark:text-white">
                       {log.userEmail || 'System'}
                    </td>
                    <td className="px-6 py-4">
                       <Badge tone={getActionTone(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                       {log.module} / {log.entityType}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                       {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
