import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, XCircle, Clock, Plus,
  FileText, Briefcase, AlertCircle
} from 'lucide-react';
import { leaveService } from '../../services/leave.service';
import { employeeService } from '../../services/employee.service';
import { LeaveBalance, LeaveRequest, LeaveType } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const LeaveManagement: React.FC = () => {
  const { showToast } = useToast();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  
  // Form State
  const [newRequest, setNewRequest] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Resolved from the logged-in user's own employee record — never hardcoded.
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await employeeService.getMyEmployee();
      setEmployeeId(me.id);

      const [typesRes, balRes, histRes] = await Promise.all([
        leaveService.getLeaveTypes(),
        leaveService.getBalances(me.id),
        leaveService.getRequests(me.id)
      ]);
      setLeaveTypes(typesRes || []);
      setBalances(balRes || []);
      setHistory(histRes || []);
    } catch (err) {
      console.error('Failed to fetch leave data:', err);
      const errorMessage = 'Gagal memuat data cuti. Silakan refresh halaman.';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTone = (status: string): 'success' | 'danger' | 'warning' | 'neutral' => {
    switch(status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'neutral';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle2 size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return null;
    }
  };

  const calculateDays = (start: string, end: string) => {
     if (!start || !end) return 0;
     const d1 = new Date(start);
     const d2 = new Date(end);
     const diffTime = Math.abs(d2.getTime() - d1.getTime());
     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !newRequest.leaveTypeId || !newRequest.startDate || !newRequest.endDate) return;
    if (submittingRequest) return; // guard against a double-click/double-submit while in flight

    setSubmittingRequest(true);
    try {
      const totalDays = calculateDays(newRequest.startDate, newRequest.endDate);
      await leaveService.createRequest({
        employeeId,
        leaveTypeId: parseInt(newRequest.leaveTypeId),
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        totalDays: totalDays,
        reason: newRequest.reason
      });
      setIsModalOpen(false);
      setNewRequest({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      fetchData(); // Refresh history
      showToast('success', 'Pengajuan cuti berhasil dikirim');
    } catch (err: any) {
      console.error('Failed to submit leave request:', err);
      const errorMessage = err.message || 'Gagal mengirim pengajuan cuti';
      showToast('error', errorMessage);
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger-500 flex-shrink-0" />
            <span className="text-danger-700 dark:text-danger-400 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            Leave Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Check balances and request time off.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={20} />}>
          Request Leave
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
           <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Balances Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {balances.map(balance => (
              <div key={balance.id} className="card rounded-2xl p-6 relative overflow-hidden group hover:border-brand-500/30 transition-colors shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:text-brand-600 dark:text-brand-400 transition-colors">
                  <Briefcase size={80} />
                </div>
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{balance.leaveTypeName}</h3>
                <div className="mt-4 flex items-end gap-2">
                   <p className="text-5xl font-black text-slate-900 dark:text-white leading-none">{balance.remainingDays}</p>
                   <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">/ {balance.totalDays} Days</p>
                </div>
                <div className="mt-4 w-full bg-slate-50 dark:bg-neutral-900 rounded-full h-1.5">
                   <div 
                     className="bg-brand-500 h-1.5 rounded-full" 
                     style={{ width: `${(balance.remainingDays! / balance.totalDays) * 100}%` }}
                   ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Leave History List */}
          <div className="card rounded-2xl p-6 shadow-sm">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
               <Calendar size={20} className="text-brand-600 dark:text-brand-400" /> Request History
             </h2>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-neutral-800 text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300">
                       <th className="py-4 font-bold">Type</th>
                       <th className="py-4 font-bold">Duration</th>
                       <th className="py-4 font-bold">Reason</th>
                       <th className="py-4 font-bold">Status</th>
                       <th className="py-4 font-bold">Applied On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-700 dark:text-slate-300">No leave history found.</td></tr>
                    ) : (
                      history.map(req => (
                        <tr key={req.id} className="border-b border-slate-200/50 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                           <td className="py-4 font-medium text-slate-900 dark:text-white">{req.leaveTypeName}</td>
                           <td className="py-4 text-slate-700 dark:text-slate-300">
                             {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                             <span className="block text-xs text-slate-700 dark:text-slate-300 mt-0.5">{req.totalDays} days</span>
                           </td>
                           <td className="py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{req.reason}</td>
                           <td className="py-4">
                              <Badge tone={getStatusTone(req.status)}>
                                 {getStatusIcon(req.status)} {req.status}
                              </Badge>
                           </td>
                           <td className="py-4 text-slate-600 dark:text-slate-400 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200/80 dark:border-neutral-800/80 flex justify-between items-center bg-white/50 dark:bg-neutral-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="text-brand-600 dark:text-brand-400" /> New Leave Request
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Leave Type</label>
                <select
                  required
                  value={newRequest.leaveTypeId}
                  onChange={(e) => setNewRequest({...newRequest, leaveTypeId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none"
                >
                  <option value="">-- Select Leave Type --</option>
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.name} (Max {lt.maxDays} days)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({...newRequest, startDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  placeholder="Please provide details..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
                />
              </div>
              
              <div className="bg-slate-50/50 dark:bg-neutral-900/50 rounded-xl p-4 flex items-center justify-between border border-slate-200 dark:border-neutral-800">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Days Computed:</span>
                <span className="text-lg font-black text-brand-600 dark:text-brand-400">{calculateDays(newRequest.startDate, newRequest.endDate)}</span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingRequest} loading={submittingRequest}>
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
