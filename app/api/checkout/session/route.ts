import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, amount_total, currency')
    .eq('payment_session_id', sessionId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('package_code, package_name, unit_price_cents, quantity')
    .eq('order_id', order.id);

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount_total,
    currency: order.currency,
    items: items?.map((item) => ({
      packageCode: item.package_code,
      name: item.package_name,
      price: item.unit_price_cents,
      quantity: item.quantity,
    })),
  });
}
