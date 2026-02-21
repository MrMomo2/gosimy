'use client';

import { X, ShoppingCart, Tag, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useCouponStore } from '@/store/coupon';
import { CartItem } from './CartItem';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  locale: string;
}

export function CartDrawer({ open, onClose, locale }: CartDrawerProps) {
  const t = useTranslations();
  const items = useCartStore((s) => s.items);
  const getTotalCents = useCartStore((s) => s.getTotalCents);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const appliedCoupon = useCouponStore((s) => s.appliedCoupon);
  const isLoadingCoupon = useCouponStore((s) => s.isLoading);
  const couponError = useCouponStore((s) => s.error);
  const applyCoupon = useCouponStore((s) => s.applyCoupon);
  const removeCoupon = useCouponStore((s) => s.removeCoupon);
  const getDiscountCents = useCouponStore((s) => s.getDiscountCents);

  const [couponInput, setCouponInput] = useState('');

  const subtotalCents = getTotalCents();
  const discountCents = appliedCoupon ? getDiscountCents(subtotalCents) : 0;
  const totalCents = subtotalCents - discountCents;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeButtonRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab' && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, [onClose]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    await applyCoupon(couponInput.trim(), subtotalCents);
    setCouponInput('');
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/checkout/dodo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          locale,
          couponId: appliedCoupon?.id,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Checkout failed: ${data.error || 'Please try again.'}`);
        setLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const formatTotal = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50">
          <div id="cart-title" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">{t('cart.title')}</h2>
              {mounted && items.length > 0 && (
                <span className="text-sm text-gray-500">
                  {items.length} {items.length === 1 ? t('cart.items').slice(0, -1) : t('cart.items')}
                </span>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-white/80 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-gray-300" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t('cart.empty')}</h3>
              <p className="text-gray-500 text-sm mb-6">{t('cart.emptyDesc')}</p>
              <button
                onClick={onClose}
                className="btn-primary text-sm"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-4" role="list" aria-label="Cart items">
              {items.map((item) => (
                <CartItem key={item.packageCode} item={item} />
              ))}
            </div>
          )}
        </div>

        {mounted && items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-5 bg-gray-50/50">
            <div className="space-y-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="font-semibold text-green-800 text-sm">{appliedCoupon.code}</span>
                      <span className="text-green-600 text-sm ml-2">
                        -{appliedCoupon.discountType === 'percentage'
                          ? `${appliedCoupon.discountValue}%`
                          : formatTotal(appliedCoupon.discountValue)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-white/50 transition-colors"
                    aria-label={`Remove coupon ${appliedCoupon.code}`}
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <label htmlFor="coupon-input" className="sr-only">Coupon code</label>
                    <input
                      id="coupon-input"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={t('cart.couponPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isLoadingCoupon || !couponInput.trim()}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-busy={isLoadingCoupon}
                  >
                    {isLoadingCoupon ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : t('cart.apply')}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">{couponError}</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>{t('cart.subtotal')}</span>
                <span>{formatTotal(subtotalCents)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-green-600 text-sm font-medium">
                  <span>{t('cart.discount')}</span>
                  <span>-{formatTotal(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-100">
                <span>{t('cart.total')}</span>
                <span className="gradient-text">{formatTotal(totalCents)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure checkout powered by Stripe</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  {t('cart.redirecting')}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  {t('cart.checkout')}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
