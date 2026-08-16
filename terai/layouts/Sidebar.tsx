import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Globe, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_ROUTES } from '../config/routes';
import { apiService } from '../services/api.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../guards/AuthGuard';
import HumaniqMark from '../components/HumaniqMark';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
    const location = useLocation();
    const { lang, setLang, t } = useLanguage();
    const { role } = useAuth();

    const sectionKeys = ['section.overview', 'section.coreHr', 'section.recruitment', 'section.resources', 'section.system'] as const;

    // Hiding a menu item is UX only, not security — RoleGuard still enforces this same
    // `route.roles` check on the route itself, so a restricted page can't be reached even by
    // typing the URL directly. This just keeps the sidebar from listing items the user would
    // immediately get "Access Denied" on.
    const isVisibleForRole = (routeRoles?: string[]) => !routeRoles || !role || routeRoles.includes(role);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 88 : 280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-screen bg-white dark:bg-[#000000] border-r border-slate-200 dark:border-neutral-800 z-50 flex flex-col shadow-sm"
        >
            {/* Brand Header */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
                    <div className="bg-white dark:bg-neutral-900 p-1.5 rounded-2xl shadow-lg shadow-brand-600/20 shrink-0 border border-slate-100 dark:border-neutral-800">
                        <HumaniqMark size={26} />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white"
                            >
                                HumanIQ
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-8 mt-4 layout-scrollbar">
                {sectionKeys.map((sectionKey) => {
                    const sectionRoutes = APP_ROUTES.filter(route => route.section === sectionKey && !route.hidden && isVisibleForRole(route.roles));
                    if (sectionRoutes.length === 0) return null;

                    return (
                        <div key={sectionKey} className="relative">
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.h3
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="px-4 mb-4 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest"
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
                                            className={`relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden whitespace-nowrap ${
                                                active
                                                    ? 'text-brand-700 dark:text-brand-400 font-bold bg-brand-50/80 dark:bg-brand-900/40 shadow-sm'
                                                    : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            {active && (
                                                <motion.div
                                                    layoutId="activeNavBackground"
                                                    className="absolute inset-0 bg-brand-50 dark:bg-brand-900/40 rounded-2xl -z-10"
                                                />
                                            )}
                                            <route.icon size={22} className={`shrink-0 z-10 transition-transform duration-300 ${active ? 'text-brand-600 dark:text-brand-400' : 'group-hover:scale-110 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                                            <AnimatePresence>
                                                {!collapsed && (
                                                    <motion.span
                                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                                        className={`text-[15px] z-10 ${active ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}
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
            <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#000000]">
                <div className="grid gap-1.5">
                     <button
                        onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                        className={`flex items-center gap-4 p-3.5 w-full rounded-2xl transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? (lang === 'id' ? 'English' : 'Indonesia') : ''}
                    >
                        <Globe size={20} className="shrink-0 text-brand-500" />
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                    {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-neutral-800 my-2"></div>

                    <button
                        onClick={() => apiService.logout()}
                        className={`flex items-center gap-4 p-3.5 w-full rounded-2xl transition-all text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : ''}`}
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
                        className={`mt-2 flex items-center p-3.5 w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-800 dark:hover:text-white rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 overflow-hidden whitespace-nowrap ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronRight size={20} className="shrink-0" />
                        </motion.div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-xs tracking-widest uppercase ml-4 text-slate-700 dark:text-slate-300">
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
