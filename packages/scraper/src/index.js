const cron = require('node-cron');
const fs = require('fs');
const OPMLParser = require('./utils/opmlParser');
const FeedFetcher = require('./services/feedFetcher');
const Database = require('./services/database');
const OpenAIService = require('./services/openaiService');
const FirecrawlService = require('./services/firecrawlService');
const CuratorAgent = require('./services/curatorAgent');
const MarkdownExporter = require('./publishers/markdownExporter');
const NextjsPublisher = require('./publishers/nextjsPublisher');
// Load environment variables - works for both local development and Railway
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' ? '.env' : '../../.env' 
});

class CryptoFeedAggregator {
  constructor() {
    this.opmlParser = new OPMLParser('./config/RAW.opml');
    this.feedFetcher = new FeedFetcher();
    this.database = new Database();
    this.openaiService = new OpenAIService();
    this.firecrawlService = new FirecrawlService();
    this.curatorAgent = new CuratorAgent();
    this.markdownExporter = new MarkdownExporter();
    this.nextjsPublisher = new NextjsPublisher();
    this.isRunning = false;
    // Configuration options
    this.enableCuration = process.env.ENABLE_CURATION !== 'false'; // Default to enabled
    this.curationBatchDelay = parseInt(process.env.CURATION_BATCH_DELAY) || 200;
  }

