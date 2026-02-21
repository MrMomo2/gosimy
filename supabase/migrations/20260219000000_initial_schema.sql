-- ============================================================
-- Gosimy — Initial Database Schema
-- Generated: 2026-02-19
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id    TEXT UNIQUE,
  stripe_payment_intent TEXT,
  stripe_invoice_id    TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','paid','fulfilling','fulfilled','failed','expired')),
  currency             TEXT NOT NULL DEFAULT 'usd',
  amount_total         INTEGER NOT NULL DEFAULT 0,       -- in currency cents
  guest_email          TEXT,
  locale               TEXT NOT NULL DEFAULT 'en',       -- e.g. 'en','de','fr','es'
  ip_address           TEXT,                             -- for guest rate limiting
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── order_items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'esim_access',
  package_code      TEXT NOT NULL,
  package_name      TEXT NOT NULL,
  country_code      TEXT NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1,
  unit_price_cents  INTEGER NOT NULL,                    -- in USD cents
  volume_bytes      TEXT NOT NULL,                       -- BigInt as string
  duration_days     INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── esims ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS esims (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id     UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider          TEXT NOT NULL DEFAULT 'esim_access',
  provider_order_no TEXT,
  esim_tran_no      TEXT,
  iccid             TEXT UNIQUE,
  qr_code_url       TEXT,
  activation_code   TEXT,
  smdp_status       TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','provisioning','active','exhausted','expired','cancelled','failed')),
  data_used_bytes   BIGINT,
  data_total_bytes  BIGINT,
  expires_at        TIMESTAMPTZ,
  last_queried_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── packages_cache ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages_cache (
  package_code       TEXT PRIMARY KEY,
  provider           TEXT NOT NULL DEFAULT 'esim_access',
  name               TEXT NOT NULL,
  country_code       TEXT NOT NULL,
  country_name       TEXT NOT NULL,
  region             TEXT,
  price_usd          NUMERIC(10,4) NOT NULL,             -- wholesale USD from provider
  retail_price_cents INTEGER NOT NULL,                   -- USD cents with markup
  volume_bytes       TEXT NOT NULL,                      -- BigInt as string
  duration_days      INTEGER NOT NULL,
  data_type          INTEGER NOT NULL DEFAULT 1,         -- 1=fixed, 2=daily
  network_list       JSONB,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  cached_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── fulfillment_log ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fulfillment_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'started'
                   CHECK (status IN ('started','success','failed')),
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Performance Indexes
-- ============================================================

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status
  ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session
  ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent
  ON orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_ip_created
  ON orders(ip_address, created_at)
  WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_package_code
  ON order_items(package_code);

-- esims
CREATE INDEX IF NOT EXISTS idx_esims_user_id
  ON esims(user_id);
CREATE INDEX IF NOT EXISTS idx_esims_order_item_id
  ON esims(order_item_id);
CREATE INDEX IF NOT EXISTS idx_esims_provider_order_no
  ON esims(provider_order_no);
CREATE INDEX IF NOT EXISTS idx_esims_iccid
  ON esims(iccid);
CREATE INDEX IF NOT EXISTS idx_esims_status
  ON esims(status);

-- packages_cache
CREATE INDEX IF NOT EXISTS idx_packages_cache_country_active
  ON packages_cache(country_code, is_active);
CREATE INDEX IF NOT EXISTS idx_packages_cache_region_active
  ON packages_cache(region, is_active);
CREATE INDEX IF NOT EXISTS idx_packages_cache_cached_at
  ON packages_cache(cached_at);

-- fulfillment_log
CREATE INDEX IF NOT EXISTS idx_fulfillment_log_order_status
  ON fulfillment_log(order_id, status);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE esims           ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_log ENABLE ROW LEVEL SECURITY;

-- ── orders policies ──────────────────────────────────────────
-- Authenticated users can only read/insert their own orders.
-- Admin (service_role) bypasses RLS for fulfillment & webhooks.

CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ── order_items policies ─────────────────────────────────────
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── esims policies ───────────────────────────────────────────
CREATE POLICY "esims_select_own"
  ON esims FOR SELECT
  USING (auth.uid() = user_id);

-- ── packages_cache policies ──────────────────────────────────
-- Public read — package listings are not sensitive.
CREATE POLICY "packages_cache_public_read"
  ON packages_cache FOR SELECT
  USING (true);

-- ── fulfillment_log policies ─────────────────────────────────
-- No direct user access — service_role only (bypasses RLS).
-- Admins can query via service_role key.

-- ============================================================
-- Utility: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER esims_updated_at
  BEFORE UPDATE ON esims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER fulfillment_log_updated_at
  BEFORE UPDATE ON fulfillment_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
