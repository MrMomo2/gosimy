import Link from 'next/link';
import { XCircle, RefreshCw, Home, ShoppingCart } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function CheckoutCancelPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('checkout.cancel');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <XCircle className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-500 text-lg mb-2">{t('subtitle')}</p>
          <p className="text-sm text-gray-500 mb-8">{t('desc')}</p>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
            <div className="flex items-center gap-3 justify-center text-sm text-amber-700">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              <span>{t('cartSaved')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/${locale}/shop`}
              className="btn-primary w-full justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              {t('tryAgain')}
            </Link>
            <Link
              href={`/${locale}`}
              className="btn-secondary w-full justify-center"
            >
              <Home className="w-4 h-4" />
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
