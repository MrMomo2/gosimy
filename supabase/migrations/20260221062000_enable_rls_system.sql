-- ============================================================
-- Gosimy — Security Hardening (RLS for System Tables)
-- ============================================================

-- 1. Enable RLS on system tables
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 2. Add restrictive policies
-- We use USING (false) to explicitly deny all PostgREST access
-- service_role key will still bypass these policies

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rate_limits' AND policyname = 'rate_limits_service_only'
    ) THEN
        CREATE POLICY "rate_limits_service_only" ON public.rate_limits FOR ALL USING (false);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_events' AND policyname = 'webhook_events_service_only'
    ) THEN
        CREATE POLICY "webhook_events_service_only" ON public.webhook_events FOR ALL USING (false);
    END IF;
END $$;

-- 3. Ensure permissions are correct
GRANT ALL ON public.rate_limits TO service_role;
GRANT ALL ON public.webhook_events TO service_role;

-- Specifically revoke from public/authenticated to be safe (redundant with RLS but good practice)
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
