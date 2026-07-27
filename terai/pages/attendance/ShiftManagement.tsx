import React, { useState, useEffect } from 'react';
import {
  Clock, Plus, Edit2, Trash2, Users, Calendar, AlertCircle
} from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { Shift } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

interface ShiftAssignment {
  id: number;
  employeeId: number;
  shiftId: number;
  effectiveDate: string;
  endDate?: string;
  employeeName: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
}

const ShiftManagement: React.FC = () => {
  const { showToast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form State
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    breakStart: '',
    breakEnd: '',
    isNightShift: false,
    toleranceMinutes: 15
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftId: '',
    effectiveDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shiftsRes, assignmentsRes] = await Promise.all([
        attendanceService.getShifts(),
        attendanceService.getShiftAssignments()
      ]);
      setShifts(shiftsRes);
      setAssignments(assignmentsRes);
    } catch (err) {
      console.error('Failed to fetch shift data:', err);
      const errorMessage = 'Gagal memuat data shift. Silakan refresh halaman.';
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShift) {
        await attendanceService.updateShift(editingShift.id, shiftForm);
        showToast('success', 'Shift berhasil diupdate');
      } else {
        await attendanceService.createShift(shiftForm);
        showToast('success', 'Shift berhasil dibuat');
      }
      setIsShiftModalOpen(false);
      resetShiftForm();
      fetchData();
    } catch (err: any) {
      console.error('Failed to save shift:', err);
      showToast('error', err.message || 'Gagal menyimpan shift');
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus shift ini?')) return;
    try {
      await attendanceService.deleteShift(id);
      showToast('success', 'Shift berhasil dihapus');
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete shift:', err);
      showToast('error', err.message || 'Gagal menghapus shift');
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await attendanceService.assignShift({
        employeeId: parseInt(assignForm.employeeId),
        shiftId: parseInt(assignForm.shiftId),
        effectiveDate: assignForm.effectiveDate,
        endDate: assignForm.endDate || undefined
      });
      setIsAssignModalOpen(false);
      resetAssignForm();
      fetchData();
      showToast('success', 'Shift berhasil di-assign');
    } catch (err: any) {
      console.error('Failed to assign shift:', err);
      showToast('error', err.message || 'Gagal assign shift');
    }
  };

  const handleRemoveAssignment = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus assignment ini?')) return;
    try {
      await attendanceService.removeShiftAssignment(id);
      showToast('success', 'Assignment berhasil dihapus');
      fetchData();
    } catch (err: any) {
      console.error('Failed to remove assignment:', err);
      showToast('error', err.message || 'Gagal menghapus assignment');
    }
  };

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakStart: shift.breakStart || '',
      breakEnd: shift.breakEnd || '',
      isNightShift: shift.isNightShift,
      toleranceMinutes: shift.toleranceMinutes
    });
    setIsShiftModalOpen(true);
  };

  const resetShiftForm = () => {
    setEditingShift(null);
    setShiftForm({
      name: '',
      startTime: '',
      endTime: '',
      breakStart: '',
      breakEnd: '',
      isNightShift: false,
      toleranceMinutes: 15
    });
  };

  const resetAssignForm = () => {
    setAssignForm({
      employeeId: '',
      shiftId: '',
      effectiveDate: '',
      endDate: ''
    });
  };

  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger-500 flex-shrink-0" />
            <span className="text-danger-700 dark:text-danger-500 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-danger-600 dark:text-danger-400 hover:text-danger-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Clock className="text-brand-500" size={32} />
            Shift Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Define shifts and assign to employees.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            icon={<Plus size={20} />}
            onClick={() => { resetShiftForm(); setIsShiftModalOpen(true); }}
          >
            Create Shift
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon={<Users size={20} />}
            onClick={() => { resetAssignForm(); setIsAssignModalOpen(true); }}
            className="bg-success-600 hover:bg-success-700 shadow-success-600/20"
          >
            Assign Shift
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
           <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Shifts List */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-brand-600 dark:text-brand-400" /> Available Shifts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.length === 0 ? (
                <p className="text-slate-700 dark:text-slate-300 col-span-full text-center py-8">No shifts defined yet.</p>
              ) : (
                shifts.map(shift => (
                  <div key={shift.id} className="bg-slate-50/50 dark:bg-neutral-800/50 border border-slate-200/50 dark:border-neutral-800 rounded-2xl p-5 hover:border-brand-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{shift.name}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(shift)}
                          className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteShift(shift.id)}
                          className="text-slate-600 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Start Time:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{shift.startTime.substring(0, 5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">End Time:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{shift.endTime.substring(0, 5)}</span>
                      </div>
                      {shift.breakStart && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Break:</span>
                          <span className="text-slate-900 dark:text-white font-medium">
                            {shift.breakStart.substring(0, 5)} - {shift.breakEnd?.substring(0, 5)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Tolerance:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{shift.toleranceMinutes} min</span>
                      </div>
                      {shift.isNightShift && (
                        <div className="mt-2">
                          <Badge tone="brand">Night Shift</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shift Assignments */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Users size={20} className="text-brand-600 dark:text-brand-400" /> Shift Assignments
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-neutral-800 text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    <th className="py-4 font-bold">Employee</th>
                    <th className="py-4 font-bold">Shift</th>
                    <th className="py-4 font-bold">Time</th>
                    <th className="py-4 font-bold">Effective Date</th>
                    <th className="py-4 font-bold">End Date</th>
                    <th className="py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-700 dark:text-slate-300">No shift assignments found.</td></tr>
                  ) : (
                    assignments.map(assignment => (
                      <tr key={assignment.id} className="border-b border-slate-200/50 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors">
                        <td className="py-4 font-medium text-slate-900 dark:text-white">{assignment.employeeName}</td>
                        <td className="py-4 text-slate-700 dark:text-slate-300">{assignment.shiftName}</td>
                        <td className="py-4 text-slate-600 dark:text-slate-400 text-sm">
                          {assignment.shiftStartTime.substring(0, 5)} - {assignment.shiftEndTime.substring(0, 5)}
                        </td>
                        <td className="py-4 text-slate-600 dark:text-slate-400 text-sm">
                          {new Date(assignment.effectiveDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-slate-600 dark:text-slate-400 text-sm">
                          {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Ongoing'}
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="text-danger-600 dark:text-danger-400 hover:text-danger-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Shift Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200/80 dark:border-neutral-800/80 flex justify-between items-center bg-white/50 dark:bg-neutral-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="text-brand-600 dark:text-brand-400" /> {editingShift ? 'Edit Shift' : 'Create New Shift'}
              </h2>
              <button onClick={() => { setIsShiftModalOpen(false); resetShiftForm(); }} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleCreateOrUpdateShift} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Shift Name</label>
                <input
                  type="text"
                  required
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({...shiftForm, name: e.target.value})}
                  placeholder="e.g., Morning Shift"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({...shiftForm, startTime: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({...shiftForm, endTime: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Break Start (Optional)</label>
                  <input
                    type="time"
                    value={shiftForm.breakStart}
                    onChange={(e) => setShiftForm({...shiftForm, breakStart: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Break End (Optional)</label>
                  <input
                    type="time"
                    value={shiftForm.breakEnd}
                    onChange={(e) => setShiftForm({...shiftForm, breakEnd: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tolerance (minutes)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="60"
                  value={shiftForm.toleranceMinutes}
                  onChange={(e) => setShiftForm({...shiftForm, toleranceMinutes: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isNightShift"
                  checked={shiftForm.isNightShift}
                  onChange={(e) => setShiftForm({...shiftForm, isNightShift: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isNightShift" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Night Shift</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setIsShiftModalOpen(false); resetShiftForm(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingShift ? 'Update Shift' : 'Create Shift'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-200/80 dark:border-neutral-800/80 flex justify-between items-center bg-white/50 dark:bg-neutral-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-success-600 dark:text-success-400" /> Assign Shift to Employee
              </h2>
              <button onClick={() => { setIsAssignModalOpen(false); resetAssignForm(); }} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAssignShift} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Employee ID</label>
                <input
                  type="number"
                  required
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({...assignForm, employeeId: e.target.value})}
                  placeholder="Enter employee ID"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-success-500 focus:ring-1 focus:ring-success-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Shift</label>
                <select
                  required
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm({...assignForm, shiftId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-success-500 focus:ring-1 focus:ring-success-500 transition-all appearance-none"
                >
                  <option value="">-- Select Shift --</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime.substring(0, 5)} - {shift.endTime.substring(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={assignForm.effectiveDate}
                    onChange={(e) => setAssignForm({...assignForm, effectiveDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-success-500 focus:ring-1 focus:ring-success-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={assignForm.endDate}
                    onChange={(e) => setAssignForm({...assignForm, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-success-500 focus:ring-1 focus:ring-success-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setIsAssignModalOpen(false); resetAssignForm(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-success-600 hover:bg-success-700 shadow-success-500/20">
                  Assign Shift
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
