import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdminAuth(request, async (admin) => {
        const { id } = await params;
        const supabase = createSupabaseAdminClient();

        const { data: config } = await supabase
            .from('alert_configs')
            .select('enabled')
            .eq('id', id)
            .single();

        if (!config) {
            return NextResponse.json({ error: 'Alert config not found' }, { status: 404 });
        }

        await supabase
            .from('alert_configs')
            .update({ 
                enabled: !config.enabled,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        await logAdminAction(
            supabase,
            admin.email || 'unknown',
            !config.enabled ? 'enable_alert' : 'disable_alert',
            'alert_config',
            id,
        );

        return NextResponse.redirect(new URL('/admin/alerts', request.url));
    });
}
