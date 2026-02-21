-- ============================================================
-- Gosimy — Security Hardening (Fixed Search Paths)
-- ============================================================

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix acquire_fulfillment_lock
CREATE OR REPLACE FUNCTION public.acquire_fulfillment_lock(order_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pg_try_advisory_xact_lock(
    ('x' || replace(order_id::text, '-', ''))::bit(64)::bigint
  );
END;
$$;

-- Fix cleanup_expired_tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM session_tokens WHERE expires_at < NOW();
END;
$$;

-- Fix cleanup_old_rate_limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Fix cleanup_old_webhook_events
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM webhook_events WHERE processed_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Fix update_daily_stats
CREATE OR REPLACE FUNCTION public.update_daily_stats()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO daily_stats (date, orders_count, orders_revenue, new_customers, esims_activated, refunds_count, refunds_amount, failed_orders)
    SELECT
        CURRENT_DATE,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('paid', 'fulfilled', 'fulfilling')),
        (SELECT COALESCE(SUM(amount_total), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status IN ('paid', 'fulfilled', 'fulfilling')),
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE),
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
$$;

-- Fix update_support_tickets_timestamp
CREATE OR REPLACE FUNCTION public.update_support_tickets_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Fix touch_ticket_on_message
CREATE OR REPLACE FUNCTION public.touch_ticket_on_message()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.support_tickets
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$;
