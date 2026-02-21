import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import { logAdminAction } from '@/lib/admin/audit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    return withAdminAuth(request, async (admin) => {
        const supabase = createSupabaseAdminClient();
        const formData = await request.formData();

        const alertConfigs = await supabase
            .from('alert_configs')
            .select('id')
            .order('name');

        for (const config of alertConfigs.data || []) {
            const enabled = formData.get(`enabled_${config.id}`) === 'on';
            const emails = formData.get(`emails_${config.id}`) as string;

            await supabase
                .from('alert_configs')
                .update({
                    enabled,
                    email_recipients: emails 
                        ? emails.split(',').map(e => e.trim()).filter(Boolean)
                        : [],
                    updated_at: new Date().toISOString(),
                })
                .eq('id', config.id);
        }

        await logAdminAction(
            supabase,
            admin.email || 'unknown',
            'update_alert_settings',
            'alert_config',
            'all',
        );

        return NextResponse.redirect(new URL('/admin/settings', request.url));
    });
}
