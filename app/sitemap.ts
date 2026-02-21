import type { MetadataRoute } from 'next';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gosimy.com';
const LOCALES = ['en', 'de', 'fr', 'es'];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseAdminClient();

  // Fetch all active country codes from cache
  const { data: countries } = await supabase
    .from('packages_cache')
    .select('country_code')
    .eq('is_active', true);

  const countryCodes = [...new Set((countries ?? []).map((c) => c.country_code))];

  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: `${APP_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${APP_URL}/${locale}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${APP_URL}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${APP_URL}/${locale}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${APP_URL}/${locale}/imprint`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${APP_URL}/${locale}/refund`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${APP_URL}/${locale}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${APP_URL}/${locale}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${APP_URL}/${locale}/compatibility`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]);

  const countryRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    countryCodes.map((code) => ({
      url: `${APP_URL}/${locale}/shop/${code}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  );

  return [...staticRoutes, ...countryRoutes];
}
