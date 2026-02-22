// POST /api/esim/topup
// Adds a data package to an existing eSIM.
// Should be called after a successful Dodo Payments payment for a topup package.
//
// Body: { iccid: string, packageCode: string }
// Auth: Supabase session (user must own the eSIM)

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { iccid?: string; packageCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { iccid, packageCode } = body;

  if (!iccid || !packageCode) {
    return NextResponse.json(
      { error: 'iccid and packageCode are required' },
      { status: 400 }
    );
  }

  const adminClient = createSupabaseAdminClient();

  // Verify the eSIM belongs to this user
  const { data: esim } = await adminClient
    .from('esims')
    .select('id, provider, esim_tran_no, status')
    .eq('iccid', iccid)
    .eq('user_id', user.id)
    .single();

  if (!esim) {
    return NextResponse.json({ error: 'eSIM not found' }, { status: 404 });
  }

  if (['cancelled', 'expired'].includes(esim.status)) {
    return NextResponse.json(
      { error: `Cannot top up an eSIM with status: ${esim.status}` },
      { status: 422 }
    );
  }

  // Look up wholesale cost from packages_cache
  const { data: pkg } = await adminClient
    .from('packages_cache')
    .select('price_usd, retail_price_cents, name, duration_days, volume_bytes')
    .eq('package_code', packageCode)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  const provider = getProvider(esim.provider);

  if (!provider.topupEsim) {
    return NextResponse.json(
      { error: 'Provider does not support topup' },
      { status: 501 }
    );
  }

  try {
    const result = await provider.topupEsim({
      esimTranNo: esim.esim_tran_no ?? undefined,
      iccid,
      packageCode,
      priceUsd: pkg.price_usd,
    });

    console.log(
      `[topup] eSIM ${iccid} topped up — providerOrderNo=${result.providerOrderNo}`
    );

    return NextResponse.json({
      providerOrderNo: result.providerOrderNo,
      status: result.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[topup] Failed for iccid=${iccid}:`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
