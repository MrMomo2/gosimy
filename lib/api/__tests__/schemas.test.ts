import { describe, it, expect } from 'vitest';
import { 
  checkoutSchema, 
  couponValidateSchema, 
  topupSchema,
  couponCreateSchema,
  retryFulfillmentSchema,
  queryEsimSchema,
} from '@/lib/api/schemas';

describe('API Schemas', () => {
  describe('checkoutSchema', () => {
    it('validates valid checkout input', () => {
      const result = checkoutSchema.safeParse({
        items: [{
          packageCode: 'pkg-1',
          provider: 'esim_access',
          name: 'Test Package',
          countryCode: 'US',
          countryName: 'United States',
          retailPriceCents: 999,
          volumeBytes: '1073741824',
          durationDays: 30,
          quantity: 1,
        }],
        locale: 'en',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty cart', () => {
      const result = checkoutSchema.safeParse({
        items: [],
        locale: 'en',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cart cannot be empty');
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

    it('rejects negative price', () => {
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

    it('defaults locale to en when not provided', () => {
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
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locale).toBe('en');
      }
    });
  });

  describe('couponValidateSchema', () => {
    it('validates valid coupon input', () => {
      const result = couponValidateSchema.safeParse({
        code: 'SAVE10',
        subtotalCents: 1000,
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty code', () => {
      const result = couponValidateSchema.safeParse({
        code: '',
        subtotalCents: 1000,
      });

      expect(result.success).toBe(false);
    });

    it('rejects negative subtotal', () => {
      const result = couponValidateSchema.safeParse({
        code: 'SAVE10',
        subtotalCents: -100,
      });

      expect(result.success).toBe(false);
    });

    it('transforms code to uppercase', () => {
      const result = couponValidateSchema.safeParse({
        code: 'save10',
        subtotalCents: 1000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('SAVE10');
      }
    });
  });

  describe('topupSchema', () => {
    it('validates valid ICCID format (18 digits)', () => {
      const result = topupSchema.safeParse({
        iccid: '890123456789012345',
        packageCode: 'pkg-1',
      });

      expect(result.success).toBe(true);
    });

    it('validates valid ICCID format (22 digits)', () => {
      const result = topupSchema.safeParse({
        iccid: '8901234567890123456789',
        packageCode: 'pkg-1',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid ICCID format', () => {
      const result = topupSchema.safeParse({
        iccid: '123',
        packageCode: 'pkg-1',
      });

      expect(result.success).toBe(false);
    });

    it('rejects ICCID with letters', () => {
      const result = topupSchema.safeParse({
        iccid: '890123456789ABCDEF',
        packageCode: 'pkg-1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('couponCreateSchema', () => {
    it('validates valid coupon creation', () => {
      const result = couponCreateSchema.safeParse({
        code: 'SUMMER20',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_cents: 1000,
        is_active: true,
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid discount type', () => {
      const result = couponCreateSchema.safeParse({
        code: 'SUMMER20',
        discount_type: 'invalid',
        discount_value: 20,
      });

      expect(result.success).toBe(false);
    });

    it('rejects zero discount value', () => {
      const result = couponCreateSchema.safeParse({
        code: 'SUMMER0',
        discount_type: 'percentage',
        discount_value: 0,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('retryFulfillmentSchema', () => {
    it('validates valid UUID', () => {
      const result = retryFulfillmentSchema.safeParse({
        orderId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = retryFulfillmentSchema.safeParse({
        orderId: 'not-a-uuid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('queryEsimSchema', () => {
    it('validates valid ICCID', () => {
      const result = queryEsimSchema.safeParse({
        iccid: '89012345678901234567',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid ICCID', () => {
      const result = queryEsimSchema.safeParse({
        iccid: 'short',
      });

      expect(result.success).toBe(false);
    });
  });
});
