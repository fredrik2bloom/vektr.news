# Crypto Feed Aggregator

A Node.js backend service that fetches crypto-related RSS feeds from the provided OPML file, extracts articles published on the same day, and stores them in a Supabase database for easy publishing to websites/newsfeeds.

## Features

- 📰 Parses OPML files to extract RSS feed URLs
- 🔄 Fetches articles from multiple RSS feeds in batches
- 📅 Filters articles to only include those published today
- 🖼️ Extracts article images when available
- 🗄️ Stores articles in Supabase with proper indexing
- ⏰ Scheduled fetching every 6 hours
- 📊 Provides statistics and analytics
- 🔁 Handles duplicates and errors gracefully

## Database Schema

The application creates the following tables in Supabase:

- **articles**: Main table storing article data (title, link, snippet, image, etc.)
- **feeds**: Metadata about RSS feeds
- **todays_articles**: View for easy access to today's articles
- **articles_by_category**: View providing article statistics by category

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- Supabase account and project

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Create a new project in [Supabase](https://supabase.com)
2. Go to Settings → API to get your project URL and keys
3. In the SQL editor, run the schema from `supabase.sql`

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Run the Application

#### One-time fetch (for testing):
```bash
npm run dev -- --once
```

#### Continuous mode with scheduled fetching:
```bash
npm start
```

## Usage

### Running the Service

The application can be run in two modes:

1. **One-time execution**: Fetches articles once and exits
   ```bash
   node index.js --once
   ```

2. **Continuous mode**: Fetches articles every 6 hours
   ```bash
   node index.js
   ```

### API Integration

The service stores articles in Supabase, making them easily accessible for web applications:

```javascript
// Example: Fetch today's articles
const { data: articles } = await supabase
  .from('todays_articles')
  .select('*')
  .limit(50);
```

### Article Data Structure

Each article stored in the database contains:

```json
{
  "id": "uuid",
  "title": "Article Title",
  "link": "https://example.com/article",
  "snippet": "Article preview text...",
  "image_url": "https://example.com/image.jpg",
  "pub_date": "2024-01-15T10:30:00Z",
  "feed_title": "Source Feed Name",
  "feed_url": "https://example.com/rss",
  "category": "Project Updates",
  "guid": "unique-article-id",
  "created_at": "2024-01-15T10:35:00Z"
}
```

## Configuration

### Batch Processing

- Feeds are processed in batches of 3 to avoid overwhelming servers
- 1-second delay between batches
- 3 retry attempts for failed feeds
- 10-second timeout per feed request

### Scheduling

- Default: Every 6 hours
- Configurable via cron expression in `index.js`
- Only processes articles published on the current day

## Error Handling

- Graceful handling of failed feed requests
- Duplicate article prevention via GUID/link uniqueness
- Comprehensive logging of all operations
- Retry mechanism for transient failures

## Development

### File Structure

```
crypto-feed/
├── index.js              # Main application
├── opmlParser.js          # OPML file parser
├── feedFetcher.js         # RSS feed fetching logic
├── database.js            # Supabase database operations
├── supabase.sql          # Database schema
├── package.json          # Dependencies
├── .env.example          # Environment template
└── RAW.opml             # Feed sources
```

### Adding New Features

The modular structure makes it easy to extend:

- **New parsers**: Add to `feedFetcher.js`
- **Database operations**: Extend `database.js`
- **Scheduling**: Modify cron expressions in `index.js`

## Monitoring

The application provides detailed console logging for:

- Feed parsing progress
- Article extraction statistics
- Database operation results
- Error reporting and retry attempts

## License

MIT License