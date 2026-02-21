'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, MapPin, Loader2 } from 'lucide-react';

interface Destination {
  countryCode: string;
  countryName: string;
  region: string;
}

function getFlagSrc(countryCode: string): string | null {
  const code = countryCode.toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  if (code.startsWith('EU')) return 'https://flagcdn.com/w40/eu.png';
  if (code.startsWith('AUNZ')) return 'https://flagcdn.com/w40/au.png';
  if (code.startsWith('USCA')) return 'https://flagcdn.com/w40/us.png';
  if (code.startsWith('SGMY')) return 'https://flagcdn.com/w40/sg.png';
  if (code.startsWith('CN') || code.startsWith('CNJP')) return 'https://flagcdn.com/w40/cn.png';
  return null;
}

function DestinationFlag({ countryCode, size = 'md' }: { countryCode: string; size?: 'sm' | 'md' }) {
  const src = getFlagSrc(countryCode);
  const cls = size === 'sm'
    ? 'w-6 h-4 object-cover rounded-sm'
    : 'w-8 h-6 object-cover rounded-sm';
  if (src) {
    return <img src={src} alt="" aria-hidden className={cls} />;
  }
  return <span className={size === 'sm' ? 'text-lg' : 'text-2xl'}>🌍</span>;
}

interface Props {
  locale: string;
}

export function NavbarSearch({ locale }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Destination[]>([]);
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/esim/destinations')
      .then((res) => res.json())
      .then((data) => setAllDestinations(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = allDestinations
        .filter((d) =>
          d.countryName.toLowerCase().includes(q) ||
          d.countryCode.toLowerCase().includes(q)
        )
        .slice(0, 8);
      setResults(filtered);
      setLoading(false);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, allDestinations]);

  const handleSelect = (dest: Destination) => {
    setQuery('');
    setResults([]);
    setFocused(false);
    router.push(`/${locale}/shop/${dest.countryCode}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[0]);
    } else if (query.trim()) {
      router.push(`/${locale}/shop?search=${encodeURIComponent(query)}`);
      setFocused(false);
    }
  };

  const popularDestinations = useMemo(() => {
    return allDestinations.slice(0, 6);
  }, [allDestinations]);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm group-focus-within:border-blue-400 group-focus-within:shadow-md transition-all">
            <Search className="w-5 h-5 text-gray-400 ml-4 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Where are you traveling to?"
              className="w-full px-3 py-2.5 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            />
            {loading && (
              <Loader2 className="w-4 h-4 text-gray-400 mr-3 animate-spin" />
            )}
            {query && !loading && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="p-1.5 mr-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </form>

      {focused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {query ? (
            results.length > 0 ? (
              <div className="py-2">
                <p className="px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Destinations
                </p>
                {results.map((dest) => (
                  <button
                    key={dest.countryCode}
                    onClick={() => handleSelect(dest)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <DestinationFlag countryCode={dest.countryCode} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{dest.countryName}</p>
                      <p className="text-xs text-gray-500 capitalize">{dest.region}</p>
                    </div>
                    <MapPin className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center">
                <p className="text-gray-500">No destinations found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              </div>
            )
          ) : (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Popular Destinations
              </p>
              <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                {popularDestinations.map((dest) => (
                  <button
                    key={dest.countryCode}
                    onClick={() => handleSelect(dest)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <DestinationFlag countryCode={dest.countryCode} size="sm" />
                    <span className="text-sm font-medium text-gray-700 truncate">{dest.countryName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Press <kbd className="px-1.5 py-0.5 bg-white border rounded text-gray-500">Enter</kbd> to search all plans
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
