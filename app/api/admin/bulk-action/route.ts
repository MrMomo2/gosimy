import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { requireAdminWith2FA } from '@/lib/auth/admin';
import { logAdminAction } from '@/lib/admin/audit';
import DodoPayments from 'dodopayments';

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await requireAdminWith2FA();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderIds, action } = await request.json();

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (action === 'retry') {
    const { fulfillOrder } = await import('@/lib/fulfillment/fulfill-order');
    
    let processed = 0;
    let errors = 0;

    for (const orderId of orderIds) {
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();

        if (order?.status === 'failed') {
          await supabase
            .from('orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', orderId);

          await supabase
            .from('order_items')
            .update({ fulfillment_status: 'pending', fulfillment_error: null })
            .eq('order_id', orderId);

          await fulfillOrder(orderId);
          processed++;
        }
      } catch (err) {
        console.error(`[bulk-retry] Failed for ${orderId}:`, err);
        errors++;
      }
    }

    await logAdminAction(
      supabase,
      admin.email ?? 'unknown',
      'bulk_retry_selected',
      'orders',
      `${orderIds.length} orders`,
      { processed, errors, orderIds },
    );

    return NextResponse.json({ processed, errors });
  }

  if (action === 'refund') {
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
      environment: process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') 
        ? 'test_mode' 
        : 'live_mode',
    });

    let processed = 0;
    let errors = 0;

    for (const orderId of orderIds) {
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('payment_intent_id, status, amount_total')
          .eq('id', orderId)
          .single();

        if (!order || order.status !== 'paid') continue;

        if (order.payment_intent_id) {
          await client.refunds.create({ payment_id: order.payment_intent_id });
        }

        await supabase
          .from('orders')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', orderId);

        processed++;
      } catch (err) {
        console.error(`[bulk-refund] Failed for ${orderId}:`, err);
        errors++;
      }
    }

    await logAdminAction(
      supabase,
      admin.email ?? 'unknown',
      'bulk_refund',
      'orders',
      `${orderIds.length} orders`,
      { processed, errors, orderIds },
    );

    return NextResponse.json({ processed, errors });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
