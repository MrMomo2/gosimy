-- ============================================================
-- Gosimy — Refund System Schema
-- ============================================================

-- refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_email          TEXT,
  amount_cents        INTEGER NOT NULL,
  reason              TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  stripe_refund_id    TEXT,
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id
  ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status
  ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at
  ON refund_requests(created_at DESC);

-- RLS
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- No direct user access - admin only via service_role

-- Update trigger
CREATE TRIGGER refund_requests_updated_at
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Coupons/Promotions Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT UNIQUE NOT NULL,
  description         TEXT,
  discount_type       TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value      INTEGER NOT NULL,
  min_order_cents     INTEGER DEFAULT 0,
  max_uses            INTEGER,
  used_count          INTEGER NOT NULL DEFAULT 0,
  valid_from          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until         TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code
  ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active
  ON coupons(is_active, valid_from, valid_until);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_public_read_active"
  ON coupons FOR SELECT
  USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

-- Track coupon usage per order
CREATE TABLE IF NOT EXISTS order_coupons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  coupon_id           UUID NOT NULL REFERENCES coupons(id) ON DELETE SET NULL,
  discount_cents      INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_coupons_order_id
  ON order_coupons(order_id);
CREATE INDEX IF NOT EXISTS idx_order_coupons_coupon_id
  ON order_coupons(coupon_id);

ALTER TABLE order_coupons ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Partial Fulfillment Tracking
-- ============================================================

-- Add fulfillment status to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_status TEXT
  DEFAULT 'pending'
  CHECK (fulfillment_status IN ('pending', 'processing', 'fulfilled', 'failed'));

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_error TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment_status
  ON order_items(fulfillment_status);

-- Add refunded amount to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0;

-- Add status 'refunded' to orders constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','fulfilling','fulfilled','failed','expired','refunded','partially_fulfilled'));

-- ============================================================
-- Coupon Usage Increment Function
-- ============================================================

CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;
