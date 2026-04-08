import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { candidatePortalService } from '../services/candidate-portal.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/careers" className="inline-flex items-center gap-3 mb-8">
                        <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-600/20">
                            <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <span className="font-black text-3xl tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            RecruitAI
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('candidate.login.title')}</h1>
                    <p className="text-slate-500">{t('candidate.login.subtitle')}</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('candidate.login.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('candidate.login.emailPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('candidate.login.password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('candidate.login.passwordPlaceholder')}
                                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {t('candidate.login.submit')}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">{t('candidate.login.or')}</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-slate-500">
                            {t('candidate.login.registerPrompt')}
                            <Link to="/candidate/register" className="text-indigo-600 font-semibold hover:text-indigo-700 ml-1">
                                {t('candidate.login.registerLink')}
                            </Link>
                        </p>
                    </div>

                    {/* Back to Careers */}
                    <div className="mt-6 text-center">
                        <Link to="/careers" className="text-slate-400 hover:text-slate-600 text-sm">
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
                            <benefit.icon className="w-5 h-5 text-indigo-600" />
                            <span className="text-xs text-slate-500">{benefit.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CandidateLogin;
