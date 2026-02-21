import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';

const CACHE_TTL_HOURS = 24;
// Minimum time between forced refreshes (prevents hammering the provider API)
const REFRESH_THROTTLE_SECONDS = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  const forceRefresh = searchParams.get('refresh') === '1';

  const supabase = createSupabaseAdminClient();

  // ── Throttle forced refreshes ───────────────────────────────────────────────
  // If a refresh was done in the last 60 s, serve from cache regardless.
  let effectiveRefresh = forceRefresh;
  if (forceRefresh) {
    const throttleCutoff = new Date(
      Date.now() - REFRESH_THROTTLE_SECONDS * 1000
    ).toISOString();
    const { data: recentRow } = await supabase
      .from('packages_cache')
      .select('cached_at')
      .gt('cached_at', throttleCutoff)
      .limit(1)
      .maybeSingle();

    if (recentRow) {
      effectiveRefresh = false; // too soon — ignore refresh flag
    }
  }

  // ── Serve from cache ────────────────────────────────────────────────────────
  if (!effectiveRefresh) {
    const query = supabase
      .from('packages_cache')
      .select('*')
      .eq('is_active', true)
      .gt(
        'cached_at',
        new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString()
      );

    if (countryCode) {
      query.eq('country_code', countryCode.toUpperCase());
    }

    const { data: cached } = await query.limit(500);

    if (cached && cached.length > 0) {
      return NextResponse.json({ packages: cached, source: 'cache' });
    }
  }

  // ── Fetch from provider ─────────────────────────────────────────────────────
  try {
    const provider = getProvider('esim_access');
    const packages = await provider.listPackages(countryCode ?? undefined);

    const cacheRows = packages.map((pkg) => ({
      package_code: pkg.packageCode,
      provider: pkg.provider,
      name: pkg.name,
      country_code: pkg.countryCode,
      country_name: pkg.countryName,
      region: pkg.region ?? null,
      price_usd: pkg.priceUsd,
      retail_price_cents: pkg.retailPriceCents,
      volume_bytes: pkg.volumeBytes.toString(),
      duration_days: pkg.durationDays,
      data_type: pkg.dataType,
      network_list: pkg.networkList ?? null,
      is_active: pkg.isActive,
      cached_at: new Date().toISOString(),
    }));

    if (cacheRows.length > 0) {
      await supabase
        .from('packages_cache')
        .upsert(cacheRows, { onConflict: 'package_code' });
    }

    return NextResponse.json({ packages: cacheRows, source: 'provider' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
