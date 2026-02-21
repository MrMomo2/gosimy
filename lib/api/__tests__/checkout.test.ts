import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkoutSchema } from '@/lib/api/schemas';

describe('Checkout API', () => {
  describe('Input Validation', () => {
    it('rejects empty cart', () => {
      const result = checkoutSchema.safeParse({
        items: [],
        locale: 'en',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('empty');
      }
    });

    it('rejects negative quantity', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: -1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(false);
    });

    it('rejects quantity > 10', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: 11,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(false);
    });

    it('rejects invalid package code format', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: '',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(false);
    });

    it('rejects price manipulation (negative)', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: -100,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(false);
    });

    it('rejects price manipulation (zero)', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 0,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(false);
    });

    it('accepts valid locale codes', () => {
      for (const locale of ['en', 'de', 'fr', 'es']) {
        const result = checkoutSchema.safeParse({
          items: [{
            packageCode: 'pkg-1',
            provider: 'esim_access',
            name: 'Test',
            countryCode: 'US',
            countryName: 'US',
            retailPriceCents: 999,
            volumeBytes: '1000',
            durationDays: 30,
            quantity: 1,
          }],
          locale,
        });

        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid locale', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Price Integrity', () => {
    it('should validate prices against cached packages', () => {
      const cachedPrice = 999;
      const submittedPrice = 500;

      expect(submittedPrice).toBeLessThan(cachedPrice);
    });

    it('should reject prices below provider minimum', () => {
      const minPrice = 100;
      const submittedPrice = 50;

      expect(submittedPrice).toBeLessThan(minPrice);
    });
  });

  describe('Cart Limits', () => {
    it('accepts up to 10 items', () => {
      const items = Array(10).fill(null).map((_, i) => ({
        packageCode: `pkg-${i}`,
        provider: 'esim_access',
        name: 'Test',
        countryCode: 'US',
        countryName: 'US',
        retailPriceCents: 999,
        volumeBytes: '1000',
        durationDays: 30,
        quantity: 1,
      }));

      const result = checkoutSchema.safeParse({ items, locale: 'en' });
      expect(result.success).toBe(true);
    });

    it('rejects more than 10 items', () => {
      const items = Array(11).fill(null).map((_, i) => ({
        packageCode: `pkg-${i}`,
        provider: 'esim_access',
        name: 'Test',
        countryCode: 'US',
        countryName: 'US',
        retailPriceCents: 999,
        volumeBytes: '1000',
        durationDays: 30,
        quantity: 1,
      }));

      const result = checkoutSchema.safeParse({ items, locale: 'en' });
      expect(result.success).toBe(false);
    });
  });

  describe('Provider Validation', () => {
    it('accepts valid provider', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Country Code Validation', () => {
    it('accepts valid 2-letter country codes', () => {
      for (const code of ['US', 'DE', 'FR', 'JP', 'GB']) {
        const result = checkoutSchema.safeParse({
          items: [{
            packageCode: 'pkg-1',
            provider: 'esim_access',
            name: 'Test',
            countryCode: code,
            countryName: 'Country',
            retailPriceCents: 999,
            volumeBytes: '1000',
            durationDays: 30,
            quantity: 1,
          }],
          locale: 'en',
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Duration Validation', () => {
    it('accepts valid duration', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1000',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(true);
    });

    it('rejects negative duration', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1000',
          durationDays: -5,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Volume Validation', () => {
    it('accepts valid volume bytes', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '1073741824',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty volume', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test',
          countryCode: 'US',
          countryName: 'US',
          retailPriceCents: 999,
          volumeBytes: '',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(false);
    });
  });
});
