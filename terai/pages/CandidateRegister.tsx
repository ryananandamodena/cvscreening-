import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { candidatePortalService } from '../services/candidate-portal.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const CandidateRegister: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            addToast('error', t('candidate.register.passwordMismatch'));
            return;
        }

        if (formData.password.length < 6) {
            addToast('error', t('candidate.register.passwordTooShort'));
            return;
        }

        setLoading(true);

        try {
            await candidatePortalService.register(
                formData.email,
                formData.password,
                formData.fullName,
                formData.phone
            );
            addToast('success', t('candidate.register.success'));
            navigate('/candidate/login');
        } catch (error: any) {
            addToast('error', error.message || t('candidate.register.error'));
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
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('candidate.register.title')}</h1>
                    <p className="text-slate-500">{t('candidate.register.subtitle')}</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('candidate.register.fullName')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder={t('candidate.register.fullNamePlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('candidate.register.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder={t('candidate.register.emailPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('candidate.register.phone')}
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder={t('candidate.register.phonePlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('candidate.register.password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={t('candidate.register.passwordPlaceholder')}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('candidate.register.confirmPassword')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder={t('candidate.register.confirmPasswordPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                />
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
                                    {t('candidate.register.submit')}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-500">
                            {t('candidate.register.loginPrompt')}
                            <Link to="/candidate/login" className="text-indigo-600 font-semibold hover:text-indigo-700 ml-1">
                                {t('candidate.register.loginLink')}
                            </Link>
                        </p>
                    </div>

                    {/* Back to Careers */}
                    <div className="mt-4 text-center">
                        <Link to="/careers" className="text-slate-400 hover:text-slate-600 text-sm">
                            ← {t('candidate.register.backToCareers')}
                        </Link>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="font-semibold text-slate-800 mb-4 text-center">{t('candidate.register.benefitsTitle')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            t('candidate.register.benefit1'),
                            t('candidate.register.benefit2'),
                            t('candidate.register.benefit3'),
                            t('candidate.register.benefit4'),
                        ].map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                <span className="text-sm text-slate-600">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateRegister;
