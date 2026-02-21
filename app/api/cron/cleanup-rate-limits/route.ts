import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    
    try {
        const { error } = await supabase.rpc('cleanup_old_rate_limits');
        
        if (error) {
            console.error('[cron] Rate limit cleanup failed:', error);
            return NextResponse.json({ 
                error: error.message,
                success: false 
            }, { status: 500 });
        }
        
        console.log('[cron] Rate limit cleanup completed successfully');
        return NextResponse.json({ 
            success: true,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[cron] Rate limit cleanup error:', err);
        return NextResponse.json({ 
            error: errorMessage,
            success: false 
        }, { status: 500 });
    }
}
