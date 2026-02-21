export const dynamic = 'force-dynamic';

import { getAdminUser } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Shield, ShieldCheck, Key, ExternalLink, Save } from 'lucide-react';

export default async function SettingsPage() {
    const admin = await getAdminUser();
    const supabase = createSupabaseAdminClient();

    const { data: alertConfigs } = await supabase
        .from('alert_configs')
        .select('*')
        .order('name');

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Configure your admin account and system settings</p>
            </div>

            <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h2>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-4">
                        {admin?.twoFactorEnabled ? (
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-yellow-600" />
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">
                                {admin?.twoFactorEnabled 
                                    ? 'Your account is protected with 2FA'
                                    : 'Add an extra layer of security to your account'}
                            </p>
                        </div>
                    </div>
                    <a
                        href="/admin/settings/2fa"
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {admin?.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                    </a>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                            <Key className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">API Keys</p>
                            <p className="text-sm text-gray-500">Manage admin API keys for integrations</p>
                        </div>
                    </div>
                    <a
                        href="/admin/settings/api-keys"
                        className="px-4 py-2 border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Manage Keys
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
                
                <form action="/api/admin/settings/alerts" method="POST" className="space-y-4">
                    {(alertConfigs ?? []).map((config) => (
                        <div key={config.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-medium text-gray-900">{config.name}</p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name={`enabled_${config.id}`}
                                        defaultChecked={config.enabled}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Email Recipients (comma-separated)</label>
                                <input
                                    type="text"
                                    name={`emails_${config.id}`}
                                    defaultValue={config.email_recipients?.join(', ') || ''}
                                    placeholder="admin@example.com, alerts@example.com"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    ))}
                    
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Settings
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">External Links</h2>
                <div className="grid grid-cols-2 gap-4">
                    <a
                        href="https://dashboard.dodopayments.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div>
                            <p className="font-medium text-gray-900">Dodo Payments Dashboard</p>
                            <p className="text-sm text-gray-500">Manage payments and payouts</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                    </a>
                    <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div>
                            <p className="font-medium text-gray-900">Supabase Dashboard</p>
                            <p className="text-sm text-gray-500">Database and authentication</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                    </a>
                    <a
                        href="https://vercel.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div>
                            <p className="font-medium text-gray-900">Vercel Dashboard</p>
                            <p className="text-sm text-gray-500">Deployments and logs</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                    </a>
                    <a
                        href="https://sentry.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div>
                            <p className="font-medium text-gray-900">Sentry Dashboard</p>
                            <p className="text-sm text-gray-500">Error monitoring</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                    </a>
                </div>
            </div>
        </div>
    );
}
