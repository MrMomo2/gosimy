import { create } from 'zustand';

export interface AppliedCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountCents: number;
}

interface CouponState {
  appliedCoupon: AppliedCoupon | null;
  isLoading: boolean;
  error: string | null;
  applyCoupon: (code: string, subtotalCents: number) => Promise<boolean>;
  removeCoupon: () => void;
  getDiscountCents: (subtotalCents: number) => number;
}

export const useCouponStore = create<CouponState>((set, get) => ({
  appliedCoupon: null,
  isLoading: false,
  error: null,

  applyCoupon: async (code: string, subtotalCents: number) => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalCents }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({ error: data.error || 'Invalid coupon', isLoading: false });
        return false;
      }

      set({
        appliedCoupon: {
          id: data.coupon.id,
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          discountCents: data.discountCents,
        },
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to validate coupon',
        isLoading: false,
      });
      return false;
    }
  },

  removeCoupon: () => {
    set({ appliedCoupon: null, error: null });
  },

  getDiscountCents: (subtotalCents: number) => {
    const coupon = get().appliedCoupon;
    if (!coupon) return 0;

    if (coupon.discountType === 'percentage') {
      return Math.floor((subtotalCents * coupon.discountValue) / 100);
    }
    return Math.min(coupon.discountValue, subtotalCents);
  },
}));
