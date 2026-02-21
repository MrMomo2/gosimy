import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid coupon ID format' }, { status: 400 });
    }

    const formData = await request.formData();
    
    const code = (formData.get('code') as string)?.toUpperCase();
    const description = formData.get('description') as string | null;
    const discountType = formData.get('discount_type') as 'percentage' | 'fixed';
    const discountValue = parseInt(formData.get('discount_value') as string, 10);
    const minOrderCents = Math.round(parseFloat(formData.get('min_order_cents') as string) * 100);
    const maxUses = formData.get('max_uses') ? parseInt(formData.get('max_uses') as string, 10) : null;
    const validFrom = formData.get('valid_from') as string | null;
    const validUntil = formData.get('valid_until') as string | null;
    const isActive = formData.get('is_active') === 'on';

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('coupons')
      .update({
        code,
        description,
        discount_type: discountType,
        discount_value: discountValue,
        min_order_cents: minOrderCents,
        max_uses: maxUses,
        valid_from: validFrom || new Date().toISOString(),
        valid_until: validUntil || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/admin/coupons', request.url));
  });
}
