import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCouponStore } from '../coupon';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Coupon Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useCouponStore.setState({
      appliedCoupon: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('starts with no applied coupon', () => {
      const { result } = renderHook(() => useCouponStore());
      expect(result.current.appliedCoupon).toBeNull();
    });

    it('starts with isLoading false', () => {
      const { result } = renderHook(() => useCouponStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('starts with no error', () => {
      const { result } = renderHook(() => useCouponStore());
      expect(result.current.error).toBeNull();
    });
  });

  describe('applyCoupon', () => {
    it('sets loading state during fetch', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            coupon: { id: '1', code: 'SAVE10', discountType: 'percentage', discountValue: 10 },
            discountCents: 100,
          }),
        }), 100))
      );

      const { result } = renderHook(() => useCouponStore());
      
      act(() => {
        result.current.applyCoupon('SAVE10', 1000);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('applies valid coupon successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          coupon: {
            id: 'coupon-1',
            code: 'SAVE10',
            discountType: 'percentage',
            discountValue: 10,
          },
          discountCents: 100,
        }),
      });

      const { result } = renderHook(() => useCouponStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.applyCoupon('SAVE10', 1000);
      });

      expect(success!).toBe(true);
      expect(result.current.appliedCoupon).not.toBeNull();
      expect(result.current.appliedCoupon?.code).toBe('SAVE10');
      expect(result.current.error).toBeNull();
    });

    it('sets error on invalid coupon', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid coupon code' }),
      });

      const { result } = renderHook(() => useCouponStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.applyCoupon('INVALID', 1000);
      });

      expect(success!).toBe(false);
      expect(result.current.appliedCoupon).toBeNull();
      expect(result.current.error).toBe('Invalid coupon code');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCouponStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.applyCoupon('SAVE10', 1000);
      });

      expect(success!).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('sends correct request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          coupon: { id: '1', code: 'TEST', discountType: 'fixed', discountValue: 500 },
          discountCents: 500,
        }),
      });

      const { result } = renderHook(() => useCouponStore());

      await act(async () => {
        await result.current.applyCoupon('TEST', 2000);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'TEST', subtotalCents: 2000 }),
      });
    });
  });

  describe('removeCoupon', () => {
    it('clears applied coupon', async () => {
      // First apply a coupon
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          coupon: { id: '1', code: 'SAVE10', discountType: 'percentage', discountValue: 10 },
          discountCents: 100,
        }),
      });

      const { result } = renderHook(() => useCouponStore());

      await act(async () => {
        await result.current.applyCoupon('SAVE10', 1000);
      });

      expect(result.current.appliedCoupon).not.toBeNull();

      // Then remove it
      act(() => {
        result.current.removeCoupon();
      });

      expect(result.current.appliedCoupon).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('clears error when removing coupon', () => {
      useCouponStore.setState({ error: 'Some error' });

      const { result } = renderHook(() => useCouponStore());

      act(() => {
        result.current.removeCoupon();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('getDiscountCents', () => {
    it('returns 0 when no coupon applied', () => {
      const { result } = renderHook(() => useCouponStore());
      
      const discount = result.current.getDiscountCents(1000);
      expect(discount).toBe(0);
    });

    it('calculates percentage discount correctly', () => {
      useCouponStore.setState({
        appliedCoupon: {
          id: '1',
          code: 'SAVE10',
          discountType: 'percentage',
          discountValue: 10,
          discountCents: 100,
        },
      });

      const { result } = renderHook(() => useCouponStore());

      const discount = result.current.getDiscountCents(1000);
      expect(discount).toBe(100); // 10% of 1000
    });

    it('calculates fixed discount correctly', () => {
      useCouponStore.setState({
        appliedCoupon: {
          id: '1',
          code: 'SAVE500',
          discountType: 'fixed',
          discountValue: 500,
          discountCents: 500,
        },
      });

      const { result } = renderHook(() => useCouponStore());

      const discount = result.current.getDiscountCents(1000);
      expect(discount).toBe(500);
    });

    it('caps fixed discount at subtotal', () => {
      useCouponStore.setState({
        appliedCoupon: {
          id: '1',
          code: 'SAVE500',
          discountType: 'fixed',
          discountValue: 500,
          discountCents: 500,
        },
      });

      const { result } = renderHook(() => useCouponStore());

      const discount = result.current.getDiscountCents(300);
      expect(discount).toBe(300); // Can't discount more than subtotal
    });

    it('calculates 20% correctly', () => {
      useCouponStore.setState({
        appliedCoupon: {
          id: '1',
          code: 'SAVE20',
          discountType: 'percentage',
          discountValue: 20,
          discountCents: 200,
        },
      });

      const { result } = renderHook(() => useCouponStore());

      const discount = result.current.getDiscountCents(5000);
      expect(discount).toBe(1000); // 20% of 5000
    });
  });

  describe('AppliedCoupon Interface', () => {
    it('contains all required fields', () => {
      const coupon = {
        id: 'coupon-123',
        code: 'SUMMER25',
        discountType: 'percentage' as const,
        discountValue: 25,
        discountCents: 250,
      };

      expect(coupon.id).toBeDefined();
      expect(coupon.code).toBeDefined();
      expect(coupon.discountType).toBeDefined();
      expect(coupon.discountValue).toBeDefined();
      expect(coupon.discountCents).toBeDefined();
    });
  });
});
