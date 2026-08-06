import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { candidatePortalService } from '../services/candidate-portal.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';

const CandidateLogin: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await candidatePortalService.login(email, password);
            addToast('success', t('candidate.login.success'));
            navigate('/candidate/dashboard');
        } catch (error: any) {
            addToast('error', error.message || t('candidate.login.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/careers" className="inline-flex items-center gap-3 mb-8">
                        <div className="bg-brand-600 p-3 rounded-xl shadow-lg shadow-brand-600/20">
                            <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <span className="font-black text-3xl tracking-tight text-brand-600 dark:text-brand-400">
                            HumanIQ
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('candidate.login.title')}</h1>
                    <p className="text-slate-700 dark:text-slate-300">{t('candidate.login.subtitle')}</p>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-neutral-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                {t('candidate.login.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('candidate.login.emailPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/40 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                {t('candidate.login.password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('candidate.login.passwordPlaceholder')}
                                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/40 outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            loading={loading}
                            size="lg"
                            className="w-full"
                        >
                            {!loading && (
                                <>
                                    {t('candidate.login.submit')}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-neutral-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-neutral-900 text-slate-700 dark:text-slate-300">{t('candidate.login.or')}</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-slate-700 dark:text-slate-300">
                            {t('candidate.login.registerPrompt')}
                            <Link to="/candidate/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300 ml-1">
                                {t('candidate.login.registerLink')}
                            </Link>
                        </p>
                    </div>

                    {/* Back to Careers */}
                    <div className="mt-6 text-center">
                        <Link to="/careers" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm">
                            ← {t('candidate.login.backToCareers')}
                        </Link>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    {[
                        { icon: CheckCircle, text: t('candidate.login.benefit1') },
                        { icon: CheckCircle, text: t('candidate.login.benefit2') },
                        { icon: CheckCircle, text: t('candidate.login.benefit3') },
                    ].map((benefit, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <benefit.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            <span className="text-xs text-slate-700 dark:text-slate-300">{benefit.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CandidateLogin;
