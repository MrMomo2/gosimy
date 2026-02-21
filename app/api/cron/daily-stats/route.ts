import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    console.log('[Cron] Starting daily-stats job');
    
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            console.warn('[Cron] Unauthorized attempt');
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        const supabase = createSupabaseAdminClient();

        const today = new Date();
        const dates: string[] = [];
        
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        for (const date of dates) {
            const dayStart = new Date(date + 'T00:00:00Z').toISOString();
            const dayEnd = new Date(date + 'T23:59:59Z').toISOString();

            const [
                { data: orders },
                { count: newCustomers },
                { count: esimsActivated },
                { data: refunds },
                { count: failedOrders },
            ] = await Promise.all([
                supabase
                    .from('orders')
                    .select('amount_total')
                    .gte('created_at', dayStart)
                    .lte('created_at', dayEnd)
                    .in('status', ['paid', 'fulfilled', 'fulfilling']),
                supabase
                    .from('customers')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', dayStart)
                    .lte('created_at', dayEnd),
                supabase
                    .from('esims')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', dayStart)
                    .lte('created_at', dayEnd)
                    .eq('status', 'active'),
                supabase
                    .from('refund_requests')
                    .select('amount_cents')
                    .gte('processed_at', dayStart)
                    .lte('processed_at', dayEnd)
                    .eq('status', 'processed'),
                supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', dayStart)
                    .lte('created_at', dayEnd)
                    .eq('status', 'failed'),
            ]);

            const ordersRevenue = orders?.reduce((sum, o) => sum + (o.amount_total || 0), 0) ?? 0;
            const refundsAmount = refunds?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) ?? 0;

            await supabase
                .from('daily_stats')
                .upsert({
                    date,
                    orders_count: orders?.length ?? 0,
                    orders_revenue: ordersRevenue,
                    new_customers: newCustomers ?? 0,
                    esims_activated: esimsActivated ?? 0,
                    refunds_count: refunds?.length ?? 0,
                    refunds_amount: refundsAmount,
                    failed_orders: failedOrders ?? 0,
                    created_at: new Date().toISOString(),
                }, { onConflict: 'date' });
        }

        console.log('[Cron] Successfully updated daily stats for 30 days');
        return NextResponse.json({ success: true, daysUpdated: 30 });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[Cron] Daily stats failed:', errorMsg);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}
