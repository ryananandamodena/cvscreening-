
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ChevronRight, Zap } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.login({ email, password });
      // Using navigate for standard HashRouter transition
      navigate('/', { replace: true });
    } catch (err) {
      alert(t('login.failed') + (err as any).message);
      console.error("Login attempt failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center p-6 font-inter">
      <div className="w-full max-w-5xl flex bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-neutral-800">
        <div className="flex-1 p-20 flex flex-col justify-center space-y-10">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-3 rounded-2xl shadow-xl shadow-brand-600/20">
              <Zap size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">RecruitAI <span className="text-brand-600 dark:text-brand-400">Enterprise</span></span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('login.title')}</h1>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">{t('login.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-neutral-800 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:focus:bg-neutral-800 rounded-2xl transition-all outline-none font-bold text-slate-900 dark:text-white"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-neutral-800 border-2 border-transparent focus:border-brand-600 focus:bg-white dark:focus:bg-neutral-800 rounded-2xl transition-all outline-none font-bold text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              size="lg"
              className="w-full rounded-3xl font-black shadow-2xl shadow-brand-600/30"
            >
              {loading ? t('login.loading') : t('login.submit')} <ChevronRight size={20} />
            </Button>
          </form>

          <div className="pt-6 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-2 text-success-600 dark:text-success-500">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('login.encrypted')}</span>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 dark:bg-neutral-950 relative p-20 flex flex-col justify-end overflow-hidden group">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-125"></div>
          <div className="relative z-10 space-y-6">
            <div className="size-20 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center">
              <Zap size={32} className="text-slate-900 dark:text-white" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{t('login.heroTitle')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
              {t('login.heroSubtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
