-- ============================================================
-- Enterprise Admin Features
-- - Role-based access control
-- - 2FA support
-- - Enhanced audit logging
-- - Alert configurations
-- ============================================================

-- ── Admin Roles ───────────────────────────────────────────────
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'finance', 'support');

CREATE TABLE IF NOT EXISTS admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL UNIQUE,
    role            admin_role NOT NULL DEFAULT 'support',
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret TEXT,
    backup_codes    TEXT[],
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT admin_users_user_id_unique UNIQUE (user_id)
);

-- ── Admin Audit Log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_email     TEXT NOT NULL,
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     TEXT,
    details         JSONB DEFAULT '{}',
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Alert Configurations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    alert_type      TEXT NOT NULL CHECK (alert_type IN ('order_failed', 'high_volume', 'low_balance', 'refund_requested', 'payment_failed')),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    channels        TEXT[] NOT NULL DEFAULT ARRAY['email'],
    threshold       INTEGER,
    email_recipients TEXT[],
    slack_webhook   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Alert History ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_config_id UUID REFERENCES alert_configs(id) ON DELETE CASCADE,
    alert_type      TEXT NOT NULL,
    message         TEXT NOT NULL,
    channels_sent   TEXT[] NOT NULL,
    success         BOOLEAN NOT NULL DEFAULT TRUE,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Daily Stats (Materialized for performance) ────────────────
CREATE TABLE IF NOT EXISTS daily_stats (
    date            DATE PRIMARY KEY,
    orders_count    INTEGER NOT NULL DEFAULT 0,
    orders_revenue  INTEGER NOT NULL DEFAULT 0,
    new_customers   INTEGER NOT NULL DEFAULT 0,
    esims_activated INTEGER NOT NULL DEFAULT 0,
    refunds_count   INTEGER NOT NULL DEFAULT 0,
    refunds_amount  INTEGER NOT NULL DEFAULT 0,
    failed_orders   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON admin_audit_log(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);

-- ── RLS Policies ───────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Only service_role can access admin tables (bypassed via admin client)
CREATE POLICY "admin_users_service_only" ON admin_users FOR ALL USING (false);
CREATE POLICY "admin_audit_service_only" ON admin_audit_log FOR ALL USING (false);
CREATE POLICY "alert_configs_service_only" ON alert_configs FOR ALL USING (false);
CREATE POLICY "alert_history_service_only" ON alert_history FOR ALL USING (false);
CREATE POLICY "daily_stats_service_only" ON daily_stats FOR ALL USING (false);

-- ── Function to update daily stats ─────────────────────────────
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
BEGIN
    INSERT INTO daily_stats (date, orders_count, orders_revenue, new_customers, esims_activated, refunds_count, refunds_amount, failed_orders)
    SELECT
        CURRENT_DATE,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('paid', 'fulfilled', 'fulfilling')),
        (SELECT COALESCE(SUM(amount_total), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('paid', 'fulfilled', 'fulfilling')),
        (SELECT COUNT(*) FROM customers WHERE DATE(created_at) = CURRENT_DATE),
        (SELECT COUNT(*) FROM esims WHERE DATE(created_at) = CURRENT_DATE AND status = 'active'),
        (SELECT COUNT(*) FROM refund_requests WHERE DATE(processed_at) = CURRENT_DATE AND status = 'processed'),
        (SELECT COALESCE(SUM(amount_cents), 0) FROM refund_requests WHERE DATE(processed_at) = CURRENT_DATE AND status = 'processed'),
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status = 'failed')
    ON CONFLICT (date) DO UPDATE SET
        orders_count = EXCLUDED.orders_count,
        orders_revenue = EXCLUDED.orders_revenue,
        new_customers = EXCLUDED.new_customers,
        esims_activated = EXCLUDED.esims_activated,
        refunds_count = EXCLUDED.refunds_count,
        refunds_amount = EXCLUDED.refunds_amount,
        failed_orders = EXCLUDED.failed_orders;
END;
$$ LANGUAGE plpgsql;

-- ── Seed default alert configs ────────────────────────────────
INSERT INTO alert_configs (name, alert_type, channels, email_recipients) VALUES
    ('Order Failed', 'order_failed', ARRAY['email'], ARRAY[]::TEXT[]),
    ('Low Provider Balance', 'low_balance', ARRAY['email'], ARRAY[]::TEXT[]),
    ('Refund Requested', 'refund_requested', ARRAY['email'], ARRAY[]::TEXT[])
ON CONFLICT DO NOTHING;

-- ── Grant permissions ──────────────────────────────────────────
GRANT ALL ON admin_users TO service_role;
GRANT ALL ON admin_audit_log TO service_role;
GRANT ALL ON alert_configs TO service_role;
GRANT ALL ON alert_history TO service_role;
GRANT ALL ON daily_stats TO service_role;
