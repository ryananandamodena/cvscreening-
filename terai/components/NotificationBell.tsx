import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, FileSearch, Mail, Calendar, ClipboardList, UserPlus, Info } from 'lucide-react';
import { useNotifications, NotificationType } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

const typeIcons: Record<NotificationType, React.ReactNode> = {
    screening_complete: <FileSearch size={16} className="text-indigo-500" />,
    offer_created: <Mail size={16} className="text-emerald-500" />,
    interview_scheduled: <Calendar size={16} className="text-blue-500" />,
    assessment_created: <ClipboardList size={16} className="text-amber-500" />,
    candidate_applied: <UserPlus size={16} className="text-violet-500" />,
    info: <Info size={16} className="text-slate-600 dark:text-slate-400" />,
};

const typeBgColors: Record<NotificationType, string> = {
    screening_complete: 'bg-indigo-50',
    offer_created: 'bg-emerald-50',
    interview_scheduled: 'bg-blue-50',
    assessment_created: 'bg-amber-50',
    candidate_applied: 'bg-violet-50',
    info: 'bg-slate-50',
};

function timeAgo(timestamp: number, t: (key: string) => string): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('notifications.justNow');
    if (mins < 60) return `${mins}${t('notifications.minsAgo')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t('notifications.hrsAgo')}`;
    const days = Math.floor(hrs / 24);
    return `${days}${t('notifications.daysAgo')}`;
}

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } = useNotifications();
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl relative transition-all active:scale-95"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-sm px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-12 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                        <div>
                            <h3 className="text-sm font-black text-slate-900">{t('notifications.title')}</h3>
                            {unreadCount > 0 && (
                                <p className="text-[10px] font-bold text-indigo-600 mt-0.5">
                                    {unreadCount} {t('notifications.unread')}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    title={t('notifications.markAllRead')}
                                >
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title={t('notifications.clearAll')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[380px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center">
                                    <Bell size={20} className="text-slate-700 dark:text-slate-300" />
                                </div>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('notifications.empty')}</p>
                                <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">{t('notifications.emptySub')}</p>
                            </div>
                        ) : (
                            notifications.slice(0, 15).map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => { if (!notif.read) markAsRead(notif.id); }}
                                    className={`px-4 py-3 border-b border-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-50/80 transition-all group ${!notif.read ? 'bg-indigo-50/30' : ''
                                        }`}
                                >
                                    <div className={`w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center ${typeBgColors[notif.type]}`}>
                                        {typeIcons[notif.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-xs leading-snug ${!notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                {notif.title}
                                            </p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:text-rose-400 transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">{notif.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-slate-700 dark:text-slate-300 font-medium">{timeAgo(notif.timestamp, t)}</span>
                                            {!notif.read && (
                                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 15 && (
                        <div className="px-4 py-2 border-t border-slate-100 text-center">
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                +{notifications.length - 15} {t('notifications.more')}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
