import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import DodoPayments from 'dodopayments';
import { getProvider } from '@/lib/providers';
import { withAdminAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const formData = await request.formData();
    const refundId = formData.get('refundId') as string;
  const amountCents = formData.get('amountCents') as string | null;
  const refundAmount = amountCents ? parseInt(amountCents, 10) : null;

    if (!isValidUUID(refundId)) {
      return NextResponse.json({ error: 'Invalid refund ID format' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: refundRequest } = await supabase
      .from('refund_requests')
      .select('*, orders!inner(payment_intent_id, payment_session_id, user_id)')
      .eq('id', refundId)
      .single();

    if (!refundRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    try {
      const paymentIntentId = refundRequest.orders.payment_intent_id;

      if (!paymentIntentId) {
        return NextResponse.json({ error: 'No payment intent found' }, { status: 400 });
      }

      const client = new DodoPayments({
        bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
        environment: process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') 
          ? 'test_mode' 
          : 'live_mode',
      });

      const refundData: { payment_id: string; amount?: number } = {
        payment_id: paymentIntentId,
      };

      if (refundAmount && refundAmount > 0 && refundAmount <= refundRequest.amount_cents) {
        refundData.amount = refundAmount;
      }

      const refund = await client.refunds.create(refundData);

      const { data: esims } = await supabase
        .from('esims')
        .select('id, provider, esim_tran_no, iccid')
        .eq('user_id', refundRequest.orders.user_id);

      for (const esim of esims ?? []) {
        try {
          const provider = getProvider(esim.provider);
          if (provider.cancelEsim && esim.esim_tran_no) {
            await provider.cancelEsim({ esimTranNo: esim.esim_tran_no });
          }
        } catch (cancelErr) {
          console.error(`[refund] Failed to cancel eSIM ${esim.id}:`, cancelErr);
        }
      }

      await supabase
        .from('refund_requests')
        .update({ 
          status: 'processed', 
          processed_at: new Date().toISOString(),
          payment_refund_id: refund.refund_id,
        })
        .eq('id', refundId);

      await supabase
        .from('orders')
        .update({ 
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', refundRequest.order_id);

      return NextResponse.redirect(new URL('/admin/refunds', request.url));
    } catch (err) {
      console.error('[refund-approve] Error:', err);
      return NextResponse.json({ 
        error: err instanceof Error ? err.message : 'Refund failed' 
      }, { status: 500 });
    }
  });
}
