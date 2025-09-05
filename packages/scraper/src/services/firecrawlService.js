const FirecrawlApp = require('@mendable/firecrawl-js').default;
require('dotenv').config();

class FirecrawlService {
  constructor() {
    this.app = new FirecrawlApp({ 
      apiKey: process.env.FIRECRAWL_API_KEY 
    });
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async scrapeArticle(url, options = {}) {
    const defaultOptions = {
      formats: ['markdown'],
      onlyMainContent: true,
      includeTags: ['h1', 'h2', 'h3', 'p', 'article'],
      excludeTags: ['nav', 'footer', 'header', 'aside', 'script'],
      timeout: 10000,
      ...options
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Scraping article (attempt ${attempt}/${this.maxRetries}): ${url.substring(0, 60)}...`);

        const scrapeResult = await this.app.scrapeUrl(url, defaultOptions);
        
        if (scrapeResult.success && scrapeResult.data?.markdown) {
          const markdown = scrapeResult.data.markdown;
          const wordCount = markdown.split(/\s+/).length;
          
          console.log(`Successfully scraped article: ${wordCount} words`);
          
          return {
            success: true,
            markdown: markdown,
            title: scrapeResult.data.title || '',
            wordCount: wordCount,
            url: url
          };
        } else {
          console.warn(`Firecrawl returned unsuccessful result for ${url}:`, scrapeResult);
          
          if (attempt === this.maxRetries) {
            return {
              success: false,
              error: 'Failed to scrape content after retries',
              url: url
            };
          }
        }
      } catch (error) {
        console.error(`Error scraping ${url} (attempt ${attempt}):`, error.message);
        
        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: error.message,
            url: url
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  async scrapeMultipleArticles(articles, batchDelay = 500) {
    const scrapedArticles = [];
    
    console.log(`Starting to scrape ${articles.length} articles...`);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      try {
        const scrapedContent = await this.scrapeArticle(article.link);
        
        scrapedArticles.push({
          ...article,
          scrapedContent: scrapedContent
        });
        
        console.log(`Progress: ${i + 1}/${articles.length} articles scraped`);
        
        // Delay between requests to be respectful
        if (i < articles.length - 1 && batchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
        
      } catch (error) {
        console.error(`Error processing article "${article.title}":`, error.message);
        scrapedArticles.push({
          ...article,
          scrapedContent: {
            success: false,
            error: error.message,
            url: article.link
          }
        });
      }
    }
    
    console.log(`Completed scraping ${scrapedArticles.length} articles`);
    return scrapedArticles;
  }

  // Helper method to clean up markdown for OpenAI processing
  cleanMarkdownForAI(markdown) {
    if (!markdown) return '';
    
    return markdown
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      // Remove markdown links but keep text: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown images: ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove markdown headers formatting but keep text
      .replace(/#{1,6}\s+/g, '')
      // Remove excessive dashes/underscores
      .replace(/[-_]{3,}/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Check if URL is likely to be scrapeable
  isScrapeable(url) {
    const unscrapablePatterns = [
      /youtube\.com/i,
      /twitter\.com/i,
      /x\.com/i,
      /facebook\.com/i,
      /instagram\.com/i,
      /linkedin\.com/i,
      /tiktok\.com/i,
      /\.pdf$/i,
      /\.zip$/i,
      /\.exe$/i
    ];
    
    return !unscrapablePatterns.some(pattern => pattern.test(url));
  }
}

module.exports = FirecrawlService;