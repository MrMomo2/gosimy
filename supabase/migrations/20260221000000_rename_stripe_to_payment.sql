-- ============================================================
-- Rename Stripe columns to generic payment columns
-- Gosimy now uses Dodo Payments exclusively
-- ============================================================

-- Rename columns in orders table
ALTER TABLE orders RENAME COLUMN stripe_session_id TO payment_session_id;
ALTER TABLE orders RENAME COLUMN stripe_payment_intent TO payment_intent_id;
ALTER TABLE orders RENAME COLUMN stripe_invoice_id TO payment_invoice_id;

-- Drop old indexes
DROP INDEX IF EXISTS idx_orders_stripe_session;
DROP INDEX IF EXISTS idx_orders_stripe_payment_intent;

-- Create new indexes with updated names
CREATE INDEX IF NOT EXISTS idx_orders_payment_session_id
  ON orders(payment_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id
  ON orders(payment_intent_id);

-- Rename column in refund_requests table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refund_requests' 
        AND column_name = 'stripe_refund_id'
    ) THEN
        ALTER TABLE refund_requests RENAME COLUMN stripe_refund_id TO payment_refund_id;
    END IF;
END $$;
