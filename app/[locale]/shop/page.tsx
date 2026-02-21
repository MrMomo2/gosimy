export const revalidate = 600;

import type { Metadata } from 'next';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import ShopPageClient from '@/components/shop/ShopPageClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Browse eSIM Plans — All Destinations',
    description: 'Compare and buy eSIM data plans for worldwide destinations. Daily and fixed plans with instant delivery.',
    alternates: { canonical: `/${locale}/shop` },
  };
}

interface CountrySummary {
  countryCode: string;
  countryName: string;
  region: string;
  packageCount: number;
  minPriceCents: number;
  hasDailyPlan: boolean;
  hasFixedPlan: boolean;
  isMultiCountry: boolean;
}

async function getCountries(): Promise<CountrySummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('packages_cache')
    .select('country_code, country_name, region, retail_price_cents, data_type')
    .eq('is_active', true)
    .limit(5000);

  if (error || !data) return [];

  const countryMap = new Map<string, CountrySummary>();
  for (const row of data) {
    // Detect multi-country packages by non-standard country codes (not 2-letter ISO)
    const isMulti = !/^[A-Z]{2}$/.test(row.country_code);

    const existing = countryMap.get(row.country_code);
    if (!existing) {
      countryMap.set(row.country_code, {
        countryCode: row.country_code,
        countryName: row.country_name,
        region: row.region ?? 'global',
        packageCount: 1,
        minPriceCents: row.retail_price_cents,
        hasDailyPlan: row.data_type === 2,
        hasFixedPlan: row.data_type === 1,
        isMultiCountry: isMulti,
      });
    } else {
      existing.packageCount++;
      if (row.retail_price_cents < existing.minPriceCents) {
        existing.minPriceCents = row.retail_price_cents;
      }
      if (row.data_type === 2) existing.hasDailyPlan = true;
      if (row.data_type === 1) existing.hasFixedPlan = true;
    }
  }

  return Array.from(countryMap.values()).sort((a, b) =>
    a.countryName.localeCompare(b.countryName)
  );
}

export default async function ShopPage({ params }: Props) {
  const { locale } = await params;
  const countries = await getCountries();

  return <ShopPageClient countries={countries} locale={locale} />;
}
