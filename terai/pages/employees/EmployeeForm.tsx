import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, User, Briefcase, Phone, Mail, MapPin } from 'lucide-react';
import { employeeService } from '../../services/employee.service';
import { organizationService } from '../../services/organization.service';
import { Department, Position } from '../../types';
import Button from '../../components/ui/Button';

const EmployeeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    gender: 'male',
    departmentId: '',
    positionId: '',
    employmentType: 'permanent',
    employmentStatus: 'active',
    joinDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchFormReferences();
    if (isEditing) {
      fetchEmployeeDetails();
    }
  }, [id]);

  useEffect(() => {
    if (formData.departmentId) {
      fetchPositions(parseInt(formData.departmentId));
    } else {
      setPositions([]);
    }
  }, [formData.departmentId]);

  const fetchFormReferences = async () => {
    try {
      const depts = await organizationService.getDepartments();
      setDepartments(depts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPositions = async (deptId: number) => {
    try {
      const pos = await organizationService.getPositions(deptId);
      setPositions(pos || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployeeDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const emp = await employeeService.getEmployeeById(parseInt(id));
      if (emp) {
        setFormData({
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          email: emp.email,
          phone: emp.phone || '',
          gender: emp.gender || 'male',
          departmentId: emp.departmentId ? emp.departmentId.toString() : '',
          positionId: emp.positionId ? emp.positionId.toString() : '',
          employmentType: emp.employmentType,
          employmentStatus: emp.employmentStatus,
          joinDate: emp.joinDate.split('T')[0],
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
        positionId: formData.positionId ? parseInt(formData.positionId) : undefined,
        joinDate: new Date(formData.joinDate).toISOString(),
      };

      if (isEditing) {
        await employeeService.updateEmployee(parseInt(id), payload);
      } else {
        await employeeService.createEmployee(payload);
      }
      
      // Go back to employee directory upon success
      navigate('/employees');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/employees')}
            className="!px-2.5"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Employee' : 'New Employee Registration'}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Fill in the employee details below to add them to your workforce directory.</p>
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          loading={loading}
        >
          {!loading && <Save size={18} />}
          <span>{isEditing ? 'Update Profile' : 'Save Employee'}</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Details Section */}
        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-neutral-800 pb-4">
            <User size={20} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
              <div className="flex gap-4">
                <label className="flex flex-1 items-center gap-3 p-3 border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="male" 
                    checked={formData.gender === 'male'}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-4 h-4 text-brand-500 bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 focus:ring-brand-500" 
                  />
                  <span className="text-slate-700 dark:text-slate-300">Male</span>
                </label>
                <label className="flex flex-1 items-center gap-3 p-3 border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="female" 
                    checked={formData.gender === 'female'}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-4 h-4 text-brand-500 bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 focus:ring-brand-500" 
                  />
                  <span className="text-slate-700 dark:text-slate-300">Female</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Professional Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="+62 812 3456 7890"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Career / Employment Details Section */}
        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white border-b border-slate-200 dark:border-neutral-800 pb-4">
            <Briefcase size={20} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-semibold">Employment Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors uppercase"
                placeholder="EMP-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Join Date *</label>
              <input
                type="date"
                required
                value={formData.joinDate}
                onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({...formData, departmentId: e.target.value, positionId: ''})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
              >
                <option value="">-- Select Department --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Position / Job Title</label>
              <select
                value={formData.positionId}
                onChange={(e) => setFormData({...formData, positionId: e.target.value})}
                disabled={!formData.departmentId}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Position --</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
              {!formData.departmentId && <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Select a department first</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
              >
                <option value="permanent">Permanent / Full-Time</option>
                <option value="contract">Contract</option>
                <option value="probation">Probation</option>
                <option value="intern">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({...formData, employmentStatus: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
              >
                <option value="active">Active</option>
                <option value="on leave">On Leave</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default EmployeeForm;
