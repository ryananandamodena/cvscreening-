import React, { useState, useEffect } from 'react';
import {
  FileText, Shield, Users, CheckCircle2, AlertTriangle,
  Upload, Download, Eye, Edit, Trash2, Plus, Search,
  Calendar, Clock, UserCheck, Lock, Unlock, Filter
} from 'lucide-react';
import { documentsService, CompanyPolicy, EmploymentContract, ComplianceRecord } from '../../services/documents.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const DocumentsDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('policies');
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesData, contractsData, complianceData] = await Promise.all([
        documentsService.getPolicies({ limit: 50 }),
        documentsService.getContracts({ limit: 50 }),
        documentsService.getComplianceRecords({ limit: 50 })
      ]);
      setPolicies(Array.isArray(policiesData) ? policiesData : policiesData.data);
      setContracts(Array.isArray(contractsData) ? contractsData : contractsData.data);
      setComplianceRecords(Array.isArray(complianceData) ? complianceData : complianceData.data);
    } catch (err) {
      console.error('Failed to fetch documents data:', err);
      showToast('error', 'Failed to load documents data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTone = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'neutral';
      case 'pending_signature': return 'warning';
      case 'expired': return 'danger';
      case 'completed': return 'success';
      case 'pending': return 'info';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'draft': return 'Draft';
      case 'pending_signature': return 'Pending Signature';
      case 'expired': return 'Expired';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalPolicies: policies.length,
    activePolicies: policies.filter(p => p.status === 'active').length,
    totalContracts: contracts.length,
    pendingSignatures: contracts.filter(c => c.status === 'pending_signature').length,
    complianceRate: complianceRecords.length > 0 ?
      Math.round((complianceRecords.filter(c => c.status === 'completed').length / complianceRecords.length) * 100) : 0
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <FileText size={32} />
            </div>
            Documents & Policies
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Digital document management, e-signatures, and compliance tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<Upload size={16} />}>
            Upload Document
          </Button>
          <Button variant="outline" icon={<Download size={16} />}>
            Export
          </Button>
          <Button variant="primary" icon={<Plus size={16} />}>
            New Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-info-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-info-500/10 group-hover:scale-110 transition-transform duration-500">
                <FileText size={24} className="text-info-600 dark:text-info-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Policies</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalPolicies}</h3>
              <span className="text-xs font-bold text-info-600 dark:text-info-500">{stats.activePolicies} active</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-success-500/10 group-hover:scale-110 transition-transform duration-500">
                <Shield size={24} className="text-success-600 dark:text-success-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Employment Contracts</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalContracts}</h3>
              <span className="text-xs font-bold text-success-600 dark:text-success-500">{stats.pendingSignatures} pending</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-warning-500/10 group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 size={24} className="text-warning-600 dark:text-warning-500" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Compliance Rate</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.complianceRate}%</h3>
              <span className="text-xs font-bold text-warning-600 dark:text-warning-500">acknowledged</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-brand-500/10 group-hover:scale-110 transition-transform duration-500">
                <Lock size={24} className="text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Digital Signatures</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">1,247</h3>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Document Types</h2>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('policies')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'policies' ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-500' : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-info-100 dark:bg-info-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-info-600 dark:text-info-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Company Policies</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{stats.totalPolicies} documents</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('contracts')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'contracts' ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-500' : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-success-600 dark:text-success-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Employment Contracts</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{stats.totalContracts} contracts</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('compliance')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'compliance' ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-500' : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-warning-100 dark:bg-warning-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-warning-600 dark:text-warning-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Compliance Tracking</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{stats.complianceRate}% compliance</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'templates' ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-500' : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/40 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Document Templates</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">12 templates</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Digital Signature Status */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Digital Signatures</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Verified Today</span>
                <span className="text-sm font-bold text-success-600 dark:text-success-500">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Pending Review</span>
                <span className="text-sm font-bold text-warning-600 dark:text-warning-500">7</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">This Month</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">247</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            {/* Search & Filters */}
            <div className="p-6 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="pending_signature">Pending Signature</option>
                  <option value="expired">Expired</option>
                </select>

                <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>
                  More Filters
                </Button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Company Policies</h3>
                    <Button variant="primary" size="sm">
                      Create Policy
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="p-4 border border-slate-200 dark:border-neutral-800 rounded-lg">
                            <div className="animate-pulse">
                              <div className="h-4 bg-slate-200 dark:bg-neutral-700 rounded mb-2"></div>
                              <div className="h-3 bg-slate-200 dark:bg-neutral-700 rounded w-3/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredPolicies.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No policies found</h3>
                        <p className="text-slate-700 dark:text-slate-300">Create your first company policy</p>
                      </div>
                    ) : (
                      filteredPolicies.map((policy) => (
                        <div key={policy.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/40 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{policy.title}</h3>
                                  <Badge tone={getStatusTone(policy.status)}>
                                    {getStatusLabel(policy.status)}
                                  </Badge>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-3">{policy.description}</p>
                                <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                                  <span>Category: {policy.category}</span>
                                  <span>Version: {policy.version}</span>
                                  <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                                </div>
                                {policy.requiresAcknowledgment && (
                                  <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg">
                                    <div className="flex items-center gap-2 text-warning-800 dark:text-warning-500">
                                      <AlertTriangle className="w-4 h-4" />
                                      <span className="text-sm font-medium">Requires employee acknowledgment</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-6">
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'contracts' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Employment Contracts</h3>
                    <Button variant="primary" size="sm">
                      Generate Contract
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {filteredContracts.map((contract) => (
                      <div key={contract.id} className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
                              <Shield className="w-6 h-6 text-success-600 dark:text-success-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{contract.employeeName}</h3>
                                <Badge tone={getStatusTone(contract.status)}>
                                  {getStatusLabel(contract.status)}
                                </Badge>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 mb-3">{contract.position} • {contract.department}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-700 dark:text-slate-300">
                                <div>
                                  <span className="font-medium">Type:</span> {contract.contractType}
                                </div>
                                <div>
                                  <span className="font-medium">Start:</span> {new Date(contract.startDate).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Salary:</span> Rp {contract.salary.toLocaleString()}
                                </div>
                              </div>
                              {contract.signatures && contract.signatures.length > 0 && (
                                <div className="mt-3 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                                  <span className="text-sm text-success-700 dark:text-success-500">
                                    Signed by {contract.signatures.length} parties
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 ml-6">
                            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'compliance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Compliance Tracking</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">Completed</h4>
                          <p className="text-2xl font-bold text-success-600 dark:text-success-500">847</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Policies acknowledged, contracts signed</p>
                    </div>

                    <div className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-warning-100 dark:bg-warning-500/10 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning-600 dark:text-warning-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">Pending</h4>
                          <p className="text-2xl font-bold text-warning-600 dark:text-warning-500">156</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Awaiting acknowledgment or signature</p>
                    </div>

                    <div className="p-6 border border-slate-200 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-danger-100 dark:bg-danger-500/10 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">Overdue</h4>
                          <p className="text-2xl font-bold text-danger-600 dark:text-danger-500">23</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Past due dates requiring attention</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Document Templates</h3>
                    <Button variant="primary" size="sm">
                      Create Template
                    </Button>
                  </div>

                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Document Templates</h3>
                    <p className="text-slate-700 dark:text-slate-300">Create and manage reusable document templates</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Contract templates, policy templates, form templates</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsDashboard;

