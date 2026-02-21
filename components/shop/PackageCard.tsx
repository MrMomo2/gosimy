'use client';

import { Wifi, Clock, CheckCircle, Sparkles, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface PackageCardProps {
  packageCode: string;
  provider: string;
  name: string;
  countryCode: string;
  countryName: string;
  retailPriceCents: number;
  volumeBytes: string;
  durationDays: number;
  dataType: 1 | 2;
}

function formatBytes(bytes: string | bigint): string {
  const b = typeof bytes === 'string' ? Number(bytes) : Number(bytes);
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
  return `${b} B`;
}

function formatPricePerDay(totalCents: number, days: number): string {
  if (days <= 0) return '$0.00';
  const perDay = totalCents / days;
  return `$${(perDay / 100).toFixed(2)}`;
}

export function PackageCard({
  packageCode,
  provider,
  name,
  countryCode,
  countryName,
  retailPriceCents,
  volumeBytes,
  durationDays,
  dataType,
}: PackageCardProps) {
  const t = useTranslations();
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [added, setAdded] = useState(false);

  const isInCart = items.some((i) => i.packageCode === packageCode);
  const price = (retailPriceCents / 100).toFixed(2);
  const dataLabel = formatBytes(volumeBytes);
  const isUnlimited = dataLabel.includes('0 B') || Number(volumeBytes) === 0;
  const isDaily = dataType === 2;
  const pricePerDay = formatPricePerDay(retailPriceCents, durationDays);

  const handleAdd = () => {
    addItem({
      packageCode,
      provider,
      name,
      countryCode,
      countryName,
      retailPriceCents,
      volumeBytes,
      durationDays,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="card card-hover p-0 flex flex-col group">
      {/* Header Badge */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-sky-600 transition-colors">
              {name}
            </h3>
          </div>
          {isDaily && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 rounded-full">
              <Zap className="w-3 h-3" />
              {t('package.dailyPlan')}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-4 space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <span className="font-semibold text-gray-900">
                {isUnlimited ? t('package.unlimited') : dataLabel}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="font-semibold text-gray-900">{durationDays}</span>
              <span className="text-gray-500 ml-0.5">{t('shop.days')}</span>
            </div>
          </div>
        </div>

        {/* Speed indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>High-speed 4G/5G data</span>
        </div>
      </div>

      {/* Price & Action */}
      <div className="mt-auto border-t border-gray-100 bg-gray-50/50 px-5 py-4 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">${price}</div>
            {!isDaily && durationDays > 1 && (
              <div className="text-xs text-gray-500">
                {pricePerDay}{t('shop.perDay')}
              </div>
            )}
          </div>
          
          <button
            onClick={handleAdd}
            disabled={isInCart}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${isInCart || added
                ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                : 'btn-primary px-5 py-2.5'
              }
            `}
            aria-label={`Add ${name} to cart`}
          >
            {isInCart || added ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('package.added')}
              </>
            ) : (
              t('package.addToCart')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
