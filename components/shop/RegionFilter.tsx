'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const REGIONS = [
  { key: 'all', label: 'All' },
  { key: 'europe', label: 'Europe' },
  { key: 'asia', label: 'Asia' },
  { key: 'americas', label: 'Americas' },
  { key: 'middleEast', label: 'Middle East' },
  { key: 'africa', label: 'Africa' },
  { key: 'oceania', label: 'Oceania' },
];

export function RegionFilter({ activeRegion }: { activeRegion: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setRegion = (region: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (region === 'all') {
      params.delete('region');
    } else {
      params.set('region', region);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((r) => (
        <button
          key={r.key}
          onClick={() => setRegion(r.key)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            (activeRegion === r.key) || (r.key === 'all' && activeRegion === 'all')
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-muted-foreground border-border hover:border-primary hover:text-primary'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
