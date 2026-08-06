import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Search, 
  Users, Briefcase, Hash, ChevronRight 
} from 'lucide-react';
import { organizationService } from '../../services/organization.service';
import { Position, Department } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const PositionManagement: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    level: 1,
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posData, deptData] = await Promise.all([
        organizationService.getPositions(departmentFilter ? parseInt(departmentFilter) : undefined),
        organizationService.getDepartments()
      ]);
      setPositions(posData || []);
      setDepartments(deptData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentFilter]);

  const handleOpenModal = (pos?: Position) => {
    if (pos) {
      setEditingPosition(pos);
      setFormData({
        name: pos.name,
        code: pos.code || '',
        departmentId: pos.departmentId ? pos.departmentId.toString() : '',
        level: pos.level,
        description: pos.description || ''
      });
    } else {
      setEditingPosition(null);
      setFormData({ name: '', code: '', departmentId: '', level: 1, description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
        level: formData.level,
        description: formData.description,
        isActive: true
      };

      if (editingPosition) {
        await organizationService.updatePosition(editingPosition.id, payload);
      } else {
        await organizationService.createPosition(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save position:', error);
      alert('Failed to save position');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this position?')) {
      try {
        await organizationService.deletePosition(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete position:', error);
      }
    }
  };

  const filteredPositions = positions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Position Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage job titles and hierarchy levels</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <Plus size={18} />
          <span>Add Position</span>
        </Button>
      </div>

      <div className="bg-white/50 dark:bg-[#000000] backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-[#000000] backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-neutral-800 bg-white/50 dark:bg-[#000000]">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Job Level</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Employees</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600 dark:text-slate-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading positions...
                  </td>
                </tr>
              ) : filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 mb-4">
                      <Briefcase className="text-slate-600 dark:text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">No positions found</p>
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-100 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg mr-3">
                          <Briefcase size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:text-brand-400 transition-colors">{pos.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">{pos.code || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Building2 size={14} className="text-slate-700 dark:text-slate-300" />
                        {pos.departmentName || <span className="text-slate-700 dark:text-slate-300 italic">No Dept</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge tone="neutral">Level {pos.level}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                        <Users size={14} className="text-slate-700 dark:text-slate-300" />
                        {pos.employeeCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(pos)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 bg-slate-50 dark:bg-neutral-900 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(pos.id)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-500 bg-slate-50 dark:bg-neutral-900 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#000000] border border-slate-200/50 dark:border-neutral-800 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-900/50">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Briefcase size={24} />
                </div>
                {editingPosition ? 'Edit Position' : 'Add New Position'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Position Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-white/50 dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-slate-400 font-bold"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-5 py-4 bg-white/50 dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-slate-400 uppercase font-bold"
                    placeholder="e.g. SFE"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Job Level (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                    className="w-full px-5 py-4 bg-white/50 dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-bold"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                    className="w-full px-5 py-4 bg-white/50 dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none font-bold"
                  >
                    <option value="">-- No Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full px-5 py-4 bg-white/50 dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none placeholder:text-slate-400 font-medium"
                    placeholder="Brief description of the position..."
                  />
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/80 flex gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 uppercase text-xs tracking-widest"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                type="button"
                variant="primary"
                size="lg"
                className="flex-[2] uppercase text-xs tracking-widest"
              >
                Save Position
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionManagement;
