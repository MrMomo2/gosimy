'use client';

import { Wifi, Clock, CheckCircle, Sparkles, Zap, Plus } from 'lucide-react';
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
  region?: string | null;
  networkList?: unknown;
}

const DAY_OPTIONS = [1, 3, 5, 7, 10, 15, 20, 30];

function formatBytes(bytes: string | bigint): string {
  const b = typeof bytes === 'string' ? Number(bytes) : Number(bytes);
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
  return `${b} B`;
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
  region,
  networkList,
}: PackageCardProps) {
  const t = useTranslations();
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const [added, setAdded] = useState(false);
  const [selectedDays, setSelectedDays] = useState(1);

  const isDaily = dataType === 2;
  const pricePerDay = retailPriceCents / (durationDays || 1);
  const totalPrice = isDaily 
    ? Math.round(pricePerDay * selectedDays)
    : retailPriceCents;
  
  const isInCart = items.some((i) => i.packageCode === packageCode && i.periodNum === selectedDays);
  const price = (totalPrice / 100).toFixed(2);
  const dataLabel = formatBytes(volumeBytes);
  const isUnlimited = dataLabel.includes('0 B') || Number(volumeBytes) === 0;
  
  const networkInfo = (() => {
    if (!networkList || !Array.isArray(networkList)) return null;
    const list = networkList as Array<{ operatorList?: Array<{ networkType?: string }> }>;
    const types = new Set<string>();
    for (const loc of list) {
      if (loc.operatorList) {
        for (const op of loc.operatorList) {
          if (op.networkType) types.add(op.networkType);
        }
      }
    }
    if (types.size === 0) return null;
    const typeArray = Array.from(types);
    const displayType = typeArray.includes('5G') ? '5G' : typeArray.includes('4G') ? '4G' : typeArray[0];
    const operators = list.slice(0, 2).map(l => l.operatorList?.[0]?.networkType).filter(Boolean);
    return { speed: displayType, count: list.length };
  })();
  
  const isRegional = region && region !== 'global' && countryCode.length > 2;
  const isGlobal = region === 'global' || (countryCode.length > 2 && countryCode.startsWith('GL'));

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
      periodNum: isDaily ? selectedDays : undefined,
      isDaily,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
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
          <div className="flex flex-col gap-1 items-end">
            {isDaily && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 rounded-full">
                <Zap className="w-3 h-3" />
                {t('package.dailyPlan')}
              </span>
            )}
            {isGlobal && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full">
                🌍 Global
              </span>
            )}
            {isRegional && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 rounded-full">
                🏛️ Regional
              </span>
            )}
          </div>
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
              {isDaily ? (
                <span className="font-semibold text-gray-900">{selectedDays}</span>
              ) : (
                <span className="font-semibold text-gray-900">{durationDays}</span>
              )}
              <span className="text-gray-500 ml-0.5">{t('shop.days')}</span>
            </div>
          </div>
        </div>

        {/* Speed indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {networkInfo 
              ? `High-speed ${networkInfo.speed} • ${networkInfo.count} network${networkInfo.count > 1 ? 's' : ''}`
              : 'High-speed 4G/5G data'}
          </span>
        </div>
      </div>

      {/* Day Selector for Daily Plans */}
      {isDaily && (
        <div className="px-5 pb-3 border-t border-gray-100 bg-amber-50/50">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-medium text-amber-700">{t('shop.selectDays')}:</span>
            <div className="flex items-center gap-1">
              {DAY_OPTIONS.slice(0, 5).map((days) => (
                <button
                  key={days}
                  onClick={() => handleDaysChange(days)}
                  className={`
                    px-2.5 py-1 text-xs font-medium rounded-lg transition-all
                    ${selectedDays === days
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-amber-100 border border-amber-200'
                    }
                  `}
                >
                  {days}d
                </button>
              ))}
              <button
                onClick={() => handleDaysChange(Math.min(selectedDays + 1, 365))}
                disabled={selectedDays >= 365}
                className="p-1 rounded-lg hover:bg-amber-100 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price & Action */}
      <div className="mt-auto border-t border-gray-100 bg-gray-50/50 px-5 py-4 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">${price}</div>
            {isDaily ? (
              <div className="text-xs text-gray-500">
                {(pricePerDay / 100).toFixed(2)}{t('shop.perDay')} × {selectedDays} {t('shop.days')}
              </div>
            ) : (
              durationDays > 1 && (
                <div className="text-xs text-gray-500">
                  {(pricePerDay / 100).toFixed(2)}{t('shop.perDay')}
                </div>
              )
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
