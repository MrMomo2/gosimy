-- ============================================================
-- Gosimy — Add missing columns to orders
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_ip_created
  ON orders(ip_address, created_at)
  WHERE ip_address IS NOT NULL;
