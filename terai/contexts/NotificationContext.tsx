import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type NotificationType = 'screening_complete' | 'offer_created' | 'interview_scheduled' | 'assessment_created' | 'candidate_applied' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    timestamp: number; // unix milliseconds
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (type: NotificationType, title: string, message: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
}

const STORAGE_KEY = 'recruitai_notifications';
const MAX_NOTIFICATIONS = 50;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function loadFromStorage(): Notification[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToStorage(notifications: Notification[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    } catch {
        // storage full or unavailable
    }
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>(loadFromStorage);

    useEffect(() => {
        saveToStorage(notifications);
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        setNotifications(prev => [{
            id,
            type,
            title,
            message,
            read: false,
            timestamp: Date.now(),
        }, ...prev].slice(0, MAX_NOTIFICATIONS));
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, addNotification,
            markAsRead, markAllAsRead, clearAll, removeNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
