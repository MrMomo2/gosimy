// GET /api/esim/destinations
// Returns unique destinations (countryCode, countryName, region) for NavbarSearch.
// Sorted by package count descending so popular countries appear first.

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const revalidate = 3600;

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('packages_cache')
    .select('country_code, country_name, region')
    .eq('is_active', true);

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  const map = new Map();
  for (const row of data ?? []) {
    const existing = map.get(row.country_code);
    if (existing) {
      existing.count++;
    } else {
      map.set(row.country_code, {
        countryCode: row.country_code,
        countryName: row.country_name,
        region: row.region ?? 'global',
        count: 1,
      });
    }
  }

  const destinations = Array.from(map.values())
    .sort((a, b) => {
      const aIsCountry = /^[A-Z]{2}$/.test(a.countryCode);
      const bIsCountry = /^[A-Z]{2}$/.test(b.countryCode);
      if (aIsCountry !== bIsCountry) return aIsCountry ? -1 : 1;
      return b.count - a.count;
    })
    .map(({ countryCode, countryName, region }) => ({ countryCode, countryName, region }));

  return NextResponse.json(destinations, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