  loadFeedsFromJSON() {
    try {
      const data = fs.readFileSync('./config/crypto-feeds.json', 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading JSON feeds file:', error);
      throw error;
    }
  }

  async initialize() {
    try {
      console.log('Initializing Crypto Feed Aggregator...');
      
      const feeds = this.loadFeedsFromJSON();
      console.log(`Loaded ${feeds.length} feeds from JSON file`);
      
      const result = await this.database.insertFeeds(feeds);
      if (result.success) {
        console.log(`Initialized ${result.inserted} feeds in database`);
      }
      
      return true;
    } catch (error) {
      console.error('Error during initialization:', error);
      return false;
    }
  }

  async fetchAndStoreArticles() {
    if (this.isRunning) {
      console.log('Feed fetching already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('\n=== Starting feed fetch process ===');
      console.log(`Started at: ${new Date().toISOString()}`);
      
      const feeds = this.loadFeedsFromJSON();
      console.log(`Fetching from ${feeds.length} feeds...`);
      
      const feedResults = await this.feedFetcher.fetchAllFeeds(feeds, 3);
      console.log(`Successfully fetched ${feedResults.length} feeds`);
      
      const todaysArticles = this.feedFetcher.filterTodaysArticles(feedResults);
      console.log(`Found ${todaysArticles.length} articles from today`);
      
      if (todaysArticles.length > 0) {
        let articlesToInsert = todaysArticles;
        
        try {
          console.log('\n=== Enhanced Content Processing Pipeline ===');
          
          // Step 0: Curator filtering (NEW)
          let curatedArticles = todaysArticles;
          
          if (this.enableCuration) {
            console.log('Step 0: Curating articles with AI agent...');
            const curationResult = await this.curatorAgent.curateMultipleArticles(todaysArticles, this.curationBatchDelay);
            curatedArticles = curationResult.publishableArticles;
            
            console.log(`Curation completed: ${curatedArticles.length}/${todaysArticles.length} articles approved for publishing`);
            console.log(`Saved ${todaysArticles.length - curatedArticles.length} articles from expensive processing`);
          } else {
            console.log('Step 0: Curation disabled - processing all articles');
          }
          
          if (curatedArticles.length === 0) {
            console.log('No articles passed curation - skipping processing pipeline');
            articlesToInsert = [];
          } else {
            // Step 1: Scrape full articles with Firecrawl (only for curated articles)
            console.log('Step 1: Scraping full article content with Firecrawl...');
            const scrapedArticles = await this.firecrawlService.scrapeMultipleArticles(
              curatedArticles.filter(article => this.firecrawlService.isScrapeable(article.link))
            );
          
          const successfulScrapes = scrapedArticles.filter(article => article.scrapedContent?.success).length;
          console.log(`Successfully scraped ${successfulScrapes}/${scrapedArticles.length} articles`);
          
          // Step 2: Generate TLDRs using full content + OpenAI
          console.log('Step 2: Generating TLDRs from full article content...');
          articlesToInsert = await this.openaiService.generateTLDRForMultipleArticles(scrapedArticles);
          
          const fullContentTLDRs = articlesToInsert.filter(article => article.usedFullContent).length;
          console.log(`Generated ${fullContentTLDRs} TLDRs from full content, ${articlesToInsert.length - fullContentTLDRs} from RSS snippets`);
          
            console.log('Successfully completed enhanced content processing');
          }
          
        } catch (error) {
          console.error('Error during enhanced content processing:', error.message);
          console.log('Falling back to original RSS snippet processing...');
          
          // Re-run curation if enabled and not done yet
          let articlesForFallback = todaysArticles;
          if (this.enableCuration) {
            try {
              const curationResult = await this.curatorAgent.curateMultipleArticles(todaysArticles, this.curationBatchDelay);
              articlesForFallback = curationResult.publishableArticles;
              console.log(`Fallback curation: ${articlesForFallback.length}/${todaysArticles.length} articles approved`);
            } catch (curationError) {
              console.error('Curation also failed in fallback, using all articles:', curationError.message);
            }
          } else {
            console.log('Curation disabled - using all articles for fallback');
          }
          
          try {
            articlesToInsert = await this.openaiService.rewriteMultipleSnippets(articlesForFallback);
            console.log('Fallback snippet rewriting completed');
          } catch (fallbackError) {
            console.error('Fallback processing also failed:', fallbackError.message);
            articlesToInsert = articlesForFallback.map(article => ({
              ...article,
              originalSnippet: article.snippet
            }));
          }
        }
        
        const result = await this.database.insertArticles(articlesToInsert);
        console.log(`Inserted: ${result.inserted}, Skipped: ${result.skipped} articles`);
      }
      
      for (const { feedInfo } of feedResults) {
        await this.database.updateFeedLastFetched(feedInfo.xmlUrl);
      }
      
      // Auto-publish to Next.js blog if we have new articles
      if (todaysArticles.length > 0) {
        try {
          console.log('\n=== Publishing to Next.js blog ===');
          const publishResult = await this.publishToNextjs({ onlyToday: true, limit: 10 });
          if (publishResult.success) {
            console.log(`Published ${publishResult.published} articles to Next.js blog`);
          }
        } catch (error) {
          console.error('Error auto-publishing to Next.js:', error.message);
        }
      }
      
      console.log(`=== Feed fetch completed at: ${new Date().toISOString()} ===\n`);
      
    } catch (error) {
      console.error('Error in fetchAndStoreArticles:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async getTodaysArticles() {
    try {
      const result = await this.database.getTodaysArticles();
      if (result.success) {
        console.log(`Retrieved ${result.articles.length} articles from today`);
        return result.articles;
      } else {
        console.error('Error retrieving today\'s articles:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error in getTodaysArticles:', error);
      return [];
    }
  }

  async getArticleStats() {
    try {
      const result = await this.database.getArticleStats();
      if (result.success) {
        console.log('Article statistics by category:');
        result.stats.forEach(stat => {
          console.log(`${stat.category}: ${stat.article_count} articles`);
        });
        return result.stats;
      } else {
        console.error('Error retrieving article stats:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error in getArticleStats:', error);
      return [];
    }
  }

  /**
   * Export articles to markdown files
   */
  async exportToMarkdown(options = {}) {
    try {
      console.log('Exporting articles to markdown...');
      const result = await this.markdownExporter.exportToMarkdown(options);
      
      if (result.success) {
        console.log(`Successfully exported ${result.exported} articles to markdown`);
        console.log(`Files saved in: ${result.outputDir}`);
        if (result.failed > 0) {
          console.log(`Failed to export ${result.failed} articles`);
        }
      } else {
        console.error('Markdown export failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error in exportToMarkdown:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get articles as markdown data (without writing files)
   */
  async getMarkdownData(options = {}) {
    try {
      const result = await this.markdownExporter.getMarkdownData(options);
      if (result.success) {
        console.log(`Retrieved ${result.articles.length} articles as markdown data`);
        return result;
      } else {
        console.error('Error getting markdown data:', result.error);
        return { success: false, articles: [] };
      }
    } catch (error) {
      console.error('Error in getMarkdownData:', error);
      return { success: false, articles: [] };
    }
  }

  /**
   * Publish articles to Next.js blog
   */
  async publishToNextjs(options = {}) {
    try {
      console.log('Publishing articles to Next.js blog...');
      const result = await this.nextjsPublisher.publishToNextjs(options);
      
      if (result.success) {
        console.log(`Successfully published to Next.js: ${result.published} new, ${result.skipped} skipped`);
        if (result.failed > 0) {
          console.log(`Failed to publish ${result.failed} articles`);
        }
      } else {
        console.error('Next.js publishing failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error in publishToNextjs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Preview articles that would be published to Next.js
   */
  async previewNextjsPublishing(options = {}) {
    try {
      const result = await this.nextjsPublisher.getPublishPreview(options);
      
      if (result.success) {
        console.log(`\n=== Next.js Publishing Preview ===`);
        console.log(`Total articles: ${result.total}`);
        console.log(`New articles: ${result.new}`);
        console.log(`Existing articles: ${result.existing}`);
        
        if (result.articles.length > 0) {
          console.log('\nArticles to publish:');
          result.articles.forEach(article => {
            const status = article.exists ? '[EXISTS]' : '[NEW]';
            console.log(`${status} ${article.filename} - ${article.title.substring(0, 50)}...`);
          });
        }
      } else {
        console.error('Error getting Next.js preview:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error in previewNextjsPublishing:', error);
      return { success: false, error: error.message };
    }
  }

  startScheduler() {
    console.log('Starting scheduled feed fetching...');
    
    cron.schedule('0 */6 * * *', () => {
      console.log('Scheduled feed fetch triggered');
      this.fetchAndStoreArticles();
    });
    
    console.log('Scheduler started - feeds will be fetched every 6 hours');
  }

  async runOnce() {
    const initialized = await this.initialize();
    if (!initialized) {
      console.error('Failed to initialize, exiting...');
      process.exit(1);
    }
    
    await this.fetchAndStoreArticles();
    
    const articles = await this.getTodaysArticles();
    console.log(`\n=== Today's Articles Summary ===`);
    console.log(`Total articles: ${articles.length}`);
    
    const stats = await this.getArticleStats();
    console.log(`\n=== Article Statistics ===`);
    
    process.exit(0);
  }

  async start() {
    const initialized = await this.initialize();
    if (!initialized) {
      console.error('Failed to initialize, exiting...');
      process.exit(1);
    }
    
    await this.fetchAndStoreArticles();
    
    this.startScheduler();
    
    // Start health check server for Railway
    this.startHealthCheckServer();
    
    console.log('Crypto Feed Aggregator is running...');
    console.log('Press Ctrl+C to stop');
  }

  /**
   * Start a simple HTTP server for Railway health checks
   */
  startHealthCheckServer() {
    const http = require('http');
    const PORT = process.env.PORT || 3000;
    
    const server = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'crypto-feed-scraper',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          isRunning: !this.isRunning ? 'idle' : 'processing'
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });
    
    server.listen(PORT, () => {
      console.log(`Health check server running on port ${PORT}`);
    });
    
    return server;
  }
}

if (require.main === module) {
  const aggregator = new CryptoFeedAggregator();
  
  const args = process.argv.slice(2);
  if (args.includes('--once')) {
    aggregator.runOnce();
  } else {
    aggregator.start();
  }
}

module.exports = CryptoFeedAggregator;