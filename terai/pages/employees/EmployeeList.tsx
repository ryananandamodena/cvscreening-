import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Filter, MoreVertical, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Briefcase
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { employeeService } from '../../services/employee.service';
import { Employee, Department } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    departmentId: searchParams.get('departmentId') || '',
    employmentStatus: 'active'
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        departmentId: filters.departmentId,
        employmentStatus: filters.employmentStatus
      };
      
      const res = await employeeService.getEmployees(params);
      setEmployees(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const depts = await employeeService.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, filters.departmentId, filters.employmentStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchEmployees();
      } else {
        setPage(1); // Changing search resets to page 1
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusBadgeTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'active': return 'success';
      case 'on leave': return 'warning';
      case 'resigned': return 'neutral';
      case 'terminated': return 'danger';
      default: return 'neutral';
    }
  };

  const getTypeBadgeTone = (type: string): 'brand' | 'info' | 'warning' | 'success' | 'neutral' => {
    switch (type.toLowerCase()) {
      case 'permanent': return 'brand';
      case 'contract': return 'info';
      case 'probation': return 'warning';
      case 'intern': return 'success';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employee Directory</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your workforce ({total} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="flex items-center gap-2">
            <Filter size={18} />
            <span>Export</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Add Employee</span>
          </Button>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-[#000000]/50 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800/50 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-brand-500 transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
              className="w-48 px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-brand-500 transition-colors appearance-none"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <select
              value={filters.employmentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, employmentStatus: e.target.value }))}
              className="w-40 px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-brand-500 transition-colors appearance-none"
            >
              <option value="active">Active</option>
              <option value="on leave">On Leave</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
              <option value="">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-[#000000]/50 backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-[#000000]/50">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Role & Dept</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-neutral-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-600 dark:text-slate-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 mb-4">
                      <Users className="text-slate-600 dark:text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">No employees found</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-100 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                          {emp.photoUrl ? (
                            <img className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-neutral-800" src={emp.photoUrl} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold border border-brand-500/20">
                              {emp.fullName.charAt(0)}
                            </div>
                          )}
                          {emp.gender === 'female' && !emp.photoUrl && (
                             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-slate-200 dark:border-neutral-800" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div
                             onClick={() => navigate(`/employees/${emp.id}`)}
                             className="text-sm font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
                          >
                            {emp.fullName}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">{emp.employeeId} • {emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700 dark:text-slate-300">{emp.positionName || 'No Position'}</div>
                      <div
                        className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer w-fit"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (emp.departmentId) navigate(`/organizations/departments?departmentId=${emp.departmentId}`);
                        }}
                        title="Lihat departemen"
                      >
                        <Briefcase size={12} />
                        {emp.departmentName || 'No Department'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={getTypeBadgeTone(emp.employmentType)}>
                        {emp.employmentType.charAt(0).toUpperCase() + emp.employmentType.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      {new Date(emp.joinDate).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={getStatusBadgeTone(emp.employmentStatus)}>
                        {emp.employmentStatus.charAt(0).toUpperCase() + emp.employmentStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 mx-1"
                        title="View Details"
                      >
                        <Search size={18} />
                      </button>
                      <button
                         onClick={() => navigate(`/employees/${emp.id}/edit`)}
                         className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800"
                         title="Edit Employee"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200/50 dark:border-neutral-800/50 bg-white/30 dark:bg-[#000000]/30 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{(page - 1) * 10 + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(page * 10, total)}</span> of <span className="font-medium text-slate-900 dark:text-white">{total}</span> employees
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-brand-600 text-white'
                        : 'border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
