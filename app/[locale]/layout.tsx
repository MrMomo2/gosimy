import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { GoogleAnalytics } from '@/components/layout/GoogleAnalytics';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

const locales = ['en', 'de', 'fr', 'es'];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gosimy.com';

export const metadata: Metadata = {
  title: {
    default: 'Gosimy — Instant eSIMs for Travelers',
    template: '%s | Gosimy',
  },
  description: 'Stay connected worldwide with instant eSIMs. No contracts, no roaming fees.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    siteName: 'Gosimy',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale)) notFound();

  setRequestLocale(locale);

  const messages = await getMessages();

  const alternates = locales.map((loc) => ({
    hrefLang: loc,
    href: `${APP_URL}/${loc}`,
  }));

  return (
    <html lang={locale} className={inter.className} data-scroll-behavior="smooth">
      <head>
        {alternates.map(({ hrefLang, href }) => (
          <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${APP_URL}/en`} />
      </head>
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar locale={locale} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} />
          <CookieBanner />
          <GoogleAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
