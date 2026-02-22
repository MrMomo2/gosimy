export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import CountryPageClient from '@/components/shop/CountryPageClient';

type Props = { params: Promise<{ locale: string; countryCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, countryCode } = await params;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('packages_cache')
    .select('country_name')
    .eq('country_code', countryCode.toUpperCase())
    .limit(1)
    .single();

  const countryName = data?.country_name ?? countryCode.toUpperCase();
  return {
    title: `${countryName} eSIM — Compare & Buy Data Plans`,
    description: `Compare ${countryName} eSIM data plans. Daily & fixed options. Instant delivery, no contracts.`,
    alternates: { canonical: `/${locale}/shop/${countryCode}` },
  };
}

interface PackageRow {
  package_code: string;
  provider: string;
  name: string;
  country_code: string;
  country_name: string;
  region: string | null;
  retail_price_cents: number;
  volume_bytes: string;
  duration_days: number;
  data_type: number;
  network_list: unknown;
}

async function getAllPackagesForCountry(countryCode: string): Promise<PackageRow[]> {
  const supabase = createSupabaseAdminClient();
  const searchCode = countryCode.toUpperCase();

  // Get all packages that work in this country (direct, regional, or global)
  const { data: directPackages } = await supabase
    .from('packages_cache')
    .select('*')
    .eq('country_code', searchCode)
    .eq('is_active', true)
    .order('retail_price_cents', { ascending: true });

  const { data: regionalPackages } = await supabase
    .from('packages_cache')
    .select('*')
    .contains('included_countries', [searchCode])
    .neq('country_code', searchCode)
    .eq('is_active', true)
    .eq('region', 'europe')
    .order('retail_price_cents', { ascending: true });

  const { data: globalPackages } = await supabase
    .from('packages_cache')
    .select('*')
    .contains('included_countries', [searchCode])
    .neq('country_code', searchCode)
    .eq('is_active', true)
    .eq('region', 'global')
    .order('retail_price_cents', { ascending: true });

  const allPackages = [
    ...(directPackages ?? []),
    ...(regionalPackages ?? []),
    ...(globalPackages ?? []),
  ];

  return allPackages;
}

export default async function CountryPackagesPage({ params }: Props) {
  const { locale, countryCode } = await params;
  const packages = await getAllPackagesForCountry(countryCode);

  if (packages.length === 0) {
    notFound();
  }

  const searchCode = countryCode.toUpperCase();
  const countryName = packages[0]?.country_name ?? searchCode;

  return (
    <CountryPageClient
      countryName={countryName}
      countryCode={searchCode}
      packages={packages}
      locale={locale}
    />
  );
}
