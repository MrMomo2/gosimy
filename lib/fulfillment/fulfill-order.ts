import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';
import { sendEsimDeliveryEmail, type EsimDeliveryItem } from '@/lib/email/send';
import { EsimStillProcessingError } from '@/lib/providers/esim-access/client';
import type { CanonicalEsimStatus } from '@/lib/providers/types';
import { sendAdminAlert } from '@/lib/admin/alerts';

const POLL_DELAYS_MS = [
  500, 1000, 1500, 2000, 2000, 2000,
  3000, 3000, 3000, 5000, 5000,
  8000, 8000,
];

interface FulfillmentResult {
  success: boolean;
  fulfilledCount: number;
  failedCount: number;
  errors: Array<{ itemId: string; error: string }>;
}

export async function fulfillOrder(orderId: string): Promise<FulfillmentResult> {
  const supabase = createSupabaseAdminClient();
  const result: FulfillmentResult = {
    success: true,
    fulfilledCount: 0,
    failedCount: 0,
    errors: [],
  };

  const { data: lockAcquired, error: lockError } = await supabase.rpc('acquire_fulfillment_lock', {
    order_id: orderId
  });

  if (lockError) {
    console.warn(`[fulfillOrder] Lock RPC error (proceeding anyway):`, lockError.message);
  } else if (lockAcquired === false) {
    console.log(`[fulfillOrder] Another process is fulfilling ${orderId}, skipping`);
    return { success: true, fulfilledCount: 0, failedCount: 0, errors: [] };
  }

  const { data: existingSuccess } = await supabase
    .from('fulfillment_log')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'success')
    .maybeSingle();

  if (existingSuccess) {
    console.log(`[fulfillOrder] Already fulfilled ${orderId}, skipping`);
    return { success: true, fulfilledCount: 0, failedCount: 0, errors: [] };
  }

  const { data: logEntry } = await supabase
    .from('fulfillment_log')
    .insert({ order_id: orderId, status: 'started' })
    .select('id')
    .single();

  const logId = logEntry?.id;

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) throw new Error(`Order not found: ${orderId}`);

    if (order.status === 'fulfilled') {
      console.log(`[fulfillOrder] Order ${orderId} already fulfilled`);
      return { success: true, fulfilledCount: 0, failedCount: 0, errors: [] };
    }

    await supabase
      .from('orders')
      .update({ status: 'fulfilling', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    const esimResults: (EsimDeliveryItem & { esimId: string })[] = [];
    const orderItems = order.order_items as Array<{
      id: string;
      provider: string;
      package_code: string;
      package_name: string;
      country_code: string;
      quantity: number;
      unit_price_cents: number;
      volume_bytes: string;
      duration_days: number;
      fulfillment_status?: string;
      retry_count?: number;
    }>;

    // Check balance proactively
    if (orderItems.length > 0) {
      try {
        const providerName = orderItems[0].provider;
        const prov = getProvider(providerName) as any;
        if (typeof prov.getBalance === 'function') {
          const bal = await prov.getBalance();
          if (bal && bal.amount < 500000) { // < $50 (assuming amount is in 1/10000 dollars like esim_access)
            await sendAdminAlert({
              title: 'Low Provider Balance',
              message: `Provider ${providerName} balance is getting low: $${(bal.amount / 10000).toFixed(2)}. Please top up soon to avoid failed orders!`,
              level: 'warning'
            });
          }
        }
      } catch (e) {
        console.warn('[fulfillOrder] Could not check provider balance:', e);
      }
    }

    for (const item of orderItems) {
      if (item.fulfillment_status === 'fulfilled') {
        console.log(`[fulfillOrder] Item ${item.id} already fulfilled, skipping`);
        continue;
      }

      try {
        const provider = getProvider(item.provider);

        const { data: cachedPkg } = await supabase
          .from('packages_cache')
          .select('price_usd')
          .eq('package_code', item.package_code)
          .single();

        const costUsd = cachedPkg?.price_usd;
        if (costUsd == null) {
          throw new Error(
            `Package ${item.package_code} not found in packages_cache. ` +
            `Run 'node scripts/seed-packages.js' to populate the cache.`
          );
        }

        const orderResult = await provider.placeOrder(
          item.package_code,
          item.quantity,
          costUsd,
        );

        const { data: esim, error: esimError } = await supabase
          .from('esims')
          .insert({
            order_item_id: item.id,
            user_id: order.user_id,
            provider: item.provider,
            provider_order_no: orderResult.providerOrderNo,
            status: 'provisioning',
            data_total_bytes: item.volume_bytes ?? null,
          })
          .select('id')
          .single();

        if (esimError || !esim) {
          throw new Error(`Failed to create eSIM record: ${esimError?.message}`);
        }

        const esimStatus = await pollUntilReleased(provider, orderResult.providerOrderNo);

        await supabase
          .from('esims')
          .update({
            esim_tran_no: esimStatus.esimTranNo,
            iccid: esimStatus.iccid,
            qr_code_url: esimStatus.qrCodeUrl ?? null,
            activation_code: esimStatus.activationCode ?? null,
            smdp_status: esimStatus.smdpStatus ?? null,
            status: esimStatus.smdpStatus?.toUpperCase() === 'RELEASED' ? 'active' : 'provisioning',
            expires_at: esimStatus.expiresAt?.toISOString() ?? null,
            last_queried_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', esim.id);

        await supabase
          .from('order_items')
          .update({
            fulfillment_status: 'fulfilled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        esimResults.push({
          esimId: esim.id,
          iccid: esimStatus.iccid,
          qrCodeUrl: esimStatus.qrCodeUrl,
          activationCode: esimStatus.activationCode,
          packageName: item.package_name,
          countryCode: item.country_code,
          durationDays: item.duration_days,
          volumeBytes: String(item.volume_bytes ?? 0),
        });

        result.fulfilledCount++;
      } catch (itemError) {
        const errorMsg = itemError instanceof Error ? itemError.message : String(itemError);
        console.error(`[fulfillOrder] Item ${item.id} failed:`, errorMsg);

        await supabase
          .from('order_items')
          .update({
            fulfillment_status: 'failed',
            fulfillment_error: errorMsg,
            retry_count: (item.retry_count ?? 0) + 1,
          })
          .eq('id', item.id);

        result.failedCount++;
        result.errors.push({ itemId: item.id, error: errorMsg });
        result.success = false;
      }
    }

    if (esimResults.length > 0) {
      const recipientEmail = order.guest_email ?? (await getUserEmail(supabase, order.user_id));
      if (recipientEmail) {
        try {
          await sendEsimDeliveryEmail({
            to: recipientEmail,
            orderId,
            locale: order.locale ?? 'en',
            esims: esimResults,
          });
        } catch (emailError) {
          // Email failure must not block fulfillment — eSIMs are already provisioned.
          console.error(`[fulfillOrder] Email delivery failed for ${orderId}:`, emailError);
        }
      }
    }

    const newStatus = result.fulfilledCount === orderItems.length
      ? 'fulfilled'
      : result.fulfilledCount > 0
        ? 'partially_fulfilled'
        : 'failed';

    await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (logId) {
      await supabase
        .from('fulfillment_log')
        .update({
          status: result.success ? 'success' : 'failed',
          error_message: result.success ? null : `${result.failedCount} items failed`,
        })
        .eq('id', logId);
    }

    if (newStatus === 'failed' || newStatus === 'partially_fulfilled') {
      await sendAdminAlert({
        title: `Order ${newStatus.replace('_', ' ').toUpperCase()}`,
        message: `Order ${orderId} could not be successfully fulfilled. ${result.failedCount} items failed.`,
        level: 'critical',
        data: { orderId, errors: result.errors }
      });
    }

    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[fulfillOrder] Failed for ${orderId}:`, msg);

    await supabase
      .from('orders')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (logId) {
      await supabase
        .from('fulfillment_log')
        .update({ status: 'failed', error_message: msg })
        .eq('id', logId);
    }

    await sendAdminAlert({
      title: 'Fulfillment Crashed',
      message: `Fatal error fulfilling order ${orderId}: ${msg}`,
      level: 'critical',
      data: { orderId, error: msg }
    });

    result.success = false;
    result.errors.push({ itemId: 'order', error: msg });
    return result;
  }
}

// ─── Polling helper ────────────────────────────────────────────────────────────
async function pollUntilReleased(
  provider: ReturnType<typeof getProvider>,
  providerOrderNo: string,
): Promise<CanonicalEsimStatus> {
  let lastStatus: CanonicalEsimStatus | undefined;

  for (let attempt = 0; attempt < POLL_DELAYS_MS.length; attempt++) {
    await sleep(POLL_DELAYS_MS[attempt]);

    try {
      const status = await provider.queryEsim(providerOrderNo);
      lastStatus = status;

      const upper = status.smdpStatus?.toUpperCase() ?? '';
      if (upper === 'RELEASED') return status;
      if (upper === 'FAILED' || upper === 'CANCELLED') {
        throw new Error(`eSIM provisioning failed with status: ${status.smdpStatus}`);
      }
    } catch (err) {
      if (err instanceof EsimStillProcessingError) {
        continue;
      }
      console.warn(`[poll] attempt ${attempt + 1}/${POLL_DELAYS_MS.length} failed:`, err);
    }
  }

  if (lastStatus) return lastStatus;

  throw new Error(`eSIM provisioning timed out for order ${providerOrderNo}`);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function getUserEmail(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
