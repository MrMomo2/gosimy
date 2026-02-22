import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lskwritlptfmxeysxihb.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_KEY = process.env.ESIM_ACCESS_API_KEY || '75570614b72a49ce84ff135d5d12285e';

const PRICE_DIVISOR = 10_000;

function calcRetailPriceCents(costUsd: number) {
    let retail;
    if (costUsd <= 10) {
        retail = costUsd * 2.0;
    } else if (costUsd <= 20) {
        retail = 20.0 + (costUsd - 10) * 1.5;
    } else {
        retail = 35.0 + (costUsd - 20) * 1.25;
    }
    return Math.ceil(retail * 100);
}

const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States', DE: 'Germany', FR: 'France', GB: 'United Kingdom', JP: 'Japan', CN: 'China',
    KR: 'South Korea', AU: 'Australia', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', IN: 'India',
    ES: 'Spain', IT: 'Italy', NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
    FI: 'Finland', CH: 'Switzerland', AT: 'Austria', BE: 'Belgium', PL: 'Poland', PT: 'Portugal',
    CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', GR: 'Greece', TR: 'Turkey', TH: 'Thailand',
    SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines', VN: 'Vietnam', HK: 'Hong Kong',
    TW: 'Taiwan', AE: 'UAE', SA: 'Saudi Arabia', EG: 'Egypt', ZA: 'South Africa', NG: 'Nigeria',
    KE: 'Kenya', NZ: 'New Zealand', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru',
    IL: 'Israel', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain', OM: 'Oman', JO: 'Jordan', IE: 'Ireland',
    SK: 'Slovakia', SI: 'Slovenia', HR: 'Croatia', BG: 'Bulgaria', LT: 'Lithuania', LV: 'Latvia',
    EE: 'Estonia', LU: 'Luxembourg', MT: 'Malta',
};

const MULTI_PREFIXES: [string, string][] = [
    ['SGMYVNTHID', 'Southeast Asia'], ['SAAEQAKWOM', 'Gulf Region'],
    ['SGMYTH', 'Singapore, Malaysia & Thailand'], ['CNJPKR', 'China, Japan & South Korea'],
    ['CNHK', 'China & Hong Kong'], ['SGMY', 'Singapore & Malaysia'],
    ['AUNZ', 'Australia & New Zealand'], ['USCA', 'USA & Canada'],
    ['EU', 'Europe'], ['AS', 'Asia'], ['SA', 'South America'], ['NA', 'North America'],
    ['AF', 'Africa'], ['ME', 'Middle East'], ['GL', 'Global'], ['CB', 'Caribbean'], ['OC', 'Oceania'],
];

