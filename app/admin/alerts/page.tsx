export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { ROLE_LABELS, type AdminRole } from '@/lib/admin/roles';
import Link from 'next/link';
import { Bell, Mail, Slack, ToggleLeft, ToggleRight, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AlertConfig {
    id: string;
    name: string;
    alert_type: string;
    enabled: boolean;
    channels: string[];
    threshold: number | null;
    email_recipients: string[] | null;
    slack_webhook: string | null;
    created_at: string;
    updated_at: string;
}

interface AlertHistoryEntry {
    id: string;
    alert_type: string;
    message: string;
    channels_sent: string[];
    success: boolean;
    error_message: string | null;
    created_at: string;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
    order_failed: 'Order Failed',
    high_volume: 'High Volume',
    low_balance: 'Low Provider Balance',
    refund_requested: 'Refund Requested',
    payment_failed: 'Payment Failed',
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
    email: Mail,
    slack: Slack,
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default async function AlertsPage() {
    const supabase = createSupabaseAdminClient();

    const [
        { data: alertConfigs },
        { data: alertHistory },
    ] = await Promise.all([
        supabase
            .from('alert_configs')
            .select('*')
            .order('created_at', { ascending: true }),
        supabase
            .from('alert_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
                    <p className="text-gray-600">Configure notifications for important events</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Alert Configuration</h2>
                    {(alertConfigs as AlertConfig[])?.map((config) => (
                        <div key={config.id} className="bg-white rounded-xl border p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <Bell className={`w-5 h-5 ${config.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{config.name}</h3>
                                        <p className="text-sm text-gray-500">{ALERT_TYPE_LABELS[config.alert_type] || config.alert_type}</p>
                                    </div>
                                </div>
                                <form action={`/api/admin/alerts/${config.id}/toggle`} method="POST">
                                    <button type="submit" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        {config.enabled ? (
                                            <ToggleRight className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                                        )}
                                    </button>
                                </form>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {config.channels.map((channel) => {
                                    const Icon = CHANNEL_ICONS[channel] || Mail;
                                    return (
                                        <span 
                                            key={channel}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600"
                                        >
                                            <Icon className="w-3 h-3" />
                                            {channel}
                                        </span>
                                    );
                                })}
                            </div>
                            {config.threshold && (
                                <p className="mt-3 text-sm text-gray-500">
                                    Threshold: {config.threshold}
                                </p>
                            )}
                            {config.email_recipients && config.email_recipients.length > 0 && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Recipients: {config.email_recipients.join(', ')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
                    <div className="bg-white rounded-xl border overflow-hidden">
                        {((alertHistory as AlertHistoryEntry[] | null) ?? []).length > 0 ? (
                            <div className="divide-y">
                                {(alertHistory as AlertHistoryEntry[]).map((entry) => (
                                    <div key={entry.id} className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {entry.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                                <span className="text-sm font-medium text-gray-900">
                                                    {ALERT_TYPE_LABELS[entry.alert_type] || entry.alert_type}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(entry.created_at)}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{entry.message}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            {entry.channels_sent.map((channel: string) => (
                                                <span 
                                                    key={channel}
                                                    className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500"
                                                >
                                                    {channel}
                                                </span>
                                            ))}
                                        </div>
                                        {entry.error_message && (
                                            <p className="mt-2 text-xs text-red-600">{entry.error_message}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No alerts sent yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
