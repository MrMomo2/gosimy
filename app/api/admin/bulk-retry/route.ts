import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { requireAdminWith2FA } from '@/lib/auth/admin';
import { fulfillOrder } from '@/lib/fulfillment/fulfill-order';
import { logAdminAction } from '@/lib/admin/audit';
import { NextResponse } from 'next/server';

export async function POST() {
    let admin;
    try {
        admin = await requireAdminWith2FA();
    } catch {
        return NextResponse.json({ error: 'Unauthorized: Admin access with 2FA required' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: failedOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'failed');

    if (!failedOrders || failedOrders.length === 0) {
        return NextResponse.json({ message: 'No failed orders', retried: 0 });
    }

    let retried = 0;
    let errors = 0;

    for (const order of failedOrders) {
        try {
            // Reset status to paid so fulfillOrder can process it
            await supabase
                .from('orders')
                .update({ status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', order.id);

            // Reset order items fulfillment status
            await supabase
                .from('order_items')
                .update({ fulfillment_status: 'pending', fulfillment_error: null })
                .eq('order_id', order.id);

            await fulfillOrder(order.id);
            retried++;
        } catch (err) {
            console.error(`[bulk-retry] Failed for ${order.id}:`, err);
            errors++;
        }
    }

    await logAdminAction(
        supabase,
        admin.email ?? 'unknown',
        'bulk_retry',
        'orders',
        `${failedOrders.length} orders`,
        { retried, errors, orderIds: failedOrders.map(o => o.id) },
    );

    return NextResponse.json({ retried, errors, total: failedOrders.length });
}
