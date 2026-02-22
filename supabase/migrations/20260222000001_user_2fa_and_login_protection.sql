-- User 2FA: Add columns for customer 2FA
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret text;

-- Login attempts table for brute-force protection
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding recent attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created 
ON login_attempts(email, created_at DESC);

-- Function to check if account should be locked
CREATE OR REPLACE FUNCTION should_lock_account(email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    failed_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO failed_count
    FROM login_attempts
    WHERE email = email
      AND success = false
      AND created_at > NOW() - INTERVAL '15 minutes';
    
    RETURN failed_count >= 10;
END;
$$ LANGUAGE plpgsql;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
    p_email TEXT,
    p_ip_address INET,
    p_user_agent TEXT,
    p_success BOOLEAN
) RETURNS VOID AS $$
BEGIN
    INSERT INTO login_attempts (email, ip_address, user_agent, success)
    VALUES (p_email, p_ip_address, p_user_agent, p_success);
END;
$$ LANGUAGE plpgsql;

-- RLS for login_attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow insert (tracking)
CREATE POLICY "Allow insert login attempts"
ON login_attempts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow admin to read
CREATE POLICY "Allow admin read login attempts"
ON login_attempts FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
