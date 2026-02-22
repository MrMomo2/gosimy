import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendAdminAlert } from '@/lib/admin/alerts';
import type { EsimAccessWebhookEvent } from '@/lib/providers/esim-access/types';

export const runtime = 'nodejs';

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    // Buffer lengths differ → signature is invalid
    return false;
  }
}

function generateEventId(event: EsimAccessWebhookEvent): string {
  switch (event.notifyType) {
    case 'ORDER_STATUS':
      return `order_${event.obj.orderNo}_${event.obj.orderStatus}`;
    case 'ESIM_STATUS':
      return `esim_${event.obj.iccid}_${event.obj.esimStatus}`;
    case 'DATA_USAGE':
      return `data_${event.obj.iccid}_${event.obj.orderUsage}`;
    default:
      return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();

  const secret = process.env.ESIM_ACCESS_SECRET_KEY;
  if (!secret) {
    console.error('[esim-access webhook] ESIM_ACCESS_SECRET_KEY is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const sig = req.headers.get('RT-Signature') ?? '';
  if (!verifySignature(rawBody, sig, secret)) {
    console.warn('[esim-access webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: EsimAccessWebhookEvent;
  try {
    event = JSON.parse(rawBody) as EsimAccessWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const eventId = generateEventId(event);

  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'esim_access')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    console.log(`[esim-access webhook] Duplicate event ${eventId}, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.notifyType) {
      case 'ORDER_STATUS': {
        const { orderNo, orderStatus } = event.obj;
        console.log(`[esim-access webhook] ORDER_STATUS orderNo=${orderNo} status=${orderStatus}`);

        const status = orderStatus === 'SUCCESS' ? 'active'
          : orderStatus === 'FAILED' ? 'failed'
          : 'provisioning';

        await supabase
          .from('esims')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('provider_order_no', orderNo);

        break;
      }

      case 'ESIM_STATUS': {
        const { iccid, esimStatus } = event.obj;
        console.log(`[esim-access webhook] ESIM_STATUS iccid=${iccid} status=${esimStatus}`);

        const status = esimStatus === 'ENABLED' ? 'active'
          : esimStatus === 'EXPIRED' ? 'expired'
          : esimStatus === 'DELETED' ? 'cancelled'
          : undefined;

        if (status) {
          await supabase
            .from('esims')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('iccid', iccid);
        }

        break;
      }

      case 'DATA_USAGE': {
        const { iccid, totalVolume, orderUsage } = event.obj;
        console.log(`[esim-access webhook] DATA_USAGE iccid=${iccid} used=${orderUsage}/${totalVolume}`);

        const exhausted = orderUsage >= totalVolume && totalVolume > 0;

        const usageUpdate: Record<string, unknown> = {
          data_used_bytes: orderUsage,
          data_total_bytes: totalVolume,
          last_queried_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (exhausted) usageUpdate.status = 'exhausted';

        await supabase
          .from('esims')
          .update(usageUpdate)
          .eq('iccid', iccid);

        break;
      }

      case 'VALIDITY_USAGE': {
        const { iccid, expiredTime, remainingHours } = event.obj;
        console.log(`[esim-access webhook] VALIDITY_USAGE iccid=${iccid} expires=${expiredTime} remainingHours=${remainingHours}`);

        // Mark eSIM as expiring soon (user should be notified via email/SMS)
        await supabase
          .from('esims')
          .update({
            expires_at: new Date(expiredTime).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('iccid', iccid);

        // Optionally send admin alert for monitoring
        if (remainingHours <= 24) {
          await sendAdminAlert({
            title: 'eSIM Expiring Soon',
            message: `eSIM ${iccid} expires in ${remainingHours} hours (${new Date(expiredTime).toLocaleString()})`,
            level: 'warning',
          });
        }

        break;
      }

      default:
        console.warn('[esim-access webhook] Unknown notifyType:', (event as { notifyType: string }).notifyType);
    }

    await supabase
      .from('webhook_events')
      .insert({
        provider: 'esim_access',
        event_id: eventId,
        event_type: event.notifyType,
      });

  } catch (err) {
    console.error('[esim-access webhook] Error processing event:', err);
  }

  return NextResponse.json({ received: true });
}
