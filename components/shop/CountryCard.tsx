import Link from 'next/link';
import Image from 'next/image';

interface CountryCardProps {
  countryCode: string;
  countryName: string;
  packageCount: number;
  minPriceCents: number;
  locale: string;
}

// ─── Flag resolution ──────────────────────────────────────────────────────────
type FlagInfo =
  | { type: 'img'; src: string; alt: string }
  | { type: 'emoji'; emoji: string };

function getFlagInfo(countryCode: string): FlagInfo {
  const code = countryCode.toUpperCase();

  // Standard 2-letter ISO codes → flagcdn.com image
  if (/^[A-Z]{2}$/.test(code)) {
    return {
      type: 'img',
      src: `https://flagcdn.com/w80/${code.toLowerCase()}.png`,
      alt: `${code} flag`,
    };
  }

  // European regional packs → EU flag
  if (code.startsWith('EU')) {
    return { type: 'img', src: 'https://flagcdn.com/w80/eu.png', alt: 'Europe flag' };
  }

  // Australia & New Zealand
  if (code.startsWith('AUNZ')) {
    return { type: 'img', src: 'https://flagcdn.com/w80/au.png', alt: 'Australia flag' };
  }

  // USA & Canada
  if (code.startsWith('USCA')) {
    return { type: 'img', src: 'https://flagcdn.com/w80/us.png', alt: 'USA flag' };
  }

  // Singapore & Malaysia combos
  if (code.startsWith('SGMY')) {
    return { type: 'img', src: 'https://flagcdn.com/w80/sg.png', alt: 'Singapore flag' };
  }

  // China combos
  if (code.startsWith('CN') || code.startsWith('CNJP')) {
    return { type: 'img', src: 'https://flagcdn.com/w80/cn.png', alt: 'China flag' };
  }

  // Region emojis for everything else
  if (code.startsWith('AS')) return { type: 'emoji', emoji: '🌏' };
  if (code.startsWith('NA') || code.startsWith('CB')) return { type: 'emoji', emoji: '🌎' };
  if (code.startsWith('SA')) return { type: 'emoji', emoji: '🌎' };
  if (code.startsWith('AF')) return { type: 'emoji', emoji: '🌍' };
  if (code.startsWith('ME') || code.startsWith('SAAE') || code.startsWith('GCC')) return { type: 'emoji', emoji: '🕌' };
  if (code.startsWith('GL')) return { type: 'emoji', emoji: '🌐' };

  return { type: 'emoji', emoji: '🌍' };
}

export function CountryCard({
  countryCode,
  countryName,
  packageCount,
  minPriceCents,
  locale,
}: CountryCardProps) {
  const flagInfo = getFlagInfo(countryCode);
  const minPrice = (minPriceCents / 100).toFixed(2);

  return (
    <Link
      href={`/${locale}/shop/${countryCode}`}
      className="flex flex-col items-center gap-3 p-5 rounded-xl border bg-white hover:border-primary hover:shadow-md transition-all group"
    >
      <div className="w-12 h-8 flex items-center justify-center overflow-hidden rounded-sm">
        {flagInfo.type === 'img' ? (
          <Image
            src={flagInfo.src}
            alt={flagInfo.alt}
            width={80}
            height={60}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-4xl leading-none">{flagInfo.emoji}</span>
        )}
      </div>
      <div className="text-center">
        <div className="font-semibold text-sm group-hover:text-primary transition-colors">
          {countryName}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          From ${minPrice} · {packageCount} plan{packageCount !== 1 ? 's' : ''}
        </div>
      </div>
    </Link>
  );
}
