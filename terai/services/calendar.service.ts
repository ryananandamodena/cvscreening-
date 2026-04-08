// Google Calendar Integration Service
// This service handles OAuth2 authentication and Google Calendar API operations
//
// SECURITY NOTE: OAuth tokens are NEVER stored in localStorage or client-side storage.
// All tokens are sent to the backend via secure HTTPS calls and stored securely
// using httpOnly cookies or encrypted database storage. The frontend only maintains
// connection status via backend API calls.

import { apiService } from './api.service';

export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    }>;
    conferenceData?: {
        createRequest?: {
            requestId: string;
            conferenceSolutionKey: {
                type: string;
            };
        };
        entryPoints?: Array<{
            entryPointType: string;
            uri: string;
            label?: string;
        }>;
    };
    reminders?: {
        useDefault: boolean;
        overrides?: Array<{
            method: 'email' | 'popup';
            minutes: number;
        }>;
    };
}

export interface CalendarIntegration {
    connected: boolean;
    email?: string;
    calendarId?: string;
    lastSync?: string;
}

export interface InterviewScheduleData {
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    interviewType: string;
    startTime: Date;
    endTime: Date;
    interviewerEmails: string[];
    notes?: string;
    meetingLink?: boolean;
}

class GoogleCalendarService {
    private clientId: string;
    private redirectUri: string;
    private scopes: string[];
    // SECURITY: accessToken is only kept in memory temporarily during OAuth flow
    // It is NOT persisted to localStorage or any client-side storage
    private accessToken: string | null = null;

