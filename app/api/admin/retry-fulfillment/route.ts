import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { fulfillOrder } from '@/lib/fulfillment/fulfill-order';
import { withAdminAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;

    if (!isValidUUID(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!['failed', 'paid'].includes(order.status)) {
      return NextResponse.json({ error: `Cannot retry order with status: ${order.status}` }, { status: 400 });
    }

    const { error: deleteLogError } = await supabase
      .from('fulfillment_log')
      .delete()
      .eq('order_id', orderId);

    if (deleteLogError) {
      console.error('[retry-fulfillment] Failed to delete old fulfillment_log:', deleteLogError);
    }

    if (order.status === 'failed') {
      await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    fulfillOrder(orderId).catch((err) => {
      console.error(`[retry-fulfillment] Background fulfillment failed for ${orderId}:`, err);
    });

    return NextResponse.redirect(new URL('/admin/issues', request.url));
  });
}
