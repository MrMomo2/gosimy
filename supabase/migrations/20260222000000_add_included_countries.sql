-- Add included_countries column for regional/global packages
ALTER TABLE packages_cache 
ADD COLUMN IF NOT EXISTS included_countries TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_packages_included_countries 
ON packages_cache USING GIN (included_countries);