    constructor() {
        this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        this.redirectUri = `${window.location.origin}/integrations/google-calendar/callback`;
        this.scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email'
        ];
    }

    /**
     * Initialize the Google API client
     * SECURITY: Connection status is checked via backend API, not localStorage
     */
    async initialize(): Promise<boolean> {
        try {
            // Load Google API script
            if (!document.getElementById('google-api-script')) {
                await this.loadGoogleApiScript();
            }

            // SECURITY: Check connection status via backend API instead of localStorage
            // The backend securely stores and validates the OAuth token
            const connectionStatus = await this.checkConnection();
            return connectionStatus.connected;
        } catch (error) {
            console.error('Failed to initialize Google Calendar:', error);
            return false;
        }
    }

    /**
     * Load Google API script dynamically
     */
    private loadGoogleApiScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'google-api-script';
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google API'));
            document.head.appendChild(script);
        });
    }

    /**
     * Generate OAuth2 authorization URL
     */
    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'token',
            scope: this.scopes.join(' '),
            include_granted_scopes: 'true',
            state: 'google_calendar_auth',
            prompt: 'consent'
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Handle OAuth2 callback
     * SECURITY: Token is sent to backend for secure storage, NOT stored in localStorage
     */
    async handleCallback(accessToken: string): Promise<CalendarIntegration> {
        try {
            // Keep token in memory temporarily for user info fetch
            this.accessToken = accessToken;

            // Get user info using the temporary token
            const userInfo = await this.getUserInfo();

            // SECURITY: Send token to backend for secure storage
            // Backend will store it using httpOnly cookies or encrypted database storage
            // The frontend never persists the token to localStorage
            const response = await apiService.post<CalendarIntegration>('/integrations/google_calendar/auth', {
                accessToken,
                email: userInfo.email,
                calendarId: 'primary'
            });

            // Clear the in-memory token after sending to backend
            // Future operations will use the backend-stored token via API calls
            this.accessToken = null;

            return {
                connected: true,
                email: userInfo.email,
                calendarId: 'primary',
                lastSync: new Date().toISOString(),
                ...response
            };
        } catch (error) {
            // Clear the in-memory token on error
            this.accessToken = null;
            console.error('Failed to handle OAuth callback:', error);
            throw error;
        }
    }

    /**
     * Get user info from Google
     * Uses the temporary in-memory token during OAuth flow
     */
    private async getUserInfo(): Promise<{ email: string; name: string }> {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${this.accessToken}`);

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        return response.json();
    }

    /**
     * Check if Google Calendar is connected
     * SECURITY: Connection status is retrieved from backend, not from localStorage
     */
    async checkConnection(): Promise<CalendarIntegration> {
        try {
            const response = await apiService.get<CalendarIntegration>('/integrations/google_calendar');
            return response || { connected: false };
        } catch (error) {
            console.error('Failed to check Google Calendar connection:', error);
            return { connected: false };
        }
    }

    /**
     * Disconnect Google Calendar
     * SECURITY: Calls backend to clear the securely stored token
     */
    async disconnect(): Promise<void> {
        try {
            // Call backend to clear the stored token
            await apiService.post('/integrations/google_calendar/disconnect', {});
            // Clear any in-memory token
            this.accessToken = null;
        } catch (error) {
            console.error('Failed to disconnect Google Calendar:', error);
            throw error;
        }
    }

    /**
     * Create an interview event in Google Calendar
     */
    async createInterviewEvent(data: InterviewScheduleData): Promise<GoogleCalendarEvent> {
        try {
            const event: Omit<GoogleCalendarEvent, 'id'> = {
                summary: `Interview: ${data.candidateName} - ${data.jobTitle}`,
                description: `
Interview Details:
- Candidate: ${data.candidateName}
- Position: ${data.jobTitle}
- Type: ${data.interviewType}
${data.notes ? `\nNotes: ${data.notes}` : ''}
        `.trim(),
                start: {
                    dateTime: data.startTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                end: {
                    dateTime: data.endTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                attendees: [
                    { email: data.candidateEmail, displayName: data.candidateName },
                    ...data.interviewerEmails.map(email => ({ email }))
                ],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 60 },
                        { method: 'popup', minutes: 10 }
                    ]
                }
            };

            // Add Google Meet link if requested
            if (data.meetingLink) {
                event.conferenceData = {
                    createRequest: {
                        requestId: `interview-${Date.now()}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                };
            }

            const response = await apiService.post<GoogleCalendarEvent>('/integrations/google_calendar/events', event);
            return response;
        } catch (error) {
            console.error('Failed to create calendar event:', error);
            throw error;
        }
    }

    /**
     * Update an existing interview event
     */
    async updateInterviewEvent(eventId: string, data: Partial<InterviewScheduleData>): Promise<GoogleCalendarEvent> {
        try {
            const response = await apiService.put<GoogleCalendarEvent>(`/integrations/google_calendar/events/${eventId}`, data);
            return response;
        } catch (error) {
            console.error('Failed to update calendar event:', error);
            throw error;
        }
    }

    /**
     * Delete an interview event
     */
    async deleteInterviewEvent(eventId: string): Promise<void> {
        try {
            await apiService.delete(`/integrations/google_calendar/events/${eventId}`);
        } catch (error) {
            console.error('Failed to delete calendar event:', error);
            throw error;
        }
    }

    /**
     * Get upcoming events
     */
    async getUpcomingEvents(maxResults: number = 10): Promise<GoogleCalendarEvent[]> {
        try {
            const response = await apiService.get<{ items: GoogleCalendarEvent[] }>(
                `/integrations/google_calendar/events?maxResults=${maxResults}&timeMin=${new Date().toISOString()}`
            );
            return response?.items || [];
        } catch (error) {
            console.error('Failed to get upcoming events:', error);
            return [];
        }
    }

    /**
     * Sync interview schedules with Google Calendar
     */
    async syncInterviews(): Promise<{ synced: number; errors: string[] }> {
        try {
            const response = await apiService.post<{ synced: number; errors: string[] }>(
                '/integrations/google_calendar/sync', {}
            );
            return response || { synced: 0, errors: [] };
        } catch (error) {
            console.error('Failed to sync interviews:', error);
            throw error;
        }
    }

    /**
     * Check for scheduling conflicts
     */
    async checkConflicts(startTime: Date, endTime: Date): Promise<boolean> {
        try {
            const response = await apiService.get<{ hasConflicts: boolean }>(
                `/integrations/google_calendar/check-conflicts?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
            );
            return response?.hasConflicts || false;
        } catch (error) {
            console.error('Failed to check conflicts:', error);
            return false;
        }
    }

    /**
     * Get available time slots for a date range
     */
    async getAvailableSlots(
        startDate: Date,
        endDate: Date,
        durationMinutes: number = 60
    ): Promise<Date[]> {
        try {
            const response = await apiService.get<{ slots: Date[] }>(
                `/integrations/google_calendar/available-slots?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&durationMinutes=${durationMinutes}`
            );
            return response?.slots || [];
        } catch (error) {
            console.error('Failed to get available slots:', error);
            return [];
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
