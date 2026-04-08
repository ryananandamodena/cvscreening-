import React, { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle2, XCircle, ExternalLink, RefreshCw, Unlink,
    Clock, Users, Video, AlertCircle, Loader2, Settings
} from 'lucide-react';
import { googleCalendarService, CalendarIntegration, GoogleCalendarEvent } from '../services/calendar.service';
import { useLanguage } from '../contexts/LanguageContext';

const GoogleCalendarIntegration: React.FC = () => {
    const { t } = useLanguage();
    const [integration, setIntegration] = useState<CalendarIntegration>({ connected: false });
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[]>([]);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    useEffect(() => {
        checkConnection();
    }, []);

    useEffect(() => {
        // Handle OAuth callback
        const hash = window.location.hash;
        if (hash.includes('access_token') && hash.includes('google_calendar_auth')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            if (accessToken) {
                handleCallback(accessToken);
            }
        }
    }, []);

    const checkConnection = async () => {
        setLoading(true);
        try {
            const status = await googleCalendarService.checkConnection();
            setIntegration(status);

            if (status.connected) {
                const events = await googleCalendarService.getUpcomingEvents(5);
                setUpcomingEvents(events);
            }
        } catch (err) {
            console.error('Failed to check connection:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        setConnecting(true);
        const authUrl = googleCalendarService.getAuthUrl();
        window.location.href = authUrl;
    };

    const handleCallback = async (accessToken: string) => {
        try {
            const result = await googleCalendarService.handleCallback(accessToken);
            setIntegration(result);
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
        } catch (err) {
            console.error('Failed to connect:', err);
            alert('Failed to connect Google Calendar');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await googleCalendarService.disconnect();
            setIntegration({ connected: false });
            setUpcomingEvents([]);
            setShowDisconnectConfirm(false);
        } catch (err) {
            console.error('Failed to disconnect:', err);
            alert('Failed to disconnect Google Calendar');
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await googleCalendarService.syncInterviews();
            alert(`Synced ${result.synced} interviews with Google Calendar`);
            if (result.errors.length > 0) {
                console.warn('Sync errors:', result.errors);
            }
            // Refresh events
            const events = await googleCalendarService.getUpcomingEvents(5);
            setUpcomingEvents(events);
        } catch (err) {
            console.error('Failed to sync:', err);
            alert('Failed to sync with Google Calendar');
        } finally {
            setSyncing(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 size={32} className="text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-500">Checking Google Calendar connection...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Google Calendar</h1>
                    <p className="text-slate-500 mt-1">Sync interview schedules with Google Calendar</p>
                </div>
                <div className="flex items-center gap-2">
                    {integration.connected && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            Connected
                        </span>
                    )}
                </div>
            </div>

            {/* Connection Status Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {integration.connected ? (
                    <>
                        {/* Connected State */}
                        <div className="p-8">
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                                    <Calendar size={32} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">Google Calendar Connected</h2>
                                    <p className="text-slate-500 mb-4">
                                        Synced with <span className="font-medium text-slate-700">{integration.email}</span>
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSync}
                                            disabled={syncing}
                                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {syncing ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Syncing...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw size={16} />
                                                    Sync Now
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowDisconnectConfirm(true)}
                                            className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 flex items-center gap-2 transition-all"
                                        >
                                            <Unlink size={16} />
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="border-t border-slate-200 p-6 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">Features Enabled</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                        <Clock size={20} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Auto Schedule</p>
                                        <p className="text-xs text-slate-500">Interviews auto-added to calendar</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Video size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Google Meet</p>
                                        <p className="text-xs text-slate-500">Auto-create meeting links</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                        <Users size={20} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Invitations</p>
                                        <p className="text-xs text-slate-500">Email invites to participants</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Disconnected State */
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={40} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Connect Google Calendar</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            Sync your interview schedules with Google Calendar. Automatically create calendar events,
                            send invitations, and generate Google Meet links for video interviews.
                        </p>

                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg flex items-center gap-3 mx-auto transition-all disabled:opacity-50"
                        >
                            {connecting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <ExternalLink size={20} />
                                    Connect with Google
                                </>
                            )}
                        </button>

                        <p className="text-xs text-slate-400 mt-4">
                            We only request access to manage calendar events. Your data is secure.
                        </p>
                    </div>
                )}
            </div>

            {/* Upcoming Events */}
            {integration.connected && upcomingEvents.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Upcoming Interviews</h2>
                        <p className="text-sm text-slate-500">Next 5 scheduled interviews from Google Calendar</p>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="p-5 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-slate-900">{event.summary}</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {formatDate(event.start.dateTime)}
                                        </p>
                                        {event.attendees && event.attendees.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <Users size={14} className="text-slate-400" />
                                                <span className="text-xs text-slate-500">
                                                    {event.attendees.length} participant(s)
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {event.conferenceData?.entryPoints && (
                                        <a
                                            href={event.conferenceData.entryPoints[0]?.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 flex items-center gap-1.5"
                                        >
                                            <Video size={12} />
                                            Join Meet
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Disconnect Confirmation Modal */}
            {showDisconnectConfirm && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} className="text-red-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Disconnect Google Calendar?</h2>
                            <p className="text-slate-500 mb-8">
                                This will remove the connection to Google Calendar. Existing calendar events will not be deleted,
                                but new interviews will not be automatically synced.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDisconnectConfirm(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg transition-all"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleCalendarIntegration;
