import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Check, Settings2, ShieldCheck, Zap, Loader2, Trash2, Power } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

interface Integration {
  id?: number;
  name: string;
  category: string;
  description: string;
  status: string;
  icon: string;
  config?: any;
}

// Note: In a real app, these would come from the backend or a better config.
// For now, we'll keep the static names but they match the translation keys if needed.
const DEFAULT_TOOLS: Integration[] = [
  { name: 'Slack', category: 'Communication', description: 'integrations.slackDesc', status: 'Not Connected', icon: 'S' },
  { name: 'Workday', category: 'HRIS', description: 'integrations.workdayDesc', status: 'Not Connected', icon: 'W' },
  { name: 'SAP SuccessFactors', category: 'ERP', description: 'integrations.sapDesc', status: 'Not Connected', icon: 'SAP' },
  { name: 'Google Calendar', category: 'Scheduling', description: 'integrations.gcalDesc', status: 'Not Connected', icon: 'G' },
  { name: 'Microsoft Teams', category: 'Communication', description: 'integrations.teamsDesc', status: 'Not Connected', icon: 'T' },
];

const Integrations = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [tools, setTools] = useState<Integration[]>(DEFAULT_TOOLS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const backendData = await apiService.getIntegrations();

      if (backendData && backendData.length > 0) {
        // Merge backend data with defaults
        const merged = DEFAULT_TOOLS.map(def => {
          const found = backendData.find((b: any) =>
            b.name?.toLowerCase() === def.name.toLowerCase() ||
            b.provider?.toLowerCase() === def.name.toLowerCase()
          );
          if (found) {
            return {
              ...def,
              id: found.id,
              status: found.status === 'active' ? 'Connected' : found.status === 'pending' ? 'Pending' : 'Not Connected',
              config: found.config,
            };
          }
          return def;
        });
        setTools(merged);
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
      addToast('error', t('integrations.loadingError') || 'Failed to load integrations');
      // Keep default static data
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (tool: Integration) => {
    setActionLoading(tool.name);
    const provider = tool.name.toLowerCase().replace(/\s+/g, '_');
    try {
      await apiService.connectIntegration(provider);
      addToast('success', t('integrations.connectSuccess') || `${tool.name} connected successfully`);
      await fetchIntegrations();
    } catch (err: any) {
      console.error('Failed to connect:', err);
      addToast('error', err.message || t('integrations.connectError'));
      // Optimistic update for demo purposes if backend fails but we want to show UI change
      setTools(prev => prev.map(t =>
        t.name === tool.name ? { ...t, status: 'Connected' } : t
      ));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (tool: Integration) => {
    setActionLoading(tool.name);
    const provider = tool.name.toLowerCase().replace(/\s+/g, '_');
    try {
      await apiService.disconnectIntegration(provider);
      addToast('success', t('integrations.disconnectSuccess') || `${tool.name} disconnected`);
      await fetchIntegrations();
    } catch (err: any) {
      console.error('Failed to disconnect:', err);
      addToast('error', err.message || t('integrations.disconnectError'));
      setTools(prev => prev.map(t =>
        t.name === tool.name ? { ...t, status: 'Not Connected', id: undefined } : t
      ));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="relative">
        <div className="absolute -left-4 top-0 w-12 h-12 bg-indigo-600 rounded-full blur-[40px] opacity-20"></div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('integrations.title')}</h1>
        <p className="text-slate-500 font-medium mt-1 tracking-tight">{t('integrations.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className={`size-12 rounded-xl flex items-center justify-center font-black text-white ${tool.name === 'Slack' ? 'bg-[#4A154B]' :
                tool.name === 'Workday' ? 'bg-[#0875e1]' :
                  tool.name === 'SAP SuccessFactors' ? 'bg-[#008fd3]' : 'bg-slate-900'
                }`}>
                {tool.icon}
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${tool.status === 'Connected' ? 'bg-emerald-100 text-emerald-700' :
                tool.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                }`}>
                {tool.status === 'Connected' ? t('integrations.connected') :
                  tool.status === 'Pending' ? t('integrations.pending') : t('integrations.notConnected')}
              </span>
            </div>
            <div className="mt-8 flex flex-col flex-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
              <p className="text-[10px] font-black text-indigo-500 mt-1 uppercase tracking-widest">{tool.category}</p>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">{t(tool.description)}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
              {tool.status === 'Connected' ? (
                <button
                  onClick={() => handleDisconnect(tool)}
                  disabled={actionLoading === tool.name}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center gap-2 disabled:opacity-50 border border-rose-100"
                >
                  {actionLoading === tool.name ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Power size={14} />
                  )}
                  {t('integrations.disconnect')}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(tool)}
                  disabled={actionLoading === tool.name}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === tool.name ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  {t('integrations.connect')}
                </button>
              )}
              <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100">
                <Settings2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0f172a] p-12 rounded-[40px] text-white relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 text-indigo-400 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('integrations.enterprise')}</span>
            </div>
            <h2 className="text-4xl font-black mb-6 tracking-tight">{t('integrations.webhookTitle')}</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
              {t('integrations.webhookDesc')}
            </p>
            <button className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs">
              <Zap size={20} className="text-indigo-600" /> {t('integrations.docs')}
            </button>
          </div>
          <div className="hidden lg:block relative">
            <div className="size-64 bg-indigo-600/20 rounded-full blur-[100px] absolute -right-20 -top-20 animate-pulse"></div>
            <LinkIcon size={160} className="text-white/10 rotate-12 drop-shadow-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
