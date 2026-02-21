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
