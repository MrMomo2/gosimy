export const dynamic = 'force-dynamic';

import { getAdminUser } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { TwoFactorSetup } from '@/components/admin/TwoFactorSetup';
import { redirect } from 'next/navigation';

export default async function TwoFactorSettingsPage() {
    const admin = await getAdminUser();
    
    if (!admin) {
        redirect('/en/auth/login?redirect=/admin/settings/2fa');
    }

    const supabase = createSupabaseAdminClient();
    const { data: adminUser } = await supabase
        .from('admin_users')
        .select('two_factor_enabled, two_factor_secret')
        .eq('email', admin.email)
        .single();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
                <p className="text-gray-600 mb-8">
                    Protect your admin account with an additional layer of security
                </p>
                
                <TwoFactorSetup 
                    enabled={adminUser?.two_factor_enabled ?? false}
                    secret={adminUser?.two_factor_secret ?? null}
                    email={admin.email ?? ''}
                />
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                <ol className="text-sm text-blue-700 space-y-2">
                    <li>1. Install an authenticator app (Google Authenticator, Authy, 1Password)</li>
                    <li>2. Scan the QR code or enter the manual code</li>
                    <li>3. Enter the 6-digit code from your app to verify</li>
                    <li>4. Save your backup codes in a secure location</li>
                </ol>
            </div>
        </div>
    );
}
