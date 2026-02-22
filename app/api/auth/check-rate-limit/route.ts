import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const { email, ip_address } = await request.json();

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: attempts } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email.toLowerCase())
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

    const failedAttempts = attempts?.filter(a => !a.success) || [];
    const recentAttempt = attempts?.[0];

    return NextResponse.json({
        locked: failedAttempts.length >= 5,
        failedAttempts: failedAttempts.length,
        lastAttempt: recentAttempt?.created_at,
        remainingAttempts: Math.max(0, 5 - failedAttempts.length),
    });
}
