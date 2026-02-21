export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Zap, Clock, Globe, Check } from 'lucide-react';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { PackageCard } from '@/components/shop/PackageCard';

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
  is_multi_country: boolean;
  network_list: unknown;
}

async function getPackagesForCountry(countryCode: string): Promise<PackageRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('packages_cache')
    .select('*')
    .eq('country_code', countryCode.toUpperCase())
    .eq('is_active', true)
    .order('retail_price_cents', { ascending: true });

  return data ?? [];
}

function getFlagSrc(countryCode: string): string | null {
  const code = countryCode.toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
  if (code.startsWith('EU')) return 'https://flagcdn.com/w160/eu.png';
  if (code.startsWith('AUNZ')) return 'https://flagcdn.com/w160/au.png';
  if (code.startsWith('USCA')) return 'https://flagcdn.com/w160/us.png';
  if (code.startsWith('SGMY')) return 'https://flagcdn.com/w160/sg.png';
  if (code.startsWith('CN') || code.startsWith('CNJP')) return 'https://flagcdn.com/w160/cn.png';
  return null;
}

const FLAG_BASE = 0x1F1E6 - 65;
function getFlag(code: string): string {
  if (code.length === 2 && !code.includes('-')) {
    return code.toUpperCase().split('').map(c => String.fromCodePoint(FLAG_BASE + c.charCodeAt(0))).join('');
  }
  if (code === 'EU' || code.startsWith('EU-')) return '🇪🇺';
  if (code === 'XG' || code.startsWith('GL-')) return '🌍';
  if (code === 'OC' || code.startsWith('AUNZ')) return '🇦🇺';
  return '🌍';
}

export default async function CountryPackagesPage({ params }: Props) {
  const { locale, countryCode } = await params;
  const packages = await getPackagesForCountry(countryCode);

  if (packages.length === 0) {
    notFound();
  }

  const countryName = packages[0]?.country_name ?? countryCode;
  const flagSrc = getFlagSrc(countryCode.toUpperCase());
  const isMultiCountry = packages[0]?.is_multi_country ?? false;

  const dailyPlans = packages.filter(p => p.data_type === 2);
  const fixedPlans = packages.filter(p => p.data_type === 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white">
        <div className="container py-10 md:py-14">
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 text-sky-200 hover:text-white mb-6 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all destinations
          </Link>

          <div className="flex items-center gap-5">
            {flagSrc ? (
              <div className="w-20 h-14 overflow-hidden rounded-lg shadow-lg shrink-0">
                <Image
                  src={flagSrc}
                  alt={`${countryName} flag`}
                  width={160}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <span className="text-6xl">{getFlag(countryCode.toUpperCase())}</span>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">{countryName}</h1>
                {isMultiCountry && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-white/20 rounded-full flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Multi-Country
                  </span>
                )}
              </div>
              <p className="text-sky-100">
                {packages.length} plan{packages.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              Instant activation
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              No contracts
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              24/7 support
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              eSIM compatible devices
            </div>
          </div>
        </div>
      </div>

      <div className="container py-10">
        {/* Daily Plans */}
        {dailyPlans.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Daily Plans</h2>
                <p className="text-sm text-gray-500">Pay per day, perfect for short trips</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyPlans.map((pkg) => (
                <PackageCard
                  key={pkg.package_code}
                  packageCode={pkg.package_code}
                  provider={pkg.provider}
                  name={pkg.name}
                  countryCode={pkg.country_code}
                  countryName={pkg.country_name}
                  retailPriceCents={pkg.retail_price_cents}
                  volumeBytes={pkg.volume_bytes}
                  durationDays={pkg.duration_days}
                  dataType={pkg.data_type as 1 | 2}
                />
              ))}
            </div>
          </section>
        )}

        {/* Fixed Plans */}
        {fixedPlans.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Fixed Period Plans</h2>
                <p className="text-sm text-gray-500">Set duration, great value for longer stays</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedPlans.map((pkg) => (
                <PackageCard
                  key={pkg.package_code}
                  packageCode={pkg.package_code}
                  provider={pkg.provider}
                  name={pkg.name}
                  countryCode={pkg.country_code}
                  countryName={pkg.country_name}
                  retailPriceCents={pkg.retail_price_cents}
                  volumeBytes={pkg.volume_bytes}
                  durationDays={pkg.duration_days}
                  dataType={pkg.data_type as 1 | 2}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
