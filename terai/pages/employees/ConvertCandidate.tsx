import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ArrowRight, Save, UserSearch, Building2, Briefcase } from 'lucide-react';
import { employeeService } from '../../services/employee.service';
import { organizationService } from '../../services/organization.service';
import { apiService } from '../../services/api.service';
import { Department, Position, ConvertCandidatePayload } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface Candidate {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  matchScore?: number;
}

const ConvertCandidate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  
  // Data for selects
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const [formData, setFormData] = useState<Partial<ConvertCandidatePayload>>({
    candidateId: undefined,
    employeeId: '',
    departmentId: undefined,
    positionId: undefined,
    employmentType: 'permanent',
    joinDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.departmentId) {
      fetchPositions(formData.departmentId);
    } else {
      setPositions([]);
    }
  }, [formData.departmentId]);

  const fetchInitialData = async () => {
    setFetchingData(true);
    try {
      // Execute generic api call for candidates
      const candRes = await apiService.get<any>('/candidates');
      // Some endpoints return data in { data: [] }
      const candList = candRes.data ? candRes.data : candRes;
      
      const depts = await organizationService.getDepartments();
      
      setCandidates(candList || []);
      setDepartments(depts || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setFetchingData(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidateId || !formData.employeeId || !formData.departmentId || !formData.positionId || !formData.joinDate) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload: ConvertCandidatePayload = {
        candidateId: formData.candidateId,
        employeeId: formData.employeeId,
        departmentId: formData.departmentId,
        positionId: formData.positionId,
        employmentType: formData.employmentType || 'permanent',
        joinDate: new Date(formData.joinDate).toISOString(),
      };

      await employeeService.convertCandidate(payload);
      alert('Candidate successfully converted to Employee!');
      navigate('/employees');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to convert candidate');
    } finally {
      setLoading(false);
    }
  };

  const selectedCandidate = candidates.find(c => c.id === formData.candidateId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <UserCheck className="text-brand-600 dark:text-brand-400" size={32} />
            Convert Candidate to Employee
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Seamlessly transition successfully hired candidates into the employee directory.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Candidate Selection & Preview */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/50 dark:bg-[#000000] backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserSearch className="text-brand-600 dark:text-brand-400" size={20} /> Select Candidate
            </h2>

            {fetchingData ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <select
                value={formData.candidateId || ''}
                onChange={(e) => setFormData({...formData, candidateId: e.target.value ? parseInt(e.target.value) : undefined})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-brand-500/20 focus:border-brand-500 rounded-xl text-slate-900 dark:text-white outline-none transition-all"
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
                ))}
              </select>
            )}

            {selectedCandidate && (
              <div className="mt-6 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-neutral-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xl mx-auto mb-2 border border-brand-500/20">
                  {selectedCandidate.fullName.charAt(0)}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">{selectedCandidate.fullName}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{selectedCandidate.email}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-neutral-800 space-y-2">
                   <div className="flex justify-between text-xs">
                     <span className="text-slate-700 dark:text-slate-300">Phone</span>
                     <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedCandidate.phone || 'N/A'}</span>
                   </div>
                   <div className="flex justify-between text-xs items-center">
                     <span className="text-slate-700 dark:text-slate-300">Current Status</span>
                     <Badge tone="info">{selectedCandidate.status || 'Candidate'}</Badge>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Conversion Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-[#000000] backdrop-blur-xl border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200/50 dark:border-neutral-800 pb-4">Employment Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">New Employee ID *</label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors uppercase font-mono"
                  placeholder="EMP-0001"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Building2 size={12}/> Department *</label>
                  <select
                    required
                    value={formData.departmentId || ''}
                    onChange={(e) => setFormData({...formData, departmentId: parseInt(e.target.value), positionId: undefined})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Briefcase size={12}/> Position *</label>
                  <select
                    required
                    disabled={!formData.departmentId}
                    value={formData.positionId || ''}
                    onChange={(e) => setFormData({...formData, positionId: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none disabled:opacity-50"
                  >
                    <option value="">-- Select Position --</option>
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Employment Type</label>
                  <select
                    required
                    value={formData.employmentType}
                    onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none"
                  >
                    <option value="permanent">Permanent / Full-Time</option>
                    <option value="contract">Contract</option>
                    <option value="probation">Probation</option>
                    <option value="intern">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Join Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.joinDate}
                    onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition-colors"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/50 dark:border-neutral-800">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !formData.candidateId}
                className="w-full group"
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Execute Conversion</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConvertCandidate;
