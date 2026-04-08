// WhatsApp Integration Service
// This service handles WhatsApp Business API integration for notifications

import { apiService } from './api.service';

export interface WhatsAppConfig {
    enabled: boolean;
    phoneNumberId?: string;
    businessAccountId?: string;
    accessToken?: string;
    webhookVerifyToken?: string;
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    language: string;
    category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    components: {
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
        text?: string;
        buttons?: Array<{
            type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
            text: string;
            url?: string;
            phoneNumber?: string;
        }>;
    }[];
}

export interface WhatsAppMessage {
    to: string;
    type: 'template' | 'text';
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: Array<{
            type: 'header' | 'body' | 'button';
            parameters: Array<{
                type: 'text' | 'image' | 'document';
                text?: string;
                image?: { link: string };
                document?: { link: string; filename: string };
            }>;
        }>;
    };
    text?: {
        body: string;
    };
}

export interface NotificationOptions {
    candidateName: string;
    candidatePhone: string;
    jobTitle?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewLink?: string;
    companyName?: string;
    additionalInfo?: string;
}

class WhatsAppService {
    private config: WhatsAppConfig | null = null;

    /**
     * Initialize WhatsApp configuration
     */
    async initialize(): Promise<WhatsAppConfig> {
        try {
            const response = await apiService.get<WhatsAppConfig>('/integrations/whatsapp');
            this.config = response;
            return response;
        } catch (error) {
            console.error('Failed to initialize WhatsApp:', error);
            return { enabled: false };
        }
    }

    /**
     * Check if WhatsApp is configured
     */
    isConfigured(): boolean {
        return this.config?.enabled === true;
    }

    /**
     * Send interview invitation via WhatsApp
     */
    async sendInterviewInvitation(options: NotificationOptions): Promise<{ success: boolean; messageId?: string }> {
        try {
            const response = await apiService.post<{ success: boolean; messageId?: string }>(
                '/integrations/whatsapp/send',
                {
                    to: options.candidatePhone,
                    template: 'interview_invitation',
                    message: `Hello ${options.candidateName}, you're invited to an interview for ${options.jobTitle} on ${options.interviewDate} at ${options.interviewTime}. Link: ${options.interviewLink}`
                }
            );
            return response;
        } catch (error) {
            console.error('Failed to send interview invitation:', error);
            throw error;
        }
    }

    /**
     * Send interview reminder via WhatsApp
     */
    async sendInterviewReminder(options: NotificationOptions): Promise<{ success: boolean; messageId?: string }> {
        try {
            const response = await apiService.post<{ success: boolean; messageId?: string }>(
                '/integrations/whatsapp/send',
                {
                    to: options.candidatePhone,
                    template: 'interview_reminder',
                    message: `Hi ${options.candidateName}, this is a reminder for your interview today at ${options.interviewTime}.`
                }
            );
            return response;
        } catch (error) {
            console.error('Failed to send interview reminder:', error);
            throw error;
        }
    }

    /**
     * Send application status update via WhatsApp
     */
    async sendApplicationStatusUpdate(
        phone: string,
        candidateName: string,
        status: string,
        jobTitle: string
    ): Promise<{ success: boolean; messageId?: string }> {
        try {
            const response = await apiService.post<{ success: boolean; messageId?: string }>(
                '/integrations/whatsapp/send',
                {
                    to: phone,
                    template: 'application_status',
                    message: `Hello ${candidateName}, your application for ${jobTitle} has been updated to: ${status}.`
                }
            );
            return response;
        } catch (error) {
            console.error('Failed to send status update:', error);
            throw error;
        }
    }

    /**
     * Send offer letter notification via WhatsApp
     */
    async sendOfferNotification(
        phone: string,
        candidateName: string,
        jobTitle: string,
        offerLink: string
    ): Promise<{ success: boolean; messageId?: string }> {
        try {
            const response = await apiService.post<{ success: boolean; messageId?: string }>(
                '/integrations/whatsapp/send',
                {
                    to: phone,
                    template: 'offer_notification',
                    message: `Congratulations ${candidateName}! You have received an offer for ${jobTitle}. View it here: ${offerLink}`
                }
            );
            return response;
        } catch (error) {
            console.error('Failed to send offer notification:', error);
            throw error;
        }
    }

    /**
     * Send assessment invitation via WhatsApp
     */
    async sendAssessmentInvitation(
        phone: string,
        candidateName: string,
        assessmentName: string,
        assessmentLink: string,
        deadline: string
    ): Promise<{ success: boolean; messageId?: string }> {
        try {
            const response = await apiService.post<{ success: boolean; messageId?: string }>(
                '/integrations/whatsapp/send',
                {
                    to: phone,
                    template: 'assessment_invitation',
                    message: `Hello ${candidateName}, you've been invited to take the ${assessmentName} assessment. Please complete it by ${deadline}. Link: ${assessmentLink}`
                }
            );
            return response;
        } catch (error) {
            console.error('Failed to send assessment invitation:', error);
            throw error;
        }
    }

    /**
     * Send custom message via WhatsApp
     */
    async sendCustomMessage(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
        try {
            const response = await apiService.post<{ success: boolean; messageId?: string }>(
                '/integrations/whatsapp/send',
                {
                    to: phone,
                    message
                }
            );
            return response;
        } catch (error) {
            console.error('Failed to send custom message:', error);
            throw error;
        }
    }

    /**
     * Get WhatsApp templates
     */
    async getTemplates(): Promise<WhatsAppTemplate[]> {
        try {
            const result = await apiService.get<{ templates: WhatsAppTemplate[] }>('/integrations/whatsapp/templates');
            return result?.templates || [];
        } catch (error) {
            console.error('Failed to get templates:', error);
            return [];
        }
    }

    /**
     * Configure WhatsApp integration
     */
    async configure(config: {
        phoneNumberId: string;
        businessAccountId: string;
        accessToken: string;
    }): Promise<{ success: boolean }> {
        try {
            const response = await apiService.post<{ success: boolean }>(
                '/integrations/whatsapp/config',
                config
            );
            return response;
        } catch (error) {
            console.error('Failed to configure WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Disconnect WhatsApp integration
     */
    async disconnect(): Promise<void> {
        try {
            await apiService.post('/integrations/whatsapp/disconnect', {});
            this.config = null;
        } catch (error) {
            console.error('Failed to disconnect WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Test WhatsApp connection
     */
    async testConnection(testPhone: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiService.post<{ success: boolean; message: string }>(
                '/integrations/whatsapp/test',
                { testPhone }
            );
            return response;
        } catch (error) {
            console.error('Failed to test WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Get message history
     */
    async getMessageHistory(limit: number = 50): Promise<Array<{
        id: string;
        to: string;
        type: string;
        status: string;
        timestamp: string;
    }>> {
        try {
            const response = await apiService.get<Array<{
                id: string;
                to: string;
                type: string;
                status: string;
                timestamp: string;
            }>>(`/integrations/whatsapp/messages?limit=${limit}`);
            return response || [];
        } catch (error) {
            console.error('Failed to get message history:', error);
            return [];
        }
    }

    /**
     * Format phone number for WhatsApp
     */
    formatPhoneNumber(phone: string): string {
        // Remove all non-numeric characters
        let cleaned = phone.replace(/\D/g, '');

        // Add country code if not present (assuming Indonesia +62)
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }

        return cleaned;
    }

    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phone: string): boolean {
        const formatted = this.formatPhoneNumber(phone);
        return formatted.length >= 10 && formatted.length <= 15;
    }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
