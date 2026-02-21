import { describe, it, expect } from 'vitest';
import { checkoutSchema, checkoutItemSchema } from '@/lib/api/schemas';

describe('Schema Security (Fixed)', () => {
  describe('Price Validation', () => {
    it('rejects zero price', () => {
      const result = checkoutItemSchema.safeParse({
        packageCode: 'pkg-1',
        provider: 'esim_access',
        name: 'Test',
        countryCode: 'US',
        countryName: 'US',
        retailPriceCents: 0,
        volumeBytes: '1000',
        durationDays: 30,
        quantity: 1,
      });

      expect(result.success).toBe(false);
    });

    it('accepts positive price', () => {
      const result = checkoutItemSchema.safeParse({
        packageCode: 'pkg-1',
        provider: 'esim_access',
        name: 'Test',
        countryCode: 'US',
        countryName: 'US',
        retailPriceCents: 1,
        volumeBytes: '1000',
        durationDays: 30,
        quantity: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Quantity Limits', () => {
    it('rejects quantity > 10', () => {
      const result = checkoutItemSchema.safeParse({
        packageCode: 'pkg-1',
        provider: 'esim_access',
        name: 'Test',
        countryCode: 'US',
        countryName: 'US',
        retailPriceCents: 999,
        volumeBytes: '1000',
        durationDays: 30,
        quantity: 11,
      });

      expect(result.success).toBe(false);
    });

    it('accepts quantity = 10', () => {
      const result = checkoutItemSchema.safeParse({
        packageCode: 'pkg-1',
        provider: 'esim_access',
        name: 'Test',
        countryCode: 'US',
        countryName: 'US',
        retailPriceCents: 999,
        volumeBytes: '1000',
        durationDays: 30,
        quantity: 10,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Cart Size Limits', () => {
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

    it('accepts exactly 10 items', () => {
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
  });
});
