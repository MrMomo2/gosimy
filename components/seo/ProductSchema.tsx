'use client';

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

interface Props {
  packages: PackageRow[];
  locale: string;
}

const LOCALE_CURRENCY: Record<string, string> = {
  en: 'USD',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
};

export function generateProductSchema(packages: PackageRow[], locale: string): object {
  const currency = LOCALE_CURRENCY[locale] || 'USD';
  
  const products = packages.slice(0, 10).map((pkg) => ({
    '@type': 'Product',
    name: pkg.name,
    description: `${pkg.country_name} eSIM - ${pkg.volume_bytes}MB for ${pkg.duration_days} days`,
    sku: pkg.package_code,
    offers: {
      '@type': 'Offer',
      price: (pkg.retail_price_cents / 100).toFixed(2),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: `https://gosimy.com/${locale}/shop/${pkg.country_code.toLowerCase()}`,
    },
    brand: {
      '@type': 'Brand',
      name: 'Gosimy',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: product,
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
