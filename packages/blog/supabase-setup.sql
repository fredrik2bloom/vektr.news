-- Temperature voting system tables for Supabase
-- Run these SQL commands in your Supabase SQL editor

-- Table to store article temperature data
CREATE TABLE article_temperatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id TEXT NOT NULL UNIQUE,
    temperature DECIMAL DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store individual votes
CREATE TABLE article_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    vote_value INTEGER NOT NULL CHECK (vote_value IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, voter_id)
);

-- Table for rate limiting
CREATE TABLE rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_article_votes_article_id ON article_votes(article_id);
CREATE INDEX idx_article_votes_voter_id ON article_votes(voter_id);
CREATE INDEX idx_rate_limits_ip_created ON rate_limits(ip_address, created_at);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_article_temperatures_updated_at
    BEFORE UPDATE ON article_temperatures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle voting with atomic operations
CREATE OR REPLACE FUNCTION vote_on_article(
    p_article_id TEXT,
    p_voter_id TEXT,
    p_vote_value INTEGER
)
RETURNS TABLE(temperature DECIMAL, vote_count INTEGER) AS $$
BEGIN
    -- Insert the vote (will fail if user already voted due to unique constraint)
    INSERT INTO article_votes (article_id, voter_id, vote_value)
    VALUES (p_article_id, p_voter_id, p_vote_value);
    
    -- Update or insert article temperature
    INSERT INTO article_temperatures (article_id, temperature, vote_count)
    VALUES (p_article_id, p_vote_value, 1)
    ON CONFLICT (article_id)
    DO UPDATE SET
        temperature = article_temperatures.temperature + p_vote_value,
        vote_count = article_temperatures.vote_count + 1,
        updated_at = NOW();
    
    -- Return the updated values
    RETURN QUERY
    SELECT at.temperature, at.vote_count
    FROM article_temperatures at
    WHERE at.article_id = p_article_id;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies - Optional for additional security
ALTER TABLE article_temperatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (used by API)
-- These policies allow read access for all users and write access for authenticated API calls
CREATE POLICY "Allow public read on article_temperatures" ON article_temperatures FOR SELECT USING (true);
CREATE POLICY "Allow public read on article_votes" ON article_votes FOR SELECT USING (true);

-- Cleanup old rate limit entries (run this periodically via cron job or manually)
-- DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';