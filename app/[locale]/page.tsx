export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Wifi, Shield, Zap, Globe, Smartphone, QrCode, CreditCard, MapPin, Clock, CheckCircle, ChevronRight, Star } from 'lucide-react';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import HeroAnimation from '@/components/hero/HeroAnimation';
import DeviceSearch from '@/components/search/DeviceSearch';

const COUNTRY_IMAGES: Record<string, string> = {
  FR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80', // France - Eiffel Tower
  US: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80', // USA - San Francisco
  JP: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80', // Japan - Mount Fuji (Fixed)
  ES: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&q=80', // Spain - Architecture
  IT: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80', // Italy - Cinque Terre
  GB: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80', // UK - Big Ben
  DE: 'https://images.unsplash.com/photo-1599946347371-88a312a783a1?w=600&q=80', // Germany - Brandenburg Gate
  TR: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80', // Turkey - Istanbul
  TH: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600&q=80', // Thailand - Beach
  CN: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80', // China - Great Wall
  AE: 'https://images.unsplash.com/photo-1512453979798-5ea904ac66de?w=600&q=80', // UAE - Dubai
  CH: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80', // Switzerland - Mountains
  AU: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80', // Australia - Sydney Opera House
  ID: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', // Indonesia - Bali
  KR: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&q=80', // South Korea - Seoul
  CA: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&q=80', // Canada - Lake Louise
};

type Props = { params: Promise<{ locale: string }> };

