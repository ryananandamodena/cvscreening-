
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import HumaniqMark from '../components/HumaniqMark';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.login({ email, password });
      // Using navigate for standard HashRouter transition
      navigate('/', { replace: true });
    } catch (err) {
      addToast('error', t('login.failed') || 'Login failed. Please check your credentials.');
      console.error("Login attempt failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#000000] flex items-center justify-center p-6 font-inter">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-slate-200 dark:border-neutral-800 p-8 sm:p-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-1 rounded-xl mb-4">
            <HumaniqMark size={44} />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">Human<span className="text-brand-600 dark:text-brand-400">IQ</span></span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4">{t('login.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('login.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:border-brand-600 dark:focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 rounded-lg transition-all outline-none text-sm font-medium text-slate-900 dark:text-white"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 focus:border-brand-600 dark:focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 rounded-lg transition-all outline-none text-sm font-medium text-slate-900 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300 dark:border-neutral-700 text-brand-600 focus:ring-brand-600/30"
              />
              {t('login.rememberMe') || 'Ingat saya'}
            </label>
            <a href="#/forgot-password" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              {t('login.forgotPassword') || 'Lupa kata sandi?'}
            </a>
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            size="lg"
            className="w-full justify-center rounded-lg"
          >
            {loading ? t('login.loading') : t('login.submit')}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          © {new Date().getFullYear()} HumanIQ. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
