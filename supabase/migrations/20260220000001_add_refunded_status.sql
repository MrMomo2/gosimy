-- Add 'refunded' to the orders.status CHECK constraint
-- This aligns with the new charge.refunded webhook handler

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'paid', 'fulfilling', 'fulfilled',
    'partially_fulfilled', 'failed', 'expired', 'refunded'
  ));
