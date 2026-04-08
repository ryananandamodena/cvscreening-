
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ChevronRight, Zap } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
      <div className="w-full max-w-5xl flex bg-white rounded-[50px] shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex-1 p-20 flex flex-col justify-center space-y-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl">
              <Zap size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">RecruitAI <span className="text-indigo-600">Enterprise</span></span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('login.title')}</h1>
            <p className="text-slate-500 font-medium">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('login.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? t('login.loading') : t('login.submit')} <ChevronRight size={20} />
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 flex items-center gap-2 text-emerald-600">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('login.encrypted')}</span>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 relative p-20 flex flex-col justify-end overflow-hidden group">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-125"></div>
          <div className="relative z-10 space-y-6">
            <div className="size-20 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center">
              <Zap size={32} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">{t('login.heroTitle')}</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              {t('login.heroSubtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
