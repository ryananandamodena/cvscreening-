import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, LogOut, Menu, Globe, Moon, Sun, Monitor, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_ROUTES } from '../config/routes';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
    const location = useLocation();
    const { lang, setLang, t } = useLanguage();
    const { theme, setTheme } = useTheme();

    const sectionKeys = ['section.overview', 'section.recruitment', 'section.resources', 'section.system'] as const;

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 88 : 280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-screen bg-[#FDFDFD] border-r border-slate-200/50 z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
        >
            {/* Brand Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
                <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
                    <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20 shrink-0">
                        <Plus size={20} className="text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -10 }}
                                className="font-extrabold text-2xl tracking-tight text-slate-900"
                            >
                                RecruitAI
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-8 mt-4 layout-scrollbar">
                {sectionKeys.map((sectionKey) => {
                    const sectionRoutes = APP_ROUTES.filter(route => route.section === sectionKey && !route.hidden);
                    if (sectionRoutes.length === 0) return null;

                    return (
                        <div key={sectionKey} className="relative">
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.h3
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="px-4 mb-4 text-xs font-black text-slate-400 uppercase tracking-widest"
                                    >
                                        {t(sectionKey)}
                                    </motion.h3>
                                )}
                            </AnimatePresence>
                            <div className="space-y-1.5 relative">
                                {sectionRoutes.map((route) => {
                                    const linkPath = route.path.replace(/\/:[^?]+\?/g, '');
                                    const active = location.pathname === linkPath || (linkPath !== '/' && location.pathname.startsWith(linkPath));

                                    return (
                                        <Link
                                            key={route.path}
                                            to={linkPath}
                                            title={collapsed ? t(route.label) : ''}
                                            className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group overflow-hidden whitespace-nowrap ${
                                                active
                                                    ? 'text-indigo-700 font-bold bg-indigo-50 shadow-sm shadow-indigo-100/50'
                                                    : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            {active && (
                                                <motion.div 
                                                    layoutId="activeNavBackground" 
                                                    className="absolute inset-0 bg-indigo-50 rounded-2xl -z-10" 
                                                />
                                            )}
                                            <route.icon size={22} className={`shrink-0 z-10 transition-transform duration-300 ${active ? 'text-indigo-600' : 'group-hover:scale-110 group-hover:text-slate-700'}`} />
                                            <AnimatePresence>
                                                {!collapsed && (
                                                    <motion.span 
                                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                                        className={`text-[15px] z-10 ${active ? 'font-bold text-indigo-700' : 'font-semibold text-slate-600 group-hover:text-slate-900'}`}
                                                    >
                                                        {t(route.label)}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer Workspace Toggles */}
            <div className="p-4 border-t border-slate-100 bg-[#FDFDFD]">
                <div className="grid gap-1.5">
                     <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
                        className={`flex items-center gap-4 p-3.5 w-full rounded-2xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900 overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? (theme === 'dark' ? 'Light Mode' : theme === 'light' ? 'System' : 'Dark Mode') : ''}
                    >
                        {theme === 'dark' ? <Moon size={20} className="shrink-0 text-indigo-500" /> : theme === 'light' ? <Sun size={20} className="shrink-0 text-amber-500" /> : <Monitor size={20} className="shrink-0 text-slate-400" />}
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-xs uppercase tracking-widest text-slate-600">
                                    {theme === 'dark' ? '🌙 Dark' : theme === 'light' ? '☀️ Light' : '💻 System'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                    
                     <button
                        onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                        className={`flex items-center gap-4 p-3.5 w-full rounded-2xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900 overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? (lang === 'id' ? 'English' : 'Indonesia') : ''}
                    >
                        <Globe size={20} className="shrink-0 text-indigo-500" />
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-xs uppercase tracking-widest text-slate-600">
                                    {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    <div className="h-px bg-slate-100 my-2"></div>

                    <button
                        onClick={() => apiService.logout()}
                        className={`flex items-center gap-4 p-3.5 w-full rounded-2xl transition-all text-rose-500 hover:bg-rose-50 overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? t('common.logout') || 'Logout' : ""}
                    >
                        <LogOut size={20} className="shrink-0" />
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-xs uppercase tracking-widest">
                                    {t('common.logout') || 'Logout'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`mt-2 flex items-center p-3.5 w-full text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronRight size={20} className="shrink-0" />
                        </motion.div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-xs tracking-widest uppercase ml-4 text-slate-500">
                                    Collapse Sidebar
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
