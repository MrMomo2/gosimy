import { z } from 'zod';

export const checkoutItemSchema = z.object({
  packageCode: z.string().min(1, 'Package code is required'),
  provider: z.string().min(1, 'Provider is required'),
  name: z.string().min(1, 'Name is required'),
  countryCode: z.string().min(2, 'Country code is required'),
  countryName: z.string().min(1, 'Country name is required'),
  retailPriceCents: z.coerce.number().int().positive('Price must be positive'),
  volumeBytes: z.coerce.string().min(1, 'Volume is required'),
  durationDays: z.coerce.number().int().positive('Duration must be positive'),
  quantity: z.coerce.number().int().positive('Quantity must be positive').max(10, 'Maximum 10 per item').default(1),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty').max(10, 'Maximum 10 items per order'),
  locale: z.enum(['en', 'de', 'fr', 'es']).default('en'),
  couponId: z.string().uuid().optional(),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50).toUpperCase(),
  subtotalCents: z.number().int().nonnegative('Subtotal must be non-negative'),
});

export const topupSchema = z.object({
  iccid: z.string().regex(/^\d{18,22}$/, 'Invalid ICCID format'),
  packageCode: z.string().min(1, 'Package code is required'),
});

export const refundSchema = z.object({
  refundId: z.string().uuid('Invalid refund ID'),
});

export const couponCreateSchema = z.object({
  code: z.string().min(1).max(50).transform(s => s.toUpperCase()),
  description: z.string().max(500).optional().nullable(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().int().positive('Discount value must be positive'),
  min_order_cents: z.number().int().nonnegative().default(0),
  max_uses: z.number().int().positive().optional().nullable(),
  valid_from: z.string().datetime().optional().nullable(),
  valid_until: z.string().datetime().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const couponUpdateSchema = couponCreateSchema.partial();

export const retryFulfillmentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

export const queryEsimSchema = z.object({
  iccid: z.string().regex(/^\d{18,22}$/, 'Invalid ICCID format'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CouponValidateInput = z.infer<typeof couponValidateSchema>;
export type TopupInput = z.infer<typeof topupSchema>;
export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
