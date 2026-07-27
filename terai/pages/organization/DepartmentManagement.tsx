import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Search, 
  Users, ChevronRight, Briefcase
} from 'lucide-react';
import { organizationService } from '../../services/organization.service';
import { Department } from '../../types';
import Button from '../../components/ui/Button';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: ''
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getDepartments();
      setDepartments(data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        code: dept.code || '',
        description: dept.description || '',
        parentId: dept.parentId ? dept.parentId.toString() : ''
      });
    } else {
      setEditingDept(null);
      setFormData({ name: '', code: '', description: '', parentId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
        isActive: true
      };

      if (editingDept) {
        await organizationService.updateDepartment(editingDept.id, payload);
      } else {
        await organizationService.createDepartment(payload);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error('Failed to save department:', error);
      alert('Failed to save department');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this department?')) {
      try {
        await organizationService.deleteDepartment(id);
        fetchDepartments();
      } catch (error) {
        console.error('Failed to delete department:', error);
      }
    }
  };

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage organizational structure and functional units</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <Plus size={18} />
          <span>Add Department</span>
        </Button>
      </div>

      <div className="bg-white/50 dark:bg-[#111111] backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white/50 dark:bg-[#111111] rounded-2xl border border-slate-200/50 dark:border-neutral-800">
            <Building2 className="mx-auto text-slate-700 dark:text-slate-300 mb-3" size={32} />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No departments found</h3>
            <p className="text-slate-600 dark:text-slate-400">Add a new department to get started.</p>
          </div>
        ) : (
          filteredDepartments.map((dept) => (
            <div key={dept.id} className="bg-white/50 dark:bg-[#111111] backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-neutral-700 transition-colors group">
              <div className="p-5 border-b border-slate-200/50 dark:border-neutral-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:text-brand-400 transition-colors">{dept.name}</h3>
                      <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-900 px-2 py-0.5 rounded border border-slate-200 dark:border-neutral-800">CODE: {dept.code || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(dept)} className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 bg-slate-50 dark:bg-neutral-900 rounded-md hover:bg-brand-500/10 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-500 bg-slate-50 dark:bg-neutral-900 rounded-md hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {dept.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">{dept.description}</p>
                )}
              </div>
              <div className="p-4 bg-white/30 dark:bg-neutral-900/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-700 dark:text-slate-300" />
                    <div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium uppercase tracking-wider">Employees</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{dept.employeeCount || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-700 dark:text-slate-300" />
                    <div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium uppercase tracking-wider">Sub-Depts</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{dept.childDeptCount || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#111111] border border-slate-200/50 dark:border-neutral-800 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-900/50">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Building2 size={24} />
                </div>
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-white/50 dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-slate-400 font-bold"
                    placeholder="e.g. Engineering, Sales, Human Resources"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Department Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-5 py-4 bg-white/50 dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-slate-400 uppercase font-bold"
                      placeholder="e.g. ENG, SLS, HR"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Parent Department</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                      className="w-full px-5 py-4 bg-white/50 dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none font-bold"
                    >
                      <option value="">-- None (Top Level) --</option>
                      {departments
                        .filter(d => d.id !== editingDept?.id)
                        .map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full px-5 py-4 bg-white/50 dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none placeholder:text-slate-400 font-medium"
                    placeholder="Brief description of the department's function..."
                  />
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/80 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                size="lg"
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
                Save Department
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
