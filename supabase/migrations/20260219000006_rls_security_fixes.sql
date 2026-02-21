-- ============================================================
-- Gosimy — RLS & Security Fixes (Live DB Compatible)
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. Enable RLS on tables without RLS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE package_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_package_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_package_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_location_children ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- 2. Add RLS policies for carts (users manage their own cart)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "carts_select_own" ON carts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "carts_insert_own" ON carts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "carts_update_own" ON carts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "carts_delete_own" ON carts FOR DELETE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 3. Add RLS policies for coupons (public read active coupons)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "coupons_public_read_active" ON coupons FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- ═══════════════════════════════════════════════════════════════
-- 4. Add RLS policies for support tables
-- ═══════════════════════════════════════════════════════════════

-- support_tickets: Users can manage their own tickets
CREATE POLICY "support_tickets_select_own" ON support_tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "support_tickets_insert_own" ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_tickets_update_own" ON support_tickets FOR UPDATE
  USING (user_id = auth.uid());

-- support_messages: Users can read/insert messages for their tickets
CREATE POLICY "support_messages_select_own" ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "support_messages_insert_own" ON support_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 5. Add RLS policies for fulfillment_log (admin only)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "fulfillment_log_admin_read" ON fulfillment_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 6. Add RLS policies for provider tables (read-only for public)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "package_coverage_public_read" ON package_coverage FOR SELECT
  USING (true);

CREATE POLICY "provider_locations_public_read" ON provider_locations FOR SELECT
  USING (true);

CREATE POLICY "provider_location_children_public_read" ON provider_location_children FOR SELECT
  USING (true);

CREATE POLICY "provider_package_raw_public_read" ON provider_package_raw FOR SELECT
  USING (true);

CREATE POLICY "provider_package_change_log_public_read" ON provider_package_change_log FOR SELECT
  USING (true);

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
