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
