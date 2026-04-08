import React, { useState, useEffect } from 'react';
import {
  Settings, User, Shield, Zap, Save, Lock, Eye, CreditCard, Loader2, Check, ChevronRight, Code
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [config, setConfig] = useState<any>({
    organizationName: '',
    enterpriseDomain: '',
    primaryLanguage: 'English (US)',
    brandColor: '#4F46E5',
    aiThreshold: 85,
    strictBiasGuard: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiService.getSettings();
        if (data) setConfig(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
        addToast('error', t('settings.loadFailed') || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateSettings(config);
      addToast('success', t('settings.savedSuccess') || "Settings saved successfully!");
    } catch (err) {
      addToast('error', t('settings.saveFailed') || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: t('settings.tabs.general'), icon: Settings },
    { id: 'ai', label: t('settings.tabs.ai'), icon: Zap },
    { id: 'team', label: t('settings.tabs.team'), icon: User },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
    { id: 'billing', label: t('settings.tabs.billing'), icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('settings.activeSystemCore')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('settings.enterpriseTitle')}</h1>
          <p className="text-slate-500 font-medium text-lg mt-1 tracking-tight">{t('settings.enterpriseSubtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? t('settings.saving') : t('settings.saveAll')}
        </button>
      </div>

      <div className="flex gap-10">
        {/* Navigation Tabs */}
        <div className="w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-black text-sm uppercase tracking-widest ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-2'
                : 'text-slate-400 hover:bg-white hover:text-slate-600 border border-transparent hover:border-slate-200'
                }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === 'general' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl space-y-10 animate-in fade-in duration-500">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.companyProfile')}</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.orgName')}</label>
                    <input
                      type="text"
                      value={config.organizationName}
                      onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.domain')}</label>
                    <input
                      type="text"
                      value={config.enterpriseDomain}
                      onChange={(e) => setConfig({ ...config, enterpriseDomain: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.branding')}</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.primaryLanguage')}</label>
                    <select
                      value={config.primaryLanguage}
                      onChange={(e) => setConfig({ ...config, primaryLanguage: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold appearance-none"
                    >
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Bahasa Indonesia</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.brandColor')}</label>
                    <div className="flex gap-4">
                      <input
                        type="color"
                        value={config.brandColor}
                        onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                        className="h-14 w-20 rounded-2xl cursor-pointer border-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={config.brandColor}
                        onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                        className="flex-1 p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl space-y-10 animate-in fade-in duration-500">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.aiTuning')}</h3>
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Zap size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">GPT-4o Mini Active</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('settings.threshold')}</label>
                    <div className="flex items-center gap-6">
                      <input
                        type="range"
                        min="50" max="95"
                        value={config.aiThreshold}
                        onChange={(e) => setConfig({ ...config, aiThreshold: parseInt(e.target.value) })}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="text-lg font-black text-slate-900">{config.aiThreshold}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-rose-50 rounded-3xl border border-rose-100">
                    <div>
                      <h4 className="font-black text-rose-900">{t('settings.biasGuard')}</h4>
                      <p className="text-xs text-rose-600 mt-1">{t('settings.biasGuardSub')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={config.strictBiasGuard}
                        onChange={(e) => setConfig({ ...config, strictBiasGuard: e.target.checked })}
                      />
                      <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-6 bg-slate-50 rounded-full text-slate-300"><User size={48} /></div>
                <h3 className="text-xl font-black text-slate-900">{t('settings.userHubTitle')}</h3>
                <p className="max-w-xs text-slate-500 font-medium">{t('settings.userHubSub')}</p>
                <button className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">{t('settings.configureAuth')}</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl space-y-10 animate-in fade-in duration-500">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.apiEncryption')}</h3>
                <div className="space-y-6">
                  <div className="p-6 bg-[#0f172a] rounded-3xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('settings.accessToken')}</p>
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-white"><Eye size={16} /></button>
                        <button className="p-2 text-slate-400 hover:text-white"><Code size={16} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <Lock size={16} className="text-slate-500" />
                      {/* Fix: changed readonly to readOnly as required by React TSX */}
                      <input type="password" readOnly value="RECRUITAI_SECURE_TOKEN_2024_PRO" className="bg-transparent border-none outline-none text-slate-300 font-mono text-sm flex-1" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div>
                      <h4 className="font-black text-slate-900">{t('settings.twoFactor')}</h4>
                      <p className="text-xs text-slate-500 mt-1">{t('settings.twoFactorSub')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
