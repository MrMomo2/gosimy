import type {
  EsimAccessPackage,
  EsimAccessEsimProfile,
  EsimAccessLocation,
} from './types';
import type {
  CanonicalPackage,
  CanonicalEsimStatus,
  CanonicalLocation,
} from '../types';

// ─── Pricing ──────────────────────────────────────────────────────────────────
// API price field: divide by 10_000 to get USD (e.g. 90000 → $9.00)
const PRICE_DIVISOR = 10_000;

// Retail markup tiers (applied to cost price, result in USD cents)
// Uses charm pricing: rounds up to the nearest dollar, then subtracts $0.01
// e.g. cost $3.60 × 2.0 = $7.20 → $7.99; cost $9.00 × 1.75 = $15.75 → $15.99
function calcRetailPriceCents(costUsd: number): number {
  let multiplier: number;
  if (costUsd < 10) multiplier = 2.0;       // 100% margin
  else if (costUsd < 20) multiplier = 1.75; // 75% margin
  else multiplier = 1.5;                     // 50% margin
  const rawCents = costUsd * multiplier * 100;
  const nextDollarCents = Math.ceil(rawCents / 100) * 100;
  return nextDollarCents - 1; // charm pricing: $X.99
}

// ─── Country / region metadata ────────────────────────────────────────────────
export function detectRegion(locationCode: string): string {
  const code = locationCode.toUpperCase();

  // Known single-letter region codes from eSIM Access
  if (['EU', 'X1', 'X2', 'X3', 'X4', 'OC', 'XG'].includes(code)) {
    const regionMap: Record<string, string> = {
      EU: 'europe', X1: 'asia', X2: 'africa', X3: 'americas',
      X4: 'americas', OC: 'oceania', XG: 'global',
    };
    return regionMap[code] ?? 'global';
  }

  // Prefix-based region detection (multi-country locationCodes like EU-42, AS-7, GL-139…)
  if (code.startsWith('EU-')) return 'europe';
  if (code.startsWith('AS-') || code.startsWith('ME-') || code.startsWith('CN-')) return 'asia';
  if (code.startsWith('SGMY') || code.startsWith('CNJP') || code.startsWith('CNHK')) return 'asia';
  if (code.startsWith('AF-')) return 'africa';
  if (code.startsWith('NA-') || code.startsWith('USCA')) return 'americas';
  if (code.startsWith('SA-')) return 'americas';
  if (code.startsWith('CB-')) return 'americas';        // Caribbean
  if (code.startsWith('AUNZ')) return 'oceania';
  if (code.startsWith('SAAE') || code.startsWith('GCC')) return 'middleEast';
  if (code.startsWith('GL-')) return 'global';          // Global bundles (not oceania!)

  // Individual ISO-3166-1 alpha-2 country codes
  const europeCountries = new Set(['DE','FR','GB','ES','IT','NL','SE','NO','DK','FI','CH','AT','BE','PL','PT','CZ','HU','RO','GR','IE','SK','SI','HR','BG','LT','LV','EE','LU','MT','CY','IS','RS','UA','TR']);
  const asiaCountries = new Set(['JP','CN','KR','TH','SG','MY','ID','PH','VN','HK','TW','IN','PK','BD','LK','NP','MM','KH','LA','MN','KZ','UZ','GE','AM','AZ']);
  const americasCountries = new Set(['US','CA','MX','BR','AR','CL','CO','PE','VE','EC','BO','PY','UY','CR','PA','GT','HN','SV','NI','DO','CU','JM','PR','TT']);
  const middleEastCountries = new Set(['AE','SA','IL','QA','KW','BH','OM','JO','LB','IQ']);
  const africaCountries = new Set(['ZA','NG','KE','EG','GH','TZ','ET','UG','SN','CI','MA','TN','DZ','CM','ZM','ZW','RW','MU','MG','MZ']);
  const oceaniaCountries = new Set(['AU','NZ','FJ','PG','WS','TO','VU','SB','PW']);

  if (europeCountries.has(code)) return 'europe';
  if (asiaCountries.has(code)) return 'asia';
  if (americasCountries.has(code)) return 'americas';
  if (middleEastCountries.has(code)) return 'middleEast';
  if (africaCountries.has(code)) return 'africa';
  if (oceaniaCountries.has(code)) return 'oceania';

  return 'global';
}

// ─── Display names for individual countries ────────────────────────────────────
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', DE: 'Germany', FR: 'France', GB: 'United Kingdom',
  JP: 'Japan', CN: 'China', KR: 'South Korea', AU: 'Australia', CA: 'Canada',
  MX: 'Mexico', BR: 'Brazil', IN: 'India', ES: 'Spain', IT: 'Italy',
  NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  CH: 'Switzerland', AT: 'Austria', BE: 'Belgium', PL: 'Poland', PT: 'Portugal',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', GR: 'Greece', TR: 'Turkey',
  TH: 'Thailand', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines',
  VN: 'Vietnam', HK: 'Hong Kong', TW: 'Taiwan', AE: 'UAE', SA: 'Saudi Arabia',
  EG: 'Egypt', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya', NZ: 'New Zealand',
  AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru', IL: 'Israel',
  QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain', OM: 'Oman', JO: 'Jordan',
  IE: 'Ireland', SK: 'Slovakia', SI: 'Slovenia', HR: 'Croatia', BG: 'Bulgaria',
  LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', LU: 'Luxembourg', MT: 'Malta',
  // Single-character region codes
  EU: 'Europe', X1: 'Asia', X2: 'Africa', X3: 'North America', X4: 'South America',
  OC: 'Oceania', XG: 'Global',
};

