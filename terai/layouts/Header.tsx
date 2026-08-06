import React from 'react';
import { Search, Moon, Sun, Monitor } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from '../components/NotificationBell';

interface HeaderProps {
    collapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ collapsed }) => {
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();

    return (
        <header className="sticky top-0 z-40 w-full h-16 bg-white dark:bg-[#000000] border-b border-slate-200 dark:border-neutral-800 px-6 sm:px-10 flex items-center justify-between transition-all shadow-sm">
            <div className="relative w-full max-w-md group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-brand-600 transition-colors" size={16} />
                <input
                    type="text"
                    placeholder={t('header.searchPlaceholder') || 'Search candidates, jobs, or docs...'}
                    className="w-full pl-9 pr-4 py-2 bg-slate-100/60 dark:bg-neutral-800/60 border border-transparent rounded-full text-sm focus:bg-white dark:focus:bg-neutral-900 focus:border-brand-300 dark:focus:border-brand-700 focus:ring-4 focus:ring-brand-600/10 transition-all outline-none font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
                    className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-neutral-800/50 border border-transparent hover:border-slate-200/50 dark:hover:border-neutral-700/50 transition-colors"
                    title={theme === 'dark' ? 'Light Mode' : theme === 'light' ? 'System' : 'Dark Mode'}
                >
                    {theme === 'dark' ? <Moon size={18} className="text-brand-400" /> : theme === 'light' ? <Sun size={18} className="text-amber-500" /> : <Monitor size={18} className="text-slate-600 dark:text-slate-400" />}
                </button>
                <NotificationBell />
                <div className="h-6 w-px bg-slate-200 dark:bg-neutral-700 mx-2 hidden sm:block"></div>
                <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100/50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-neutral-700/50">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900 bg-slate-100 shadow-sm"
                        alt="Profile"
                    />
                    <div className="text-left hidden lg:block">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">Alex Johnson</p>
                        <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-0.5">{t('header.enterpriseAdmin') || 'Admin'}</p>
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Header;