const META: Record<string, { title: string; description: string }> = {
  en: { title: 'Gosimy — Instant eSIM for Worldwide Travel | Data Plans', description: 'Buy eSIM data plans for worldwide destinations. Instant QR code delivery, no contracts, no roaming fees. Stay connected with Gosimy.' },
  de: { title: 'Gosimy — Sofort-eSIM für weltweites Reisen | Datenpläne', description: 'eSIM-Datenpläne für weltweite Reiseziele kaufen. Sofortige QR-Code-Lieferung, keine Verträge, keine Roaming-Gebühren.' },
  fr: { title: 'Gosimy — eSIM instantanée pour voyager | Forfaits données', description: 'Achetez des forfaits eSIM pour vos voyages. Livraison QR code instantanée, sans contrats, sans frais de roaming.' },
  es: { title: 'Gosimy — eSIM instantánea para viajar | Planes de datos', description: 'Compra planes de datos eSIM para tus viajes. Entrega QR code instantánea, sin contratos, sin roaming.' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = META[locale] ?? META.en;
  return { title: meta.title, description: meta.description, alternates: { canonical: `/${locale}` } };
}

interface FeaturedDestination {
  countryCode: string;
  countryName: string;
  minPriceCents: number;
  planCount: number;
}

const getHomepageData = async () => {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('packages_cache')
    .select('country_code, country_name, retail_price_cents')
    .eq('is_active', true)
    .limit(5000);

  if (!data) return { totalDestinations: 0, featured: [] };

  const countryMap = new Map<string, FeaturedDestination>();
  for (const row of data) {
    const existing = countryMap.get(row.country_code);
    if (!existing) {
      countryMap.set(row.country_code, {
        countryCode: row.country_code,
        countryName: row.country_name,
        minPriceCents: row.retail_price_cents,
        planCount: 1,
      });
    } else {
      existing.planCount++;
      if (row.retail_price_cents < existing.minPriceCents) {
        existing.minPriceCents = row.retail_price_cents;
      }
    }
  }

  const all = Array.from(countryMap.values());
  // Pick popular destinations with most plans, filtering out regions (codes > 2 chars) and explicit exclusions
  const sorted = all
    .filter(d => d.countryCode && d.countryCode.length === 2 && !['EU', 'NA', 'AS', 'SA', 'AF', 'OC', 'WW', 'IL'].includes(d.countryCode))
    .sort((a, b) => b.planCount - a.planCount);

  // Start with top 8
  let featured = sorted.slice(0, 8);

  // Ensure Turkey (TR) is included if available, replacing the last item if needed
  const trIndex = featured.findIndex(d => d.countryCode === 'TR');
  if (trIndex === -1) {
    const tr = sorted.find(d => d.countryCode === 'TR');
    if (tr) {
      featured = [...featured.slice(0, 7), tr];
    }
  }

  return { totalDestinations: all.length, featured };
};

const STEPS = [
  { icon: Globe, step: '01', color: 'from-blue-500 to-indigo-600' },
  { icon: CreditCard, step: '02', color: 'from-indigo-500 to-violet-600' },
  { icon: QrCode, step: '03', color: 'from-violet-500 to-purple-600' },
  { icon: Wifi, step: '04', color: 'from-purple-500 to-pink-600' },
];

const COMPATIBLE_DEVICES = [
  'iPhone 16 / 15 / 14 / 13 / SE 3',
  'Samsung Galaxy S24 / S23 / Z Fold / Z Flip',
  'Google Pixel 9 / 8 / 7',
  'iPad Pro / Air (WiFi + Cellular)',
  'Motorola Edge / Razr',
  'OnePlus 12 / 11',
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const { totalDestinations, featured } = await getHomepageData();

  return (
    <div className="min-h-screen">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container py-16 md:py-24 lg:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text column */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-blue-300 mb-8 border border-white/10">
                <Zap className="w-4 h-4" />
                <span>{totalDestinations}+ {t('home.hero.countriesCovered')}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight select-none">
                {t('home.hero.title').split(' ').map((word: string, i: number) => (
                  <span key={i}>
                    {i >= 2 ? <span className="gradient-text-light">{word} </span> : `${word} `}
                  </span>
                ))}
              </h1>

              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl leading-relaxed select-none">
                {t('home.hero.subtitle', { count: totalDestinations })}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${locale}/shop`}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 text-lg"
                >
                  {t('home.hero.cta')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-lg"
                >
                  {t('home.hero.ctaSecondary')}
                </a>
              </div>
            </div>

            {/* Animated eSIM illustration */}
            <div className="relative hidden md:block">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BADGES ═══════════ */}
      <section className="bg-white border-b border-gray-100">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Globe, value: `${totalDestinations}+`, label: t('home.hero.countriesCovered') },
              { icon: Zap, value: 'Instant', label: 'QR Delivery' },
              { icon: Shield, value: 'Secure', label: 'Stripe Payments' },
              { icon: Star, value: '4.9/5', label: 'Customer Rating' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="select-none">
                  <p className="font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED DESTINATIONS ═══════════ */}
      {featured.length > 0 && (
        <section className="section bg-gray-50/50 mesh-gradient">
          <div className="container">
            <div className="text-center mb-14 select-none">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('home.featured.title')}</h2>
              <p className="text-gray-600 text-lg max-w-xl mx-auto">{t('home.featured.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">


              {featured.map((dest) => {
                const scenicImage = COUNTRY_IMAGES[dest.countryCode];
                return (
                  <Link
                    key={dest.countryCode}
                    href={`/${locale}/shop/${dest.countryCode}`}
                    className="group card overflow-hidden hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-500 hover:-translate-y-1 block p-0"
                  >
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      <Image
                        src={scenicImage || `https://flagcdn.com/w640/${dest.countryCode.toLowerCase()}.png`}
                        alt={dest.countryName}
                        fill
                        className={`object-cover transition-transform duration-700 group-hover:scale-110 ${!scenicImage ? 'opacity-90 p-4' : ''}`}
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent transition-opacity duration-300 group-hover:opacity-95" />

                      {/* Flag badge if scenic image is used */}
                      {scenicImage && (
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden shadow-lg shadow-black/20">
                          <Image
                            src={`https://flagcdn.com/w80/${dest.countryCode.toLowerCase()}.png`}
                            alt="Flag"
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        </div>
                      )}

                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg drop-shadow-md group-hover:text-sky-300 transition-colors">{dest.countryName}</h3>
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <ArrowRight className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between bg-white">
                      <span className="text-sm font-medium text-gray-500">{dest.planCount} plans</span>
                      <span className="text-sm font-bold text-blue-600">
                        from ${(dest.minPriceCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Link
                href={`/${locale}/shop`}
                className="btn-primary text-base"
              >
                {t('home.featured.viewAll', { count: totalDestinations })}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ WHAT IS AN eSIM? ═══════════ */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4" /> eSIM Technology
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6 select-none">
                What is an eSIM?
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                An eSIM (embedded SIM) is a digital SIM built into your device. Instead of inserting a physical SIM card,
                you simply scan a QR code to activate your data plan — instantly, from anywhere in the world.
              </p>
              <ul className="space-y-4">
                {[
                  'No physical SIM card needed — everything is digital',
                  'Keep your local number active while using travel data',
                  'Switch between plans instantly without swapping cards',
                  'Environmentally friendly — no plastic waste',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: Zap, title: 'Instant Setup', desc: 'Ready in 2 minutes' },
                    { icon: Globe, title: `${totalDestinations}+ Countries`, desc: 'Global coverage' },
                    { icon: Shield, title: 'Secure', desc: 'Encrypted connection' },
                    { icon: Wifi, title: '4G/5G Speed', desc: 'High-speed data' },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <item.icon className="w-7 h-7" />
                      </div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-blue-200 text-xs mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-16 select-none">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-gray-600 text-lg">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step, i) => {
              const stepKey = `step${i + 1}` as 'step1' | 'step2' | 'step3' | 'step4';
              return (
                <div key={i} className="relative text-center group">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:right-auto md:left-1/2 md:-translate-x-1/2 md:-top-3 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t(`home.howItWorks.${stepKey}.title`)}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{t(`home.howItWorks.${stepKey}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPATIBLE DEVICES ═══════════ */}
      <section className="section bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4" /> Compatibility
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Compatible with Your Device
              </h2>
              <p className="text-gray-600 text-lg">
                Most modern smartphones, tablets, and smartwatches support eSIM technology.
              </p>
            </div>

            <DeviceSearch />
          </div>
        </div>
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <section className="section bg-gray-50 mesh-gradient">
        <div className="container">
          <div className="text-center mb-16 select-none">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('home.benefits.title')}</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">{t('home.benefits.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Wifi, titleKey: 'home.benefits.stayConnected', descKey: 'home.benefits.stayConnectedDesc', gradient: 'from-blue-500 to-blue-600' },
              { icon: Shield, titleKey: 'home.benefits.noHiddenFees', descKey: 'home.benefits.noHiddenFeesDesc', gradient: 'from-indigo-500 to-indigo-600' },
              { icon: Clock, titleKey: 'home.benefits.instantActivation', descKey: 'home.benefits.instantActivationDesc', gradient: 'from-violet-500 to-violet-600' },
              { icon: Smartphone, titleKey: 'home.benefits.worksEverywhere', descKey: 'home.benefits.worksEverywhereDesc', gradient: 'from-purple-500 to-purple-600' },
            ].map((benefit, i) => (
              <div key={i} className="card p-6 text-center">
                <div className={`w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">{t(benefit.titleKey)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t(benefit.descKey, { count: totalDestinations })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="relative overflow-hidden bg-gray-900 text-white shadow-2xl">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-700 to-sky-900 opacity-90" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative container py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">{t('home.cta.title')}</h2>
            <p className="text-xl md:text-2xl text-blue-100/90 mb-10 font-light max-w-2xl mx-auto leading-relaxed">{t('home.cta.subtitle')}</p>
            <Link
              href={`/${locale}/shop`}
              className="inline-flex items-center justify-center gap-3 bg-white text-blue-700 font-bold px-10 py-4 rounded-full shadow-2xl hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300 text-lg group"
            >
              {t('home.cta.button')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ PAYMENTS TRUST ═══════════ */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
            <span className="text-sm font-medium text-gray-500">{t('home.payments.securePayments')}</span>
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold tracking-wide">VISA</span>
              <span className="text-xl font-bold text-blue-600">Mastercard</span>
              <span className="text-xl font-bold text-purple-600">Apple Pay</span>
              <span className="text-xl font-bold text-green-600">Google Pay</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
