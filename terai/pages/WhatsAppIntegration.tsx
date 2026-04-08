import React, { useState, useEffect } from 'react';
import {
    MessageCircle, CheckCircle2, XCircle, Send, Settings, History,
    AlertCircle, Loader2, Phone, TestTube, Unlink, Clock, Users
} from 'lucide-react';
import { whatsappService, WhatsAppConfig, WhatsAppTemplate } from '../services/whatsapp.service';
import { useLanguage } from '../contexts/LanguageContext';

const WhatsAppIntegration: React.FC = () => {
    const { t } = useLanguage();
    const [config, setConfig] = useState<WhatsAppConfig>({ enabled: false });
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        phoneNumberId: '',
        businessAccountId: '',
        accessToken: ''
    });
    const [testPhone, setTestPhone] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const configData = await whatsappService.initialize();
            setConfig(configData);

            if (configData.enabled) {
                const templateData = await whatsappService.getTemplates();
                setTemplates(templateData);
            }
        } catch (err) {
            console.error('Failed to load config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigure = async () => {
        setSaving(true);
        try {
            await whatsappService.configure(formData);
            setShowConfigModal(false);
            await loadConfig();
        } catch (err) {
            console.error('Failed to configure:', err);
            alert('Failed to configure WhatsApp. Please check your credentials.');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testPhone) {
            alert('Please enter a test phone number');
            return;
        }

        setTesting(true);
        try {
            const result = await whatsappService.testConnection(testPhone);
            if (result.success) {
                alert('Test message sent successfully!');
            } else {
                alert(`Test failed: ${result.message}`);
            }
        } catch (err) {
            console.error('Test failed:', err);
            alert('Failed to send test message');
        } finally {
            setTesting(false);
            setShowTestModal(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await whatsappService.disconnect();
            setConfig({ enabled: false });
            setShowDisconnectConfirm(false);
        } catch (err) {
            console.error('Failed to disconnect:', err);
            alert('Failed to disconnect WhatsApp');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 size={32} className="text-green-600 animate-spin" />
                <p className="text-sm text-slate-500">Loading WhatsApp configuration...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-8 animate-in fade-in duration-500 w-full pt-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">WhatsApp Integration</h1>
                    <p className="text-slate-500 mt-2">Send notifications to candidates via WhatsApp</p>
                </div>
                <div className="flex items-center gap-2">
                    {config.enabled && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            Connected
                        </span>
                    )}
                </div>
            </div>

            {/* Connection Status Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {config.enabled ? (
                    <>
                        {/* Connected State */}
                        <div className="p-8">
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                                    <MessageCircle size={32} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">WhatsApp Business Connected</h2>
                                    <p className="text-slate-500 mb-4">
                                        Phone Number ID: <span className="font-medium text-slate-700">{config.phoneNumberId}</span>
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowTestModal(true)}
                                            className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center gap-2 transition-all"
                                        >
                                            <TestTube size={16} />
                                            Send Test
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
                            <h3 className="text-sm font-bold text-slate-900 mb-4">Notification Types</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Clock size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Interview Reminders</p>
                                        <p className="text-xs text-slate-500">Auto-remind candidates</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                        <Send size={20} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Status Updates</p>
                                        <p className="text-xs text-slate-500">Application progress</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                        <Users size={20} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Assessment Invites</p>
                                        <p className="text-xs text-slate-500">Test invitations</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Disconnected State */
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageCircle size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Connect WhatsApp Business</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            Send automated notifications to candidates via WhatsApp. Connect your WhatsApp Business API
                            to enable interview reminders, status updates, and more.
                        </p>

                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="px-8 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-lg flex items-center gap-3 mx-auto transition-all"
                        >
                            <Settings size={20} />
                            Configure WhatsApp
                        </button>

                        <p className="text-xs text-slate-400 mt-4">
                            You'll need your WhatsApp Business Phone Number ID and Access Token.
                        </p>
                    </div>
                )}
            </div>

            {/* Templates */}
            {config.enabled && templates.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Message Templates</h2>
                        <p className="text-sm text-slate-500">Approved WhatsApp message templates</p>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {templates.map((template) => (
                            <div key={template.id} className="p-5 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-slate-900">{template.name}</h3>
                                        <p className="text-sm text-slate-500">{template.language} • {template.category}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${template.status === 'APPROVED'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : template.status === 'PENDING'
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}>
                                        {template.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Configuration Modal */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Configure WhatsApp</h2>
                            <p className="text-slate-500 text-sm mb-8">Enter your WhatsApp Business API credentials</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number ID</label>
                                    <input
                                        type="text"
                                        value={formData.phoneNumberId}
                                        onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-green-500"
                                        placeholder="Enter Phone Number ID"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Account ID</label>
                                    <input
                                        type="text"
                                        value={formData.businessAccountId}
                                        onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-green-500"
                                        placeholder="Enter Business Account ID"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Access Token</label>
                                    <input
                                        type="password"
                                        value={formData.accessToken}
                                        onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-green-500"
                                        placeholder="Enter Access Token"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowConfigModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfigure}
                                    disabled={saving || !formData.phoneNumberId || !formData.accessToken}
                                    className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-lg transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Modal */}
            {showTestModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Send Test Message</h2>
                            <p className="text-slate-500 text-sm mb-8">Enter a phone number to receive a test message</p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-green-500"
                                        placeholder="62812345678"
                                    />
                                </div>
                                <p className="text-xs text-slate-400">Include country code (e.g., 62 for Indonesia)</p>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowTestModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTest}
                                    disabled={testing || !testPhone}
                                    className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-lg transition-all disabled:opacity-50"
                                >
                                    {testing ? 'Sending...' : 'Send Test'}
                                </button>
                            </div>
                        </div>
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
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Disconnect WhatsApp?</h2>
                            <p className="text-slate-500 mb-8">
                                This will remove the WhatsApp integration. You won't be able to send notifications
                                until you reconnect.
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

export default WhatsAppIntegration;
