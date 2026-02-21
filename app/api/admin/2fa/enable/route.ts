import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/admin';
import { logAdminAction } from '@/lib/admin/audit';
// @ts-ignore
import { authenticator } from 'otplib';
import crypto from 'crypto';

export const runtime = 'nodejs';

function generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
}

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
            .select('two_factor_secret')
            .eq('email', admin.email)
            .single();

        if (!adminUser?.two_factor_secret) {
            return NextResponse.json({ error: '2FA not set up. Run setup first.' }, { status: 400 });
        }

        const isValid = authenticator.check(token, adminUser.two_factor_secret);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        const backupCodes = generateBackupCodes();

        await supabase
            .from('admin_users')
            .update({
                two_factor_enabled: true,
                backup_codes: backupCodes,
            })
            .eq('email', admin.email);

        await logAdminAction(
            supabase,
            admin.email || 'unknown',
            'enable_2fa',
            'admin',
            admin.id,
        );

        return NextResponse.json({
            success: true,
            backupCodes,
        });
    } catch (err) {
        console.error('[2fa-enable] Error:', err);
        return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
    }
}
