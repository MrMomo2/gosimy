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


-- ============================================================
-- Gosimy — User Roles & Security Enhancements
-- ============================================================

-- User roles table for RBAC
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ── Advisory Lock Function for Fulfillment ───────────────────────────
-- Prevents race conditions during fulfillment
CREATE OR REPLACE FUNCTION acquire_fulfillment_lock(order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Try to acquire an advisory lock for this order
  -- Returns true if lock acquired, false if already locked
  RETURN pg_try_advisory_xact_lock(
    ('x' || replace(order_id::text, '-', ''))::bit(64)::bigint
  );
END;
$$ LANGUAGE plpgsql;

-- ── Session tokens table for CSRF protection ─────────────────────────
CREATE TABLE IF NOT EXISTS session_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  token_type  TEXT NOT NULL DEFAULT 'csrf'
              CHECK (token_type IN ('csrf', 'api_key')),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_tokens_user ON session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(token);
CREATE INDEX IF NOT EXISTS idx_session_tokens_expires ON session_tokens(expires_at);

ALTER TABLE session_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_tokens_own"
  ON session_tokens FOR ALL
  USING (auth.uid() = user_id);

-- ── Cleanup expired tokens (run periodically) ────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM session_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ── Update trigger for user_roles ────────────────────────────────────
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- Gosimy — Rate Limiting Table
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL,
  identifier  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_identifier 
  ON rate_limits(key, identifier, created_at);

-- Cleanup old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- Gosimy — Webhook Idempotency
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL,
  event_id    TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event 
  ON webhook_events(provider, event_id);

-- Cleanup old webhook events (keep 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_events WHERE processed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- Gosimy — Package Type Enhancements
-- ============================================================

ALTER TABLE packages_cache 
ADD COLUMN IF NOT EXISTS is_multi_country BOOLEAN DEFAULT FALSE;

-- Update existing packages
UPDATE packages_cache 
SET is_multi_country = TRUE 
WHERE country_code LIKE '%-%' OR country_code IN ('EU', 'X1', 'X2', 'X3', 'X4', 'OC', 'XG');

CREATE INDEX IF NOT EXISTS idx_packages_cache_multi_country 
  ON packages_cache(is_multi_country);


-- ============================================================
-- Gosimy — RLS & Security Fixes (Live DB Compatible)
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 7. Fix functions with search_path
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void 
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- Gosimy — Add missing columns to orders
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_ip_created
  ON orders(ip_address, created_at)
  WHERE ip_address IS NOT NULL;


-- Add 'refunded' to the orders.status CHECK constraint
-- This aligns with the new charge.refunded webhook handler

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'paid', 'fulfilling', 'fulfilled',
    'partially_fulfilled', 'failed', 'expired', 'refunded'
  ));


