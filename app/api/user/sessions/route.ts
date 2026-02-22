import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await supabase.auth.signOut();
        return NextResponse.json({ success: true, message: 'Signed out of all sessions' });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
    }
}