function getMultiCountryName(code: string, pkgName: string) {
    const upper = code.toUpperCase();
    for (const [p, n] of MULTI_PREFIXES) {
        if (upper.startsWith(p)) return n;
    }
    const m = pkgName.match(/^([^\d(]+)/);
    return m ? m[1].trim() : pkgName;
}

function detectRegion(code: string) {
    const c = code.toUpperCase();
    const singleMap: Record<string, string> = { EU: 'europe', X1: 'asia', X2: 'africa', X3: 'americas', X4: 'americas', OC: 'oceania', XG: 'global' };
    if (singleMap[c]) return singleMap[c];
    if (c.startsWith('EU-')) return 'europe';
    if (c.startsWith('AS-') || c.startsWith('ME-') || c.startsWith('CN-')) return 'asia';
    if (c.startsWith('SGMY') || c.startsWith('CNJP') || c.startsWith('CNHK')) return 'asia';
    if (c.startsWith('AF-')) return 'africa';
    if (c.startsWith('NA-') || c.startsWith('USCA')) return 'americas';
    if (c.startsWith('SA-')) return 'americas';
    if (c.startsWith('CB-')) return 'americas';
    if (c.startsWith('AUNZ')) return 'oceania';
    if (c.startsWith('SAAE') || c.startsWith('GCC')) return 'middleEast';
    if (c.startsWith('GL-')) return 'global';
    const eu = new Set(['DE', 'FR', 'GB', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'BE', 'PL', 'PT', 'CZ', 'HU', 'RO', 'GR', 'IE', 'SK', 'SI', 'HR', 'BG', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY', 'IS', 'RS', 'UA', 'TR']);
    const as = new Set(['JP', 'CN', 'KR', 'TH', 'SG', 'MY', 'ID', 'PH', 'VN', 'HK', 'TW', 'IN', 'PK', 'BD', 'LK', 'NP', 'MM', 'KH', 'LA', 'MN', 'KZ', 'UZ', 'GE', 'AM', 'AZ']);
    const am = new Set(['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'DO', 'CU', 'JM', 'PR', 'TT']);
    const me = new Set(['AE', 'SA', 'IL', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ']);
    const af = new Set(['ZA', 'NG', 'KE', 'EG', 'GH', 'TZ', 'ET', 'UG', 'SN', 'CI', 'MA', 'TN', 'DZ', 'CM', 'ZM', 'ZW', 'RW', 'MU', 'MG', 'MZ']);
    const oc = new Set(['AU', 'NZ', 'FJ', 'PG', 'WS', 'TO', 'VU', 'SB', 'PW']);
    if (eu.has(c)) return 'europe';
    if (as.has(c)) return 'asia';
    if (am.has(c)) return 'americas';
    if (me.has(c)) return 'middleEast';
    if (af.has(c)) return 'africa';
    if (oc.has(c)) return 'oceania';
    return 'global';
}

function getIncludedCountries(locationStr: string | null | undefined): string[] {
    if (!locationStr || typeof locationStr !== 'string') {
        return [];
    }
    
    const countries: string[] = locationStr
        .split(',')
        .map((c: string) => c.trim().toUpperCase())
        .filter((c: string) => c.length > 0);
    
    return [...new Set(countries)];
}

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log('[Cron] Starting update-packages job');
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            console.warn('[Cron] Unauthorized attempt to update packages');
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        console.log('[Cron] Fetching packages from eSIM Access...');
        const res = await fetch('https://api.esimaccess.com/api/v1/open/package/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'RT-AccessCode': API_KEY },
            body: '{}',
        });

        if (!res.ok) {
            throw new Error(`eSIM Access HTTP Error: ${res.status}`);
        }

        const data = await res.json();
        if (!data.success || !data.obj || !data.obj.packageList) {
            throw new Error(`eSIM Access API Error: ${data.errorMsg || 'Invalid response format'}`);
        }

        const list = data.obj.packageList;
        console.log(`[Cron] Fetched ${list.length} packages`);

        const rows = list.map((pkg: any) => {
            const costUsd = pkg.price / PRICE_DIVISOR;
            const raw = pkg.location ?? '';
            const isMulti = raw.includes(',');
            const locationCode = isMulti
                ? (pkg.locationCode ?? raw).toUpperCase()
                : (raw.toUpperCase() || 'XX');
            const countryName = isMulti
                ? getMultiCountryName(locationCode, pkg.name)
                : (COUNTRY_NAMES[locationCode] ?? pkg.name);

            const includedCountries = getIncludedCountries(pkg.location);

            return {
                package_code: pkg.packageCode,
                provider: 'esim_access',
                name: pkg.name,
                location: pkg.location || null,
                country_code: locationCode,
                country_name: countryName,
                region: detectRegion(locationCode),
                price_usd: costUsd,
                retail_price_cents: calcRetailPriceCents(costUsd),
                volume_bytes: String(Math.round(pkg.volume ?? 0)),
                duration_days: pkg.duration ?? 0,
                data_type: pkg.dataType ?? 1,
                network_list: pkg.locationNetworkList ?? null,
                included_countries: includedCountries,
                is_active: true,
                cached_at: new Date().toISOString(),
            };
        });

        const BATCH = 300;
        let done = 0;
        for (let i = 0; i < rows.length; i += BATCH) {
            const { error } = await supabase
                .from('packages_cache')
                .upsert(rows.slice(i, i + BATCH), { onConflict: 'package_code' });

            if (error) {
                throw new Error(`Supabase Upsert Error processing batch ${i}: ${error.message}`);
            }
            done += Math.min(BATCH, rows.length - i);
            console.log(`[Cron] Upserted ${done}/${rows.length}...`);
        }

        console.log('[Cron] Successfully updated eSIM Access packages.');
        return NextResponse.json({ success: true, count: rows.length });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[Cron] Update packages failed:', errorMsg);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}
