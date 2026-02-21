'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, Smartphone, XCircle } from 'lucide-react';
import { searchCompatibleDevices } from '@/lib/data/compatible-devices';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DeviceSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ brand: string; device: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const params = useParams();
    const locale = params.locale as string;

    // Since we don't have dedicated translations for this yet, we'll use English as fallback
    // In a real app, t() would be used for all these strings
    const t = useTranslations();

    useEffect(() => {
        if (query.trim().length >= 2) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                const matches = searchCompatibleDevices(query);
                setResults(matches);
                setHasSearched(true);
                setIsSearching(false);
            }, 300); // Debounce
            return () => clearTimeout(timer);
        } else {
            setResults([]);
            setHasSearched(false);
            setIsSearching(false);
        }
    }, [query]);

    return (
        <div className="w-full max-w-xl mx-auto mt-8">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-lg transition-all"
                    placeholder="Search your device (e.g. iPhone 15, Pixel 8)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                )}
            </div>

            {query.length >= 2 && (
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {isSearching ? (
                        <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Checking compatibility...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="p-2">
                            <div className="px-4 py-3 bg-green-50 text-green-700 rounded-xl mb-2 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 shrink-0" />
                                <p className="font-medium text-sm">Great news! These devices support eSIM:</p>
                            </div>
                            <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                                {results.map((r, i) => (
                                    <li key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <Smartphone className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-gray-900 font-medium">{r.device}</p>
                                            <p className="text-gray-500 text-xs">{r.brand}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : hasSearched ? (
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <p className="text-gray-900 font-medium mb-1">We couldn&apos;t find this device</p>
                            <p className="text-gray-500 text-sm mb-4">
                                It might not support eSIM, or it might be missing from our database.
                            </p>
                            <p className="text-xs text-gray-400">
                                Tip: Check your phone settings under &quot;Mobile Data&quot; or &quot;Cellular&quot;.
                            </p>
                        </div>
                    ) : null}
                </div>
            )}

            <div className="mt-4 text-center">
                <Link href={`/${locale}/compatibility`} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 transition-all">
                    View all supported devices
                    <span aria-hidden="true">&rarr;</span>
                </Link>
            </div>
        </div>
    );
}
