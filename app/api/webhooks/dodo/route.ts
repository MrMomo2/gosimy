import { after } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { fulfillOrder } from '@/lib/fulfillment/fulfill-order';
import { sendAdminAlert } from '@/lib/admin/alerts';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface DodoWebhookPayload {
    type?: string;
    event_type?: string;
    data?: {
        metadata?: {
            orderId?: string;
            locale?: string;
        };
        customer?: {
            email?: string;
        };
        payment_id?: string;
    };
    metadata?: {
        orderId?: string;
        locale?: string;
    };
    customer?: {
        email?: string;
    };
    payment_id?: string;
}

function verifyWebhookSignature(rawBody: string, signature: string | null): DodoWebhookPayload | null {
    if (!signature) {
        console.error('[dodo-webhook] Missing signature header');
        return null;
    }
    
    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (!secret) {
        console.warn('[dodo-webhook] DODO_WEBHOOK_SECRET not configured - skipping verification');
        try {
            return JSON.parse(rawBody) as DodoWebhookPayload;
        } catch {
            return null;
        }
    }
    
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
        
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const providedBuffer = Buffer.from(signature, 'hex');
        
        if (expectedBuffer.length !== providedBuffer.length) {
            console.error('[dodo-webhook] Signature length mismatch');
            return null;
        }
        
        if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
            console.error('[dodo-webhook] Invalid signature');
            return null;
        }
        
        return JSON.parse(rawBody) as DodoWebhookPayload;
    } catch (err) {
        console.error('[dodo-webhook] Signature verification failed:', err);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-dodo-signature') || 
                          req.headers.get('webhook-signature') ||
                          req.headers.get('dodo-signature');
        
        const payload = verifyWebhookSignature(rawBody, signature);
        if (!payload) {
            return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const type = payload.type || payload.event_type;

        console.log(`[dodo-webhook] Received event type: ${type}`);
        console.log('[dodo-webhook] Payload:', JSON.stringify(payload, null, 2));

        if (type === 'payment.succeeded') {
            const orderId = payload.data?.metadata?.orderId || payload.metadata?.orderId;
            const locale = payload.data?.metadata?.locale || payload.metadata?.locale || 'en';
            const customerEmail = payload.data?.customer?.email || payload.customer?.email;
            const paymentId = payload.data?.payment_id || payload.payment_id;

            if (!orderId) {
                console.error('[dodo-webhook] No orderId in payment metadata. Cannot fulfill order.');
                return new Response(JSON.stringify({ error: 'No orderId' }), { status: 400 });
            }

            const supabase = createSupabaseAdminClient();

            let invoiceUrl: string | null = null;
            if (paymentId) {
                try {
                    const { getPaymentInvoiceUrl } = await import('@/lib/payments/invoice');
                    invoiceUrl = await getPaymentInvoiceUrl(paymentId);
                } catch (err) {
                    console.error('[dodo-webhook] Failed to get invoice URL:', err);
                }
            }

            const { data: updatedRows } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_intent_id: paymentId || null,
                    payment_invoice_id: invoiceUrl,
                    guest_email: customerEmail || null,
                    locale,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId)
                .eq('status', 'pending')
                .select('id');

            if (!updatedRows || updatedRows.length === 0) {
                console.log(`[dodo-webhook] Duplicate or invalid event for order ${orderId}, skipping`);
                return new Response(JSON.stringify({ received: true, skip: true }), { status: 200 });
            }

            after(async () => {
                await fulfillOrder(orderId).catch(async (err) => {
                    console.error('[dodo-webhook] Fulfillment failed:', err);
                    await sendAdminAlert({
                        title: 'Webhook: Fulfillment Failed',
                        message: `Order ${orderId} failed during asynchronous fulfillment process.`,
                        level: 'critical',
                        data: { orderId, error: String(err) }
                    });
                });
            });
        }
        else if (type === 'payment.failed') {
            const orderId = payload.data?.metadata?.orderId || payload.metadata?.orderId;
            if (orderId) {
                const supabase = createSupabaseAdminClient();
                await supabase
                    .from('orders')
                    .update({ status: 'failed', updated_at: new Date().toISOString() })
                    .eq('id', orderId);
            }
        }
        else if (type === 'refund.succeeded') {
            const paymentId = payload.data?.payment_id || payload.payment_id;
            if (paymentId) {
                const supabase = createSupabaseAdminClient();
                await supabase
                    .from('orders')
                    .update({ status: 'refunded', updated_at: new Date().toISOString() })
                    .eq('payment_intent_id', paymentId);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[dodo-webhook] Error processing webhook:', err);
        await sendAdminAlert({
            title: 'Webhook Processing Error',
            message: `Failed to process Dodo webhook payload.`,
            level: 'warning',
            data: { error: errorMessage }
        });
        return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
    }
}
