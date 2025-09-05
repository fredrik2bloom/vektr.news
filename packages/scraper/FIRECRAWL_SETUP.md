# Firecrawl Integration Setup

## Overview
The scraper now uses Firecrawl to scrape full article content from RSS feed URLs, then generates high-quality TLDRs using OpenAI from the complete article text instead of just RSS snippets.

## Setup Steps

### 1. Install Dependencies
```bash
cd packages/scraper
npm install
```

### 2. Get Firecrawl API Key
1. Sign up at [firecrawl.dev](https://firecrawl.dev)
2. Get your API key from the dashboard

### 3. Add Environment Variable
Add to your `.env` file in the project root:
```bash
FIRECRAWL_API_KEY=your_api_key_here
```

### 4. Database Migration
Make sure you've run the database migration to add the new summary fields:
```sql
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS summary_short TEXT,
ADD COLUMN IF NOT EXISTS summary_long TEXT,
ADD COLUMN IF NOT EXISTS original_snippet TEXT;
```

## How It Works

### Enhanced Pipeline:
1. **RSS Fetching** → Gets article URLs and basic info from RSS feeds
2. **Firecrawl Scraping** → Scrapes full article content as markdown
3. **OpenAI TLDR Generation** → Creates 3 summary lengths from full content:
   - SHORT (80-100 chars) - for compact cards
   - MEDIUM (150-200 chars) - for standard previews  
   - LONG (250-300 chars) - for hero articles
4. **Database Storage** → Stores only the TLDRs (not full content)

### Fallback Behavior:
- If Firecrawl fails → Falls back to RSS snippet processing
- If OpenAI fails → Falls back to original RSS snippets
- Unsupported URLs (YouTube, social media, etc.) → Skipped from scraping

### Benefits:
- **Better Summaries** → AI has full context instead of truncated RSS snippets
- **Relevant Information** → Key details won't be lost to truncation
- **Context-Appropriate** → Different summary lengths for different display areas
- **Cost Efficient** → Only stores summaries, not full content

## Usage
Run the scraper as usual:
```bash
npm run once    # Single run
npm start       # Continuous with scheduler
```

The enhanced processing will happen automatically for new articles.