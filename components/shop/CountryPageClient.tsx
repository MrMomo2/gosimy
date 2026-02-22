'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Zap, Clock, Check } from 'lucide-react';
import { PackageCard } from '@/components/shop/PackageCard';
import { generateProductSchema, JsonLd } from '@/components/seo/ProductSchema';

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

interface CountryPageClientProps {
  countryName: string;
  countryCode: string;
  packages: PackageRow[];
  locale: string;
}

function getFlagSrc(code: string): string | null {
  const c = code.toUpperCase();
  if (/^[A-Z]{2}$/.test(c)) return `https://flagcdn.com/w160/${c.toLowerCase()}.png`;
  if (c.startsWith('EU')) return 'https://flagcdn.com/w160/eu.png';
  if (c.startsWith('AUNZ')) return 'https://flagcdn.com/w160/au.png';
  return null;
}

const FLAG_BASE = 0x1F1E6 - 65;
function getFlag(code: string): string {
  if (code.length === 2 && !code.includes('-')) {
    return code.toUpperCase().split('').map(c => String.fromCodePoint(FLAG_BASE + c.charCodeAt(0))).join('');
  }
  if (code === 'EU' || code.startsWith('EU-')) return '🇪🇺';
  return '🌍';
}

export default function CountryPageClient({ countryName, countryCode, packages, locale }: CountryPageClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'fixed'>('all');
  
  const flagSrc = getFlagSrc(countryCode);
  
  const filteredPackages = packages.filter(pkg => {
    if (activeTab === 'daily') return pkg.data_type === 2;
    if (activeTab === 'fixed') return pkg.data_type === 1;
    return true;
  });

  const dailyCount = packages.filter(p => p.data_type === 2).length;
  const fixedCount = packages.filter(p => p.data_type === 1).length;

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
              <span className="text-6xl">{getFlag(countryCode)}</span>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{countryName}</h1>
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

      {/* Tabs */}
      <div className="bg-white border-b sticky top-16 z-20">
        <div className="container py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Plans ({packages.length})
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'daily'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              Daily ({dailyCount})
            </button>
            <button
              onClick={() => setActiveTab('fixed')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'fixed'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Fixed ({fixedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="container py-10">
        {filteredPackages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No plans available for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => (
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
                region={pkg.region}
                networkList={pkg.network_list}
              />
            ))}
          </div>
        )}
      </div>
      <JsonLd data={generateProductSchema(packages, locale)} />
    </div>
  );
}
