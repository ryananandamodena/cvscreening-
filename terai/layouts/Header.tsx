import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationBell from '../components/NotificationBell';

interface HeaderProps {
    collapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ collapsed }) => {
    const { t } = useLanguage();
    
    return (
        <header className="sticky top-0 z-40 w-full h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 sm:px-10 flex items-center justify-between transition-all">
            <div className="relative w-full max-w-md group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input
                    type="text"
                    placeholder={t('header.searchPlaceholder') || 'Search candidates, jobs, or docs...'}
                    className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-full text-sm focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                />
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <NotificationBell />
                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-50 bg-slate-100 shadow-sm"
                        alt="Profile"
                    />
                    <div className="text-left hidden lg:block">
                        <p className="text-sm font-bold text-slate-800 leading-none">Alex Johnson</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('header.enterpriseAdmin') || 'Admin'}</p>
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Header;
