-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  snippet TEXT,
  original_snippet TEXT,
  image_url TEXT,
  pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
  feed_title TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  category TEXT,
  guid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on guid to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS articles_guid_unique ON articles(guid) WHERE guid IS NOT NULL;

-- Create unique constraint on link as fallback
CREATE UNIQUE INDEX IF NOT EXISTS articles_link_unique ON articles(link) WHERE guid IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS articles_pub_date_idx ON articles(pub_date DESC);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category);
CREATE INDEX IF NOT EXISTS articles_feed_title_idx ON articles(feed_title);
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON articles(created_at DESC);

-- Create feeds table to track feed metadata
CREATE TABLE IF NOT EXISTS feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  xml_url TEXT UNIQUE NOT NULL,
  html_url TEXT,
  category TEXT,
  last_fetched TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_articles_updated_at 
  BEFORE UPDATE ON articles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for today's articles
CREATE OR REPLACE VIEW todays_articles AS
SELECT 
  id,
  title,
  link,
  snippet,
  image_url,
  pub_date,
  feed_title,
  category,
  created_at
FROM articles 
WHERE DATE(pub_date) = CURRENT_DATE
ORDER BY pub_date DESC;

-- Create view for articles by category
CREATE OR REPLACE VIEW articles_by_category AS
SELECT 
  category,
  COUNT(*) as article_count,
  MAX(pub_date) as latest_article
FROM articles 
GROUP BY category
ORDER BY article_count DESC;