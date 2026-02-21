import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const formData = await request.formData();
    const refundId = formData.get('refundId') as string;

    if (!isValidUUID(refundId)) {
      return NextResponse.json({ error: 'Invalid refund ID format' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('refund_requests')
      .update({ 
        status: 'rejected', 
        processed_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/admin/refunds', request.url));
  });
}
