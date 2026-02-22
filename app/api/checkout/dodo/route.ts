import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { checkoutSchema } from '@/lib/api/schemas';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_GUEST_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
    let body;
    try {
        body = await request.json();
    } catch (err) {
        console.error('[checkout-dodo] Invalid JSON body', err);
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = checkoutSchema.safeParse(body);
    if (!parseResult.success) {
        console.error('[checkout-dodo] Zod validation error:', parseResult.error.issues);
        return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { items, locale, couponId } = parseResult.data;

    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        'unknown';

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminClient = createSupabaseAdminClient();
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    if (process.env.NODE_ENV !== 'development') {
        if (user) {
            const { count } = await adminClient
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', windowStart);

            if (count !== null && count >= RATE_LIMIT_MAX) {
                return NextResponse.json(
                    { error: 'Too many checkout attempts. Please try again later.' },
                    { status: 429 }
                );
            }
        } else {
            if (ip !== 'unknown') {
                const { count } = await adminClient
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('ip_address', ip)
                    .gte('created_at', windowStart);

                if (count !== null && count >= RATE_LIMIT_GUEST_MAX) {
                    return NextResponse.json(
                        { error: 'Too many checkout attempts. Please try again later.' },
                        { status: 429 }
                    );
                }
            }
        }
    }

    let discountCents = 0;
    let couponData: { id: string; code: string; discount_type: string; discount_value: number } | null = null;

    if (couponId) {
        const { data: coupon } = await adminClient
            .from('coupons')
            .select('*')
            .eq('id', couponId)
            .eq('is_active', true)
            .maybeSingle();

        if (coupon) {
            couponData = coupon;
        }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // ── Server-side price validation ────────────────────────────────────────────
    const packageCodes = items.map((i) => i.packageCode);
    const { data: cachedPkgs } = await adminClient
        .from('packages_cache')
        .select('package_code, retail_price_cents')
        .in('package_code', packageCodes)
        .eq('is_active', true);

    const priceMap = new Map(
        cachedPkgs?.map((p) => [p.package_code, p.retail_price_cents as number]) ?? []
    );

    const validatedItems = items.map((item) => {
        const serverPrice = priceMap.get(item.packageCode);
        if (serverPrice == null) {
            return { ...item, unavailable: true };
        }
        return { ...item, retailPriceCents: serverPrice, unavailable: false };
    });

    const unavailable = validatedItems.filter((i) => i.unavailable);
    if (unavailable.length > 0) {
        console.error('[checkout-dodo] Unavailable items:', unavailable);
        return NextResponse.json(
            { error: `Package(s) no longer available: ${unavailable.map((i) => i.name).join(', ')}` },
            { status: 400 }
        );
    }

    const subtotalCents = validatedItems.reduce(
        (sum, item) => sum + item.retailPriceCents * item.quantity,
        0
    );

    if (couponData) {
        if (couponData.discount_type === 'percentage') {
            discountCents = Math.floor((subtotalCents * couponData.discount_value) / 100);
        } else {
            discountCents = Math.min(couponData.discount_value, subtotalCents);
        }
    }

    const totalCents = subtotalCents - discountCents;

    const { data: order, error: orderError } = await adminClient
        .from('orders')
        .insert({
            user_id: user?.id ?? null,
            payment_session_id: `pending_${crypto.randomUUID()}`,
            status: 'pending',
            currency: 'usd',
            amount_total: totalCents,
            ip_address: ip !== 'unknown' ? ip : null,
        })
        .select('id')
        .single();

    if (orderError || !order) {
        console.error('[checkout-dodo] Failed to create order:', orderError?.message);
        return NextResponse.json(
            { error: 'Failed to create order record' },
            { status: 500 }
        );
    }

    const orderId = order.id;

    if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PAYMENTS_PRODUCT_ID) {
        console.error('[checkout-dodo] Missing Dodo Payments environment variables');
        return NextResponse.json(
            { error: 'Payment gateway configuration error' },
            { status: 500 }
        );
    }

    const isTestMode = process.env.DODO_PAYMENTS_ENVIRONMENT === 'test' || 
        process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

    const client = new DodoPayments({
        bearerToken: process.env.DODO_PAYMENTS_API_KEY,
        environment: isTestMode ? 'test_mode' : 'live_mode',
    });

    try {
        const session = await client.checkoutSessions.create({
            product_cart: [{
                product_id: process.env.DODO_PAYMENTS_PRODUCT_ID,
                quantity: 1,
                amount: totalCents
            }],
            return_url: `${appUrl}/${locale}/checkout/success?session_id=dodo_${orderId}`,
            ...(user?.email && { customer: { email: user.email } }),
            metadata: {
                orderId,
                locale,
                couponId: couponId || '',
            }
        });

        await adminClient
            .from('orders')
            .update({ payment_session_id: session.session_id })
            .eq('id', orderId);

        const orderItems = validatedItems.flatMap((item) =>
            Array.from({ length: item.quantity }, () => ({
                order_id: orderId,
                provider: item.provider,
                package_code: item.packageCode,
                package_name: item.name,
                country_code: item.countryCode,
                quantity: 1,
                unit_price_cents: item.retailPriceCents,
                volume_bytes: item.volumeBytes,
                duration_days: item.durationDays,
                period_num: item.periodNum ?? null,
            }))
        );

        await adminClient.from('order_items').insert(orderItems);

        if (couponId) {
            await adminClient.from('order_coupons').insert({
                order_id: orderId,
                coupon_id: couponId,
                discount_cents: discountCents,
            });

            await adminClient.rpc('increment_coupon_usage', { coupon_id: couponId });
        }

        return NextResponse.json({ url: session.checkout_url });
    } catch (error) {
        console.error('[checkout-dodo] Dodo Checkout Error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session with the payment provider' },
            { status: 500 }
        );
    }
}
