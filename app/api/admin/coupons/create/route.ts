import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import { couponCreateSchema } from '@/lib/api/schemas';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const formData = await request.formData();
    
    const rawData = {
      code: (formData.get('code') as string)?.toUpperCase(),
      description: formData.get('description') as string | null,
      discount_type: formData.get('discount_type') as 'percentage' | 'fixed',
      discount_value: parseInt(formData.get('discount_value') as string, 10),
      min_order_cents: Math.round(parseFloat(formData.get('min_order_cents') as string || '0') * 100),
      max_uses: formData.get('max_uses') ? parseInt(formData.get('max_uses') as string, 10) : null,
      valid_from: formData.get('valid_from') as string | null,
      valid_until: formData.get('valid_until') as string | null,
      is_active: formData.get('is_active') === 'on',
    };

    const parseResult = couponCreateSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ 
        error: parseResult.error.issues[0].message 
      }, { status: 400 });
    }

    const data = parseResult.data;

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('coupons')
      .insert({
        code: data.code,
        description: data.description,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_cents: data.min_order_cents,
        max_uses: data.max_uses,
        valid_from: data.valid_from || new Date().toISOString(),
        valid_until: data.valid_until,
        is_active: data.is_active,
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/admin/coupons', request.url));
  });
}
