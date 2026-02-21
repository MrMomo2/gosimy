import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { couponValidateSchema } from '@/lib/api/schemas';
import { checkIpRateLimit } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
             request.headers.get('x-real-ip') ??
             'unknown';

  const rateLimit = await checkIpRateLimit(ip, 'couponValidate');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', retryAfter: rateLimit.resetAt },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parseResult = couponValidateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
  }

  const { code, subtotalCents } = parseResult.data;

  const supabase = createSupabaseAdminClient();

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return NextResponse.json({ error: 'Coupon not yet valid' }, { status: 400 });
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
  }
  if (subtotalCents < coupon.min_order_cents) {
    return NextResponse.json({ 
      error: `Minimum order amount is $${(coupon.min_order_cents / 100).toFixed(2)}` 
    }, { status: 400 });
  }

  let discountCents: number;
  if (coupon.discount_type === 'percentage') {
    discountCents = Math.floor((subtotalCents * coupon.discount_value) / 100);
  } else {
    discountCents = Math.min(coupon.discount_value, subtotalCents);
  }

  return NextResponse.json({
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
    },
    discountCents,
    finalTotalCents: subtotalCents - discountCents,
  });
}
