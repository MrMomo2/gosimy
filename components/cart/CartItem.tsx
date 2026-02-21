'use client';

import { Minus, Plus, Trash2, Wifi, Clock } from 'lucide-react';
import { useCartStore, type CartItem as CartItemType } from '@/store/cart';

function formatBytes(bytes: string): string {
  const b = Number(bytes);
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
  return `${b} B`;
}

export function CartItem({ item }: { item: CartItemType }) {
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const price = ((item.retailPriceCents * item.quantity) / 100).toFixed(2);
  const FLAG_BASE = 0x1F1E6 - 65;
  const flag = item.countryCode.length === 2
    ? item.countryCode.toUpperCase().split('').map(c => String.fromCodePoint(FLAG_BASE + c.charCodeAt(0))).join('')
    : '🌍';

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all" role="listitem">
      <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
        {flag}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">{item.name}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
            {formatBytes(item.volumeBytes)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
            {item.durationDays} days
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1" role="group" aria-label={`Quantity: ${item.quantity}`}>
            <button
              onClick={() => updateQuantity(item.packageCode, item.quantity - 1)}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-colors"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="w-3 h-3 text-gray-600" aria-hidden="true" />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-gray-900" aria-live="polite">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.packageCode, item.quantity + 1)}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-colors"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="w-3 h-3 text-gray-600" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-base gradient-text">${price}</span>
            <button
              onClick={() => removeItem(item.packageCode)}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400"
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
