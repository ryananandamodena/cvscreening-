import React, { useState, useEffect } from 'react';
import {
  Zap, Settings, Link, Unlink, CheckCircle2, AlertTriangle,
  Clock, RefreshCw, Database, Cloud, Shield, BarChart3,
  Plus, Eye, Edit, Trash2, Download, Upload, DollarSign, Users, UserCheck, BookOpen
} from 'lucide-react';
import { integrationsService, IntegrationConnection, IntegrationProvider } from '../../services/integrations.service';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const EnterpriseIntegrations: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [providersData, connectionsData] = await Promise.all([
        integrationsService.getProviders(),
        integrationsService.getConnections()
      ]);
      setProviders(providersData);
      setConnections(connectionsData);
    } catch (err) {
      console.error('Failed to fetch integrations data:', err);
      showToast('error', 'Failed to load integrations data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    // Open connection modal/form
    showToast('info', `Connecting to ${provider.name}...`);
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      const result = await integrationsService.testConnection(connectionId);
      if (result.success) {
        showToast('success', 'Connection test successful');
      } else {
        showToast('error', `Connection test failed: ${result.message}`);
      }
    } catch (err) {
      showToast('error', 'Failed to test connection');
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      await integrationsService.triggerSync(connectionId, 'incremental_sync');
      showToast('success', 'Sync initiated successfully');
      fetchData(); // Refresh data
    } catch (err) {
      showToast('error', 'Failed to initiate sync');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'syncing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="w-4 h-4" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'erp': return <Database className="w-5 h-5" />;
      case 'hr': return <Shield className="w-5 h-5" />;
      case 'payroll': return <DollarSign className="w-5 h-5" />;
      case 'crm': return <Users className="w-5 h-5" />;
      case 'ats': return <UserCheck className="w-5 h-5" />;
      case 'lms': return <BookOpen className="w-5 h-5" />;
      default: return <Cloud className="w-5 h-5" />;
    }
  };

  const getPricingColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-emerald-100 text-emerald-700';
      case 'freemium': return 'bg-blue-100 text-blue-700';
      case 'paid': return 'bg-amber-100 text-amber-700';
      case 'enterprise': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const stats = {
    totalProviders: providers.length,
    connectedIntegrations: connections.filter(c => c.connectionStatus === 'connected').length,
    activeSyncs: connections.filter(c => c.connectionStatus === 'syncing').length,
    errorConnections: connections.filter(c => c.connectionStatus === 'error').length
  };

  const categories = {
    erp: providers.filter(p => p.type === 'erp'),
    hr: providers.filter(p => p.type === 'hr'),
    payroll: providers.filter(p => p.type === 'payroll'),
    others: providers.filter(p => !['erp', 'hr', 'payroll'].includes(p.type))
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/30">
              <Zap size={32} />
            </div>
            Enterprise Integrations
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Connect with SAP, Oracle, Workday, and other enterprise systems.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<BarChart3 size={16} />}>
            Analytics
          </Button>
          <Button variant="outline" icon={<Download size={16} />}>
            Export Logs
          </Button>
          <Button variant="primary" icon={<Plus size={16} />}>
            Add Integration
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
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-blue-500/10 group-hover:scale-110 transition-transform duration-500">
                <Database size={24} className="text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Available Providers</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalProviders}</h3>
              <span className="text-xs font-bold text-blue-500">enterprise systems</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
                <Link size={24} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Connected Systems</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.connectedIntegrations}</h3>
              <span className="text-xs font-bold text-emerald-500">active connections</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-blue-500/10 group-hover:scale-110 transition-transform duration-500">
                <RefreshCw size={24} className="text-blue-600" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Active Syncs</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.activeSyncs}</h3>
              <span className="text-xs font-bold text-blue-500">in progress</span>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-red-500/10 group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Error Connections</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.errorConnections}</h3>
              <span className="text-xs font-bold text-red-500">needs attention</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Integration Categories */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Integration Types</h2>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'overview' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Overview</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Integration dashboard</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('erp')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'erp' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">ERP Systems</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{categories.erp.length} providers</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('hr')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'hr' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">HR Systems</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{categories.hr.length} providers</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('payroll')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'payroll' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Payroll Systems</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{categories.payroll.length} providers</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('connections')}
                className={`w-full p-4 border rounded-xl transition-colors text-left group ${
                  activeTab === 'connections' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Link className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">My Connections</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{connections.length} active</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Connection Health */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Connection Health</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Healthy</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-bold text-slate-900">{stats.connectedIntegrations}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Syncing</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-bold text-slate-900">{stats.activeSyncs}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Errors</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-bold text-slate-900">{stats.errorConnections}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Integration Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">SAP HR integration completed</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">Successfully synced 1,250 employee records • 2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Workday payroll sync in progress</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">Processing 450 payroll records • Started 15 minutes ago</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-neutral-800 rounded-lg">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Oracle HCM connection error</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300">Authentication failed - credentials need updating • 1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popular Integrations */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Popular Enterprise Integrations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'SAP', type: 'ERP', users: '50K+', features: ['HR', 'Payroll', 'Finance'] },
                        { name: 'Oracle HCM', type: 'HR', users: '30K+', features: ['Core HR', 'Talent', 'Payroll'] },
                        { name: 'Workday', type: 'HR', users: '40K+', features: ['HCM', 'Payroll', 'Analytics'] },
                        { name: 'ADP', type: 'Payroll', users: '25K+', features: ['Payroll', 'HR', 'Time'] },
                        { name: 'SuccessFactors', type: 'HR', users: '35K+', features: ['Performance', 'Learning', 'Recruiting'] },
                        { name: 'UltiPro', type: 'HR', users: '15K+', features: ['HR', 'Payroll', 'Benefits'] }
                      ].map((system, index) => (
                        <div key={index} className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-neutral-900">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{system.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPricingColor('enterprise')}`}>
                              Enterprise
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{system.type} System • {system.users} companies</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {system.features.map((feature, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                          <button className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                            Connect {system.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'erp' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">ERP System Integrations</h3>
                    <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                      Setup ERP Integration
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.erp.map((provider) => (
                      <div key={provider.id} className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-neutral-900">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Database className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{provider.name}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{provider.description}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPricingColor(provider.pricingTier)}`}>
                            {provider.pricingTier}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Supported Features:</p>
                          <div className="flex flex-wrap gap-2">
                            {provider.supportedFeatures.slice(0, 4).map((feature, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConnect(provider)}
                            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Link className="w-4 h-4" />
                            Connect
                          </button>
                          <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'hr' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">HR System Integrations</h3>
                    <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                      Setup HR Integration
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.hr.map((provider) => (
                      <div key={provider.id} className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-neutral-900">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Shield className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{provider.name}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{provider.description}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPricingColor(provider.pricingTier)}`}>
                            {provider.pricingTier}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Supported Features:</p>
                          <div className="flex flex-wrap gap-2">
                            {provider.supportedFeatures.slice(0, 4).map((feature, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConnect(provider)}
                            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Link className="w-4 h-4" />
                            Connect
                          </button>
                          <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payroll System Integrations</h3>
                    <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                      Setup Payroll Integration
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.payroll.map((provider) => (
                      <div key={provider.id} className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-neutral-900">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{provider.name}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{provider.description}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPricingColor(provider.pricingTier)}`}>
                            {provider.pricingTier}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Supported Features:</p>
                          <div className="flex flex-wrap gap-2">
                            {provider.supportedFeatures.slice(0, 4).map((feature, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConnect(provider)}
                            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Link className="w-4 h-4" />
                            Connect
                          </button>
                          <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'connections' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">My Integrations</h3>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">Bulk Test</Button>
                      <Button variant="secondary" size="sm">Bulk Sync</Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {connections.map((connection) => (
                      <div key={connection.id} className="p-6 border border-slate-200 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-neutral-900">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                              {getProviderIcon('erp')} {/* You might want to get this from connection data */}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{connection.providerName}</h4>
                                <Badge tone={connection.connectionStatus === 'connected' ? 'success' : connection.connectionStatus === 'syncing' ? 'info' : connection.connectionStatus === 'error' ? 'danger' : 'neutral'} className="flex items-center gap-1 normal-case">
                                  {getStatusIcon(connection.connectionStatus)}
                                  {connection.connectionStatus}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Sync</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : 'Never'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Next Sync</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {connection.nextSyncAt ? new Date(connection.nextSyncAt).toLocaleString() : 'Not scheduled'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frequency</p>
                                  <p className="text-sm text-slate-600 capitalize">{connection.syncFrequency}</p>
                                </div>
                              </div>

                              {connection.errorMessage && (
                                <div className="p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg">
                                  <div className="flex items-center gap-2 text-danger-800 dark:text-danger-500">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Connection Error: {connection.errorMessage}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 ml-6">
                            <button
                              onClick={() => handleTestConnection(connection.id)}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                              title="Test Connection"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSync(connection.id)}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                              title="Sync Data"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                              <Settings className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-lg transition-colors">
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {connections.length === 0 && (
                      <div className="text-center py-12">
                        <Cloud className="w-16 h-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No integrations connected</h3>
                        <p className="text-slate-700 dark:text-slate-300 mb-6">Connect your enterprise systems to unlock powerful integrations</p>
                        <Button variant="primary" onClick={() => setActiveTab('overview')}>
                          Browse Integrations
                        </Button>
                      </div>
                    )}
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

export default EnterpriseIntegrations;
