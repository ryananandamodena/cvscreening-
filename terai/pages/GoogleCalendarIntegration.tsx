import React, { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle2, XCircle, ExternalLink, RefreshCw, Unlink,
    Clock, Users, Video, AlertCircle, Loader2, Settings
} from 'lucide-react';
import { googleCalendarService, CalendarIntegration, GoogleCalendarEvent } from '../services/calendar.service';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

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
                <Loader2 size={32} className="text-brand-600 animate-spin" />
                <p className="text-sm text-slate-700 dark:text-slate-300">Checking Google Calendar connection...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Google Calendar</h1>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">Sync interview schedules with Google Calendar</p>
                </div>
                <div className="flex items-center gap-2">
                    {integration.connected && (
                        <Badge tone="success">
                            <CheckCircle2 size={14} />
                            Connected
                        </Badge>
                    )}
                </div>
            </div>

            {/* Connection Status Card */}
            <div className="card rounded-3xl overflow-hidden">
                {integration.connected ? (
                    <>
                        {/* Connected State */}
                        <div className="p-8">
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                    <Calendar size={32} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Google Calendar Connected</h2>
                                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                                        Synced with <span className="font-medium text-slate-700 dark:text-slate-300">{integration.email}</span>
                                    </p>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            onClick={handleSync}
                                            disabled={syncing}
                                            loading={syncing}
                                            icon={<RefreshCw size={16} />}
                                        >
                                            {syncing ? 'Syncing...' : 'Sync Now'}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="!bg-danger-50 dark:!bg-danger-500/10 !text-danger-600 dark:!text-danger-500 !shadow-none hover:!bg-danger-100 dark:hover:!bg-danger-500/20"
                                            onClick={() => setShowDisconnectConfirm(true)}
                                            icon={<Unlink size={16} />}
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="border-t border-slate-200 dark:border-neutral-800 p-6 bg-slate-50 dark:bg-neutral-800/50">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Features Enabled</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700">
                                    <div className="w-10 h-10 bg-success-50 dark:bg-success-500/10 rounded-lg flex items-center justify-center">
                                        <Clock size={20} className="text-success-700 dark:text-success-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Auto Schedule</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300">Interviews auto-added to calendar</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <Video size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Google Meet</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300">Auto-create meeting links</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700">
                                    <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/40 rounded-lg flex items-center justify-center">
                                        <Users size={20} className="text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Invitations</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300">Email invites to participants</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Disconnected State */
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={40} className="text-slate-600 dark:text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connect Google Calendar</h2>
                        <p className="text-slate-700 dark:text-slate-300 max-w-md mx-auto mb-8">
                            Sync your interview schedules with Google Calendar. Automatically create calendar events,
                            send invitations, and generate Google Meet links for video interviews.
                        </p>

                        <Button
                            variant="primary"
                            size="lg"
                            className="!bg-blue-600 hover:!bg-blue-700 mx-auto"
                            onClick={handleConnect}
                            disabled={connecting}
                            loading={connecting}
                            icon={<ExternalLink size={20} />}
                        >
                            {connecting ? 'Connecting...' : 'Connect with Google'}
                        </Button>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-4">
                            We only request access to manage calendar events. Your data is secure.
                        </p>
                    </div>
                )}
            </div>

            {/* Upcoming Events */}
            {integration.connected && upcomingEvents.length > 0 && (
                <div className="card rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-neutral-800">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Interviews</h2>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Next 5 scheduled interviews from Google Calendar</p>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="p-5 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">{event.summary}</h3>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                            {formatDate(event.start.dateTime)}
                                        </p>
                                        {event.attendees && event.attendees.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <Users size={14} className="text-slate-600 dark:text-slate-400" />
                                                <span className="text-xs text-slate-700 dark:text-slate-300">
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
                                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 flex items-center gap-1.5"
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
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-danger-50 dark:bg-danger-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} className="text-danger-600 dark:text-danger-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Disconnect Google Calendar?</h2>
                            <p className="text-slate-700 dark:text-slate-300 mb-8">
                                This will remove the connection to Google Calendar. Existing calendar events will not be deleted,
                                but new interviews will not be automatically synced.
                            </p>

                            <div className="flex gap-4">
                                <Button variant="secondary" size="lg" className="flex-1" onClick={() => setShowDisconnectConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button variant="danger" size="lg" className="flex-1" onClick={handleDisconnect}>
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleCalendarIntegration;
