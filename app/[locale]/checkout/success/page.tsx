'use client';

import { use, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Sparkles, Wifi, Mail, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { trackEcommerce } from '@/lib/analytics/ga4';

type Props = { params: Promise<{ locale: string }> };

function SuccessContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (tracked) return;
    
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return;

    fetch(`/api/checkout/session?id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.orderId && data.amount && data.items) {
          trackEcommerce({
            type: 'purchase',
            data: {
              transactionId: data.orderId,
              value: data.amount / 100,
              currency: data.currency || 'USD',
              items: data.items.map((item: any) => ({
                itemId: item.packageCode,
                itemName: item.name,
                price: item.price / 100,
                quantity: item.quantity,
              })),
            },
          });
          setTracked(true);
        }
      })
      .catch((err) => console.error('Failed to track purchase:', err));
  }, [searchParams, tracked]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 text-lg mb-2">Your eSIM is being prepared</p>
          <p className="text-sm text-gray-500 mb-8">
            You&apos;ll receive your eSIM QR code by email within a few minutes.
            You can also track your order in the portal.
          </p>
          
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-4 mb-8">
            <div className="flex items-center gap-3 justify-center text-sm text-gray-600">
              <Mail className="w-5 h-5 text-sky-500" />
              <span>Check your email for activation instructions</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/${locale}/portal`}
              className="btn-primary w-full justify-center"
            >
              <Wifi className="w-5 h-5" />
              View My eSIMs
            </Link>
            <Link
              href={`/${locale}/shop`}
              className="btn-secondary w-full justify-center"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage({ params }: Props) {
  const { locale } = use(params);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    }>
      <SuccessContent locale={locale} />
    </Suspense>
  );
}
