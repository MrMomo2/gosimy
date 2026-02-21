import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/admin';
// @ts-ignore
// @ts-ignore
const { authenticator } = require('otplib');
import QRCode from 'qrcode';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = authenticator.generateSecret();
    const service = 'Gosimy Admin';
    const otpauth = authenticator.keyuri(admin.email || 'admin', service, secret);

    try {
        const qrCode = await QRCode.toDataURL(otpauth);

        const supabase = createSupabaseAdminClient();
        await supabase
            .from('admin_users')
            .update({ two_factor_secret: secret })
            .eq('email', admin.email);

        return NextResponse.json({
            qrCode,
            manualCode: secret
        });
    } catch (err) {
        console.error('[2fa-setup] Error:', err);
        return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
    }
}
