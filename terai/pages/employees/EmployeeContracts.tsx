import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Calendar, ShieldCheck, AlertCircle, 
  ExternalLink, Trash2, Clock, CheckCircle2
} from 'lucide-react';
import { contractService, EmployeeContract } from '../../services/contract.service';
import { useLanguage } from '../../contexts/LanguageContext';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface EmployeeContractsProps {
  employeeId: number;
}

const EmployeeContracts: React.FC<EmployeeContractsProps> = ({ employeeId }) => {
  const { t } = useLanguage();
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [newContractData, setNewContractData] = useState({
    contractType: 'PKWT',
    contractNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchContracts();
  }, [employeeId]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await contractService.getEmployeeContracts(employeeId);
      setContracts(data || []);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await contractService.createContract(employeeId, {
        ...newContractData,
        startDate: new Date(newContractData.startDate).toISOString(),
        endDate: newContractData.endDate ? new Date(newContractData.endDate).toISOString() : undefined,
      });
      setIsModalOpen(false);
      fetchContracts();
      alert('Contract created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create contract');
    }
  };

  const handleSignContract = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty() || !selectedContractId) {
      alert("Please provide a signature.");
      return;
    }
    try {
      const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      await contractService.signContract(selectedContractId, dataURL);
      setSignModalOpen(false);
      sigCanvas.current.clear();
      fetchContracts();
      alert('Contract signed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to sign contract');
    }
  };

  const getStatusTone = (status: string, daysToExpiry?: number): 'success' | 'warning' | 'neutral' => {
    if (status === 'active') {
      if (daysToExpiry !== undefined && daysToExpiry < 30) {
        return 'warning';
      }
      return 'success';
    }
    return 'neutral';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="text-brand-600 dark:text-brand-400" size={24} />
          Employment Contracts
        </h3>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Contract
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#111111] border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
          <FileText size={48} className="text-slate-600 dark:text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">No contracts assigned</h4>
          <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">This employee doesn't have any formal contracts in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm p-5 hover:border-slate-300 dark:hover:border-neutral-700 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${contract.status === 'active' ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300'}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase">{contract.contractType}</h4>
                      <Badge tone={getStatusTone(contract.status, contract.daysToExpiry)}>
                        {contract.status}
                      </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-xs mt-0.5">{contract.contractNumber || 'NO-NUMBER-ASSIGNED'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-slate-700 dark:text-slate-300 tracking-widest">Duration</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                      <Calendar size={14} className="text-slate-700 dark:text-slate-300" />
                      {new Date(contract.startDate).toLocaleDateString()} — {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Permanent'}
                    </div>
                  </div>

                  {contract.daysToExpiry !== undefined && contract.daysToExpiry !== null && contract.status === 'active' && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-slate-700 dark:text-slate-300 tracking-widest">Validity</p>
                      <div className={`flex items-center gap-1.5 text-sm font-bold ${contract.daysToExpiry < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {contract.daysToExpiry < 30 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        {contract.daysToExpiry} days left
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  {contract.status !== 'signed' && (
                    <button
                      onClick={() => { setSelectedContractId(contract.id); setSignModalOpen(true); }}
                      className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 hover:text-white hover:bg-brand-600 transition-all font-bold text-xs"
                      title="Sign Contract">
                      Sign Document
                    </button>
                  )}
                  {contract.signatureUrl && (
                    <Badge tone="success">
                      <CheckCircle2 size={14} /> Signed
                    </Badge>
                  )}
                  <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all" title="View Document">
                    <ExternalLink size={18} />
                  </button>
                  <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-all" title="Delete record">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-900/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Issue Employment Contract</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Legally assign a new contract period to this employee.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-neutral-900 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleCreateContract} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Contract Type</label>
                  <select
                    required
                    value={newContractData.contractType}
                    onChange={(e) => setNewContractData({...newContractData, contractType: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                  >
                    <option value="PKWT">PKWT (Temporary)</option>
                    <option value="PKWTT">PKWTT (Permanent)</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Contract Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 001/HR/2026"
                    value={newContractData.contractNumber}
                    onChange={(e) => setNewContractData({...newContractData, contractNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newContractData.startDate}
                    onChange={(e) => setNewContractData({...newContractData, startDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newContractData.endDate}
                    onChange={(e) => setNewContractData({...newContractData, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                <textarea
                  placeholder="Additional terms or renewal notes..."
                  value={newContractData.notes}
                  onChange={(e) => setNewContractData({...newContractData, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-all h-24 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" size="lg" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="lg">
                  Generate & Activate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-900/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Sign Contract</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Please draw your signature below to legally sign this document.</p>
              </div>
              <button onClick={() => { setSignModalOpen(false); sigCanvas.current?.clear(); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-neutral-900 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="border-2 border-dashed border-slate-300 dark:border-neutral-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-neutral-900">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{width: 500, height: 200, className: 'sigCanvas w-full h-48 cursor-crosshair'}}
                />
              </div>
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => sigCanvas.current?.clear()}
                  className="text-sm font-bold text-slate-500 hover:text-rose-500 transition-colors"
                >
                  Clear Signature
                </button>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" size="lg" onClick={() => { setSignModalOpen(false); sigCanvas.current?.clear(); }}>
                  Cancel
                </Button>
                <Button variant="primary" size="lg" onClick={handleSignContract}>
                  <ShieldCheck size={18} /> Agree & Sign
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeContracts;
