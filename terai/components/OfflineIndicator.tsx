import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const OfflineIndicator: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const toastContext = useToast();
    const addToast = toastContext?.addToast;

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            addToast?.('success', 'Back online');
        };

        const handleOffline = () => {
            setIsOffline(true);
            addToast?.('warning', 'No internet connection');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [addToast]);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[9999] bg-slate-900/90 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <WifiOff size={20} className="text-rose-400" />
            <span className="font-bold text-sm">You are currently offline</span>
        </div>
    );
};
