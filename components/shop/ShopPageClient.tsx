'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Globe, MapPin, Wifi, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition, useState, useEffect } from 'react';

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

const REGIONS = [
    { key: 'all', label: 'All', icon: '🌍' },
    { key: 'europe', label: 'Europe', icon: '🇪🇺' },
    { key: 'asia', label: 'Asia', icon: '🌏' },
    { key: 'americas', label: 'Americas', icon: '🌎' },
    { key: 'middleEast', label: 'Middle East', icon: '🕌' },
    { key: 'africa', label: 'Africa', icon: '🌍' },
    { key: 'oceania', label: 'Oceania', icon: '🏝️' },
];

function getFlagUrl(code: string): string | null {
    if (/^[A-Z]{2}$/.test(code)) return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
    if (code.startsWith('EU')) return 'https://flagcdn.com/w320/eu.png';
    if (code.startsWith('AUNZ')) return 'https://flagcdn.com/w320/au.png';
    return null;
}

function CountryCard({ country, locale }: { country: CountrySummary; locale: string }) {
    const flagUrl = getFlagUrl(country.countryCode);

    return (
        <Link
            href={`/${locale}/shop/${country.countryCode}`}
            className="group card card-hover p-0 flex flex-col"
        >
            <div className="relative h-36 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {flagUrl ? (
                    <Image
                        src={flagUrl}
                        alt={country.countryName}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Globe className="w-12 h-12 text-white/60" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-bold text-white text-base line-clamp-1 drop-shadow-lg">
                        {country.countryName}
                    </h3>
                </div>
                {country.isMultiCountry && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Multi
                    </div>
                )}
            </div>
            <div className="px-4 py-3 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{country.packageCount} plans</span>
                </div>
                <span className="text-sm font-bold text-blue-600">
                    from ${(country.minPriceCents / 100).toFixed(2)}
                </span>
            </div>
        </Link>
    );
}

function ShopContent({ countries, locale }: { countries: CountrySummary[]; locale: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const activeRegion = searchParams.get('region') ?? 'all';
    const searchTerm = searchParams.get('search') ?? '';

    const setParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (!value || value === 'all') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        },
        [router, pathname, searchParams]
    );

    const singleCountries = countries.filter(c => !c.isMultiCountry);
    const multiCountries = countries.filter(c => c.isMultiCountry);

    const filterCountries = (list: CountrySummary[]) => {
        return list.filter(c => {
            const matchesRegion = activeRegion === 'all' || c.region === activeRegion;
            const matchesSearch = !searchTerm || c.countryName.toLowerCase().includes(searchTerm.toLowerCase()) || c.countryCode.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesRegion && matchesSearch;
        });
    };

    const filteredSingle = filterCountries(singleCountries);
    const filteredMulti = filterCountries(multiCountries);
    const totalFiltered = filteredSingle.length + filteredMulti.length;

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero */}
            <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white">
                <div className="absolute inset-0">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
                </div>
                <div className="container py-14 md:py-20 relative">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3">
                        Choose Your Destination
                    </h1>
                    <p className="text-blue-200 text-lg mb-8">
                        Browse eSIM data plans for {countries.length}+ countries & regions
                    </p>

                    {/* Search */}
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search countries..."
                            defaultValue={searchTerm}
                            onChange={(e) => setParam('search', e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/15 transition-all text-lg"
                        />
                        {isPending && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                </div>
            </section>

            {/* Region Filters */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
                <div className="container py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {REGIONS.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => setParam('region', r.key)}
                                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeRegion === r.key
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <span className="mr-1.5">{r.icon}</span>
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="container py-10">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-gray-500 text-sm">
                        <span className="font-bold text-gray-900 text-lg">{totalFiltered}</span> destinations
                    </p>
                </div>

                {totalFiltered === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <MapPin className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-xl mb-2">No destinations found</h3>
                        <p className="text-gray-500 mb-6">Try a different search or region filter.</p>
                        <button
                            onClick={() => {
                                setParam('search', '');
                                setParam('region', 'all');
                            }}
                            className="btn-primary text-sm"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Single Countries */}
                        {filteredSingle.length > 0 && (
                            <div className="mb-12">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredSingle.map((c) => (
                                        <CountryCard key={c.countryCode} country={c} locale={locale} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regional eSIM Bundles */}
                        {filteredMulti.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-xl">Regional eSIM Bundles</h2>
                                        <p className="text-sm text-gray-500">Multi-country plans for entire regions</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredMulti.map((c) => (
                                        <CountryCard key={c.countryCode} country={c} locale={locale} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function ShopPageClient({ countries, locale }: { countries: CountrySummary[]; locale: string }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        }>
            <ShopContent countries={countries} locale={locale} />
        </Suspense>
    );
}
