import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ iccid: string }> }
) {
  const { iccid } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the eSIM belongs to this user
  const { data: esim } = await supabase
    .from('esims')
    .select('id, provider')
    .eq('iccid', iccid)
    .eq('user_id', user.id)
    .single();

  if (!esim) {
    return NextResponse.json({ error: 'eSIM not found' }, { status: 404 });
  }

  try {
    const provider = getProvider(esim.provider);
    const status = await provider.queryEsim(iccid);

    const adminClient = createSupabaseAdminClient();
    await adminClient
      .from('esims')
      .update({
        data_used_bytes: Number(status.dataUsedBytes),
        data_total_bytes: Number(status.dataTotalBytes),
        smdp_status: status.smdpStatus,
        last_queried_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', esim.id);

    return NextResponse.json({
      iccid: status.iccid,
      smdpStatus: status.smdpStatus,
      dataUsedBytes: status.dataUsedBytes.toString(),
      dataTotalBytes: status.dataTotalBytes.toString(),
      expiresAt: status.expiresAt?.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
