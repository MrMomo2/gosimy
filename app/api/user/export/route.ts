import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const [ordersResult, esimsResult] = await Promise.all([
    admin
      .from('orders')
      .select('id, status, currency, amount_total, created_at, order_items(package_name, country_code, duration_days, volume_bytes, unit_price_cents)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('esims')
      .select('iccid, status, provider, data_total_bytes, data_used_bytes, expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      authProvider: user.app_metadata?.provider ?? 'email',
    },
    orders: (ordersResult.data ?? []).map((o: Record<string, unknown>) => ({
      id: o.id,
      status: o.status,
      currency: o.currency,
      amountTotal: o.amount_total,
      createdAt: o.created_at,
      items: ((o.order_items as Record<string, unknown>[] | null) ?? []).map((i) => ({
        packageName: i.package_name,
        countryCode: i.country_code,
        durationDays: i.duration_days,
        volumeBytes: i.volume_bytes,
        unitPriceCents: i.unit_price_cents,
      })),
    })),
    esims: (esimsResult.data ?? []).map((e: Record<string, unknown>) => ({
      iccid: e.iccid,
      status: e.status,
      provider: e.provider,
      dataTotalBytes: e.data_total_bytes,
      dataUsedBytes: e.data_used_bytes,
      expiresAt: e.expires_at,
      createdAt: e.created_at,
    })),
  };

  const filename = `gosimy-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify(exportData, null, 2);

  return new Response(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