// ─── Display names for multi-country locationCodes (EU-42, AS-7, GL-139 …) ──────
// Ordered longest-prefix-first so more specific matches win.
const LOCATION_CODE_PREFIX_NAMES: [string, string][] = [
  ['SGMYVNTHID', 'Southeast Asia'],
  ['SAAEQAKWOM', 'Gulf Region'],
  ['SGMYTH',    'Singapore, Malaysia & Thailand'],
  ['CNJPKR',    'China, Japan & South Korea'],
  ['CNHK',      'China & Hong Kong'],
  ['SGMY',      'Singapore & Malaysia'],
  ['AUNZ',      'Australia & New Zealand'],
  ['USCA',      'USA & Canada'],
  ['EU',        'Europe'],
  ['AS',        'Asia'],
  ['SA',        'South America'],
  ['NA',        'North America'],
  ['AF',        'Africa'],
  ['ME',        'Middle East'],
  ['GL',        'Global'],
  ['CB',        'Caribbean'],
  ['OC',        'Oceania'],
  ['GCC',       'Gulf Region'],
];

function getMultiCountryName(locationCode: string, fallbackName: string): string {
  const upper = locationCode.toUpperCase();
  for (const [prefix, name] of LOCATION_CODE_PREFIX_NAMES) {
    if (upper.startsWith(prefix)) return name;
  }
  // Fall back to extracting leading words from the package name (before first digit)
  const match = fallbackName.match(/^([^\d(]+)/);
  return match ? match[1].trim() : fallbackName;
}

// ─── Package adapter ──────────────────────────────────────────────────────────
export function adaptPackage(pkg: EsimAccessPackage): CanonicalPackage {
  const costUsd = pkg.price / PRICE_DIVISOR;

  // Multi-country packages: location is a comma-separated list of ISO codes.
  // Use locationCode (e.g. "EU-42") as the canonical code in that case.
  const rawLocation = pkg.location ?? '';
  const isMultiCountry = rawLocation.includes(',');
  const locationCode = isMultiCountry
    ? (pkg.locationCode ?? rawLocation).toUpperCase()
    : rawLocation.toUpperCase() || 'XX';

  const countryName = isMultiCountry
    ? getMultiCountryName(locationCode, pkg.name)
    : (COUNTRY_NAMES[locationCode] ?? pkg.name);

  // Volume is already in bytes from the API
  const volumeBytes = BigInt(Math.round(pkg.volume ?? 0));

  return {
    packageCode: pkg.packageCode,
    provider: 'esim_access',
    name: pkg.name,
    countryCode: locationCode,
    countryName,
    region: detectRegion(locationCode),
    priceUsd: costUsd,
    retailPriceCents: calcRetailPriceCents(costUsd),
    volumeBytes,
    durationDays: pkg.duration ?? 0,
    dataType: (pkg.dataType as 1 | 2) ?? 1,
    isMultiCountry,
    networkList: pkg.locationNetworkList?.flatMap((loc) =>
      loc.operatorList.map((op) => ({
        locationName: loc.locationName,
        operatorName: op.operatorName,
        networkType: op.networkType,
      }))
    ),
    isActive: true,
    isTopup: pkg.type === 'TOPUP',
  };
}

export function adaptEsimProfile(profile: EsimAccessEsimProfile): CanonicalEsimStatus {
  return {
    esimTranNo: profile.esimTranNo,
    iccid: profile.iccid,
    smdpStatus: profile.smdpStatus ?? '',
    esimStatus: profile.esimStatus,
    dataUsedBytes: BigInt(Math.round(profile.orderUsage ?? 0)),
    dataTotalBytes: BigInt(Math.round(profile.totalVolume ?? 0)),
    expiresAt: profile.expiredTime ? new Date(profile.expiredTime) : undefined,
    activationCode: profile.ac,
    qrCodeUrl: profile.qrCodeUrl,
  };
}

export function mapSmdpStatusToOrderStatus(
  smdpStatus?: string
): CanonicalOrderResult_status {
  const upper = smdpStatus?.toUpperCase() ?? '';
  if (upper === 'RELEASED') return 'released';
  if (upper === 'FAILED' || upper === 'CANCELLED') return 'failed';
  return 'processing';
}

type CanonicalOrderResult_status = 'pending' | 'processing' | 'released' | 'failed';

export function adaptLocation(loc: EsimAccessLocation): CanonicalLocation {
  return {
    code: loc.code,
    name: loc.name,
    type: loc.type,
    children: loc.subLocationList?.map((s) => ({ code: s.code, name: s.name })) ?? undefined,
  };
}
