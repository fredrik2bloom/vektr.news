-- Migration: Add summary fields for different display contexts
-- Run this against your Supabase database

-- Add new summary columns to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS summary_short TEXT,
ADD COLUMN IF NOT EXISTS summary_long TEXT,
ADD COLUMN IF NOT EXISTS original_snippet TEXT;

-- Drop and recreate the view to include the new fields
DROP VIEW IF EXISTS todays_articles;

CREATE VIEW todays_articles AS
SELECT 
  id,
  title,
  link,
  snippet,
  summary_short,
  summary_long,
  original_snippet,
  image_url,
  pub_date,
  feed_title,
  category,
  created_at
FROM articles 
WHERE DATE(pub_date) = CURRENT_DATE
ORDER BY pub_date DESC;

-- Add comments to document the columns
COMMENT ON COLUMN articles.snippet IS 'Medium-length summary (150-200 chars) - backward compatible';
COMMENT ON COLUMN articles.summary_short IS 'Short summary for compact cards (80-100 chars)';
COMMENT ON COLUMN articles.summary_long IS 'Long summary for hero/featured articles (250-300 chars)';
COMMENT ON COLUMN articles.original_snippet IS 'Original unprocessed snippet from RSS feed';

-- Optional: Add indexes if you plan to query by summary content
-- CREATE INDEX IF NOT EXISTS articles_summary_short_idx ON articles USING gin(to_tsvector('english', summary_short));
-- CREATE INDEX IF NOT EXISTS articles_summary_long_idx ON articles USING gin(to_tsvector('english', summary_long));