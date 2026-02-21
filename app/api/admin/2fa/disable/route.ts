import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/admin';
import { logAdminAction } from '@/lib/admin/audit';
// @ts-ignore
import { authenticator } from 'otplib';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { token } = await request.json();

        if (!token || token.length !== 6) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        const supabase = createSupabaseAdminClient();

        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('two_factor_secret, backup_codes')
            .eq('email', admin.email)
            .single();

        if (!adminUser?.two_factor_secret) {
            return NextResponse.json({ error: '2FA not configured' }, { status: 400 });
        }

        const isValidToken = authenticator.check(token, adminUser.two_factor_secret);
        const isValidBackup = (adminUser.backup_codes as string[])?.includes(token.toUpperCase());

        if (!isValidToken && !isValidBackup) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        await supabase
            .from('admin_users')
            .update({
                two_factor_enabled: false,
                two_factor_secret: null,
                backup_codes: null,
            })
            .eq('email', admin.email);

        await logAdminAction(
            supabase,
            admin.email || 'unknown',
            'disable_2fa',
            'admin',
            admin.id,
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[2fa-disable] Error:', err);
        return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }
}
