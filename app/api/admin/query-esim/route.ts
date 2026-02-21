import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';
import { withAdminAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const formData = await request.formData();
    const esimId = formData.get('esimId') as string;
    const iccid = formData.get('iccid') as string | null;
    const providerOrderNo = formData.get('providerOrderNo') as string | null;

    if (!isValidUUID(esimId)) {
      return NextResponse.json({ error: 'Invalid eSIM ID format' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: esim } = await supabase
      .from('esims')
      .select('provider, provider_order_no, iccid, esim_tran_no')
      .eq('id', esimId)
      .single();

    if (!esim) {
      return NextResponse.json({ error: 'eSIM not found' }, { status: 404 });
    }

    try {
      const provider = getProvider(esim.provider);
      const identifier = providerOrderNo ?? esim.provider_order_no ?? iccid ?? esim.iccid;

      if (!identifier) {
        return NextResponse.json({ error: 'No identifier to query' }, { status: 400 });
      }

      const status = await provider.queryEsim(identifier);

      await supabase
        .from('esims')
        .update({
          smdp_status: status.smdpStatus,
          status: status.smdpStatus?.toUpperCase() === 'RELEASED' ? 'active' : 
                  status.smdpStatus?.toUpperCase() === 'FAILED' ? 'failed' : 'provisioning',
          data_used_bytes: status.dataUsedBytes.toString(),
          data_total_bytes: status.dataTotalBytes.toString(),
          expires_at: status.expiresAt?.toISOString() ?? null,
          last_queried_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', esimId);

      return NextResponse.redirect(new URL('/admin/esims', request.url));
    } catch (err) {
      console.error('[query-esim] Error:', err);
      return NextResponse.json({ 
        error: 'Failed to query eSIM status' 
      }, { status: 500 });
    }
  });
}
