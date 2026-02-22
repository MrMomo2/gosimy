-- Add period_num column to order_items for daily plans
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS period_num INTEGER;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_period_num ON order_items(period_num) WHERE period_num IS NOT NULL;
