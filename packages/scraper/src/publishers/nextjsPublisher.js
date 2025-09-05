const Database = require('../services/database');
const fs = require('fs').promises;
const path = require('path');

class NextjsPublisher {
  constructor() {
    this.database = new Database();
    this.webDir = '../blog';
    this.blogDir = process.env.NEXTJS_BLOG_DIR || process.env.BLOG_DIR || '../blog/data/blog';
    this.publishedArticles = new Set();
  }

  /**
   * Generate URL-friendly slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80);
  }

  /**
   * Extract and format tags for Next.js blog
   */
  extractTags(article) {
    const tags = [];
    
    // Add category as primary tag
    if (article.category) {
      tags.push(article.category.toLowerCase().replace(/\s+/g, '-'));
    }
    
    // Extract crypto terms from title and snippet
    const content = `${article.title} ${article.snippet || ''}`.toLowerCase();
    const cryptoTerms = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
      'blockchain', 'defi', 'nft', 'altcoin', 'trading', 'mining',
      'solana', 'cardano', 'polkadot', 'chainlink', 'dogecoin',
      'binance', 'coinbase', 'regulation', 'adoption', 'web3',
      'metaverse', 'dao', 'stablecoin', 'yield', 'staking'
    ];
    
    cryptoTerms.forEach(term => {
      if (content.includes(term) && !tags.includes(term)) {
        tags.push(term);
      }
    });
    
    // Always include 'news' tag
    if (!tags.includes('news')) {
      tags.push('news');
    }
    
    return tags.slice(0, 6); // Limit to 6 tags
  }

  /**
   * Convert database article to Next.js MDX format
   */
  articleToMdx(article) {
    const slug = this.generateSlug(article.title);
    const tags = this.extractTags(article);
    const date = new Date(article.pub_date);
    const dateStr = date.toISOString().split('T')[0];
    
    // Clean title and summaries for YAML
    const cleanTitle = article.title.replace(/"/g, '\\"');
    const cleanSummary = (article.summary || article.snippet || '').replace(/"/g, '\\"').substring(0, 160);
    const cleanSummaryShort = (article.summary_short || '').replace(/"/g, '\\"').substring(0, 100);
    const cleanSummaryLong = (article.summary_long || '').replace(/"/g, '\\"').substring(0, 300);
    
    // Create frontmatter
    let frontmatter = '---\n';
    frontmatter += `title: "${cleanTitle}"\n`;
    frontmatter += `date: '${dateStr}'\n`;
    frontmatter += `tags: [${tags.map(tag => `'${tag}'`).join(', ')}]\n`;
    frontmatter += `draft: false\n`;
    frontmatter += `summary: "${cleanSummary}"\n`;
    
    // Add TLDR summaries if available
    if (cleanSummaryShort) {
      frontmatter += `summaryShort: "${cleanSummaryShort}"\n`;
    }
    if (cleanSummaryLong) {
      frontmatter += `summaryLong: "${cleanSummaryLong}"\n`;
    }
    
    if (article.image_url) {
      frontmatter += `images: ['${article.image_url}']\n`;
    }
    
    frontmatter += `authors: ['default']\n`;
    frontmatter += `layout: PostLayout\n`;
    frontmatter += `canonicalUrl: "${article.link}"\n`;
    frontmatter += '---\n\n';

    // Create content
    let content = '';
    
    // Add hero image if available
    if (article.image_url) {
      content += `![${cleanTitle}](${article.image_url})\n\n`;
    }
    
    // Add article content
    if (article.snippet) {
      content += `${article.snippet}\n\n`;
    }
    
    // Add source attribution
    content += `---\n\n`;
    content += `**Original Article:** [${article.feed_title}](${article.link})\n\n`;
    content += `*This article was originally published on [${article.feed_title}](${article.link}) and has been curated for our readers.*\n`;
    
    const filename = `${dateStr}-${slug}.mdx`;
    
    return {
      filename,
      content: frontmatter + content,
      slug,
      date: dateStr,
      title: article.title
    };
  }

  /**
   * Check if blog directory exists and create if needed
   */
  async ensureBlogDirectory() {
    try {
      await fs.access(this.blogDir);
    } catch {
      throw new Error(`Blog directory not found: ${this.blogDir}. Make sure the Next.js app is in the correct location.`);
    }
  }

  /**
   * Check if article already exists
   */
  async articleExists(filename) {
    try {
      await fs.access(path.join(this.blogDir, filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Publish articles to Next.js blog
   */
  async publishToNextjs(options = {}) {
    const {
      days = 1,
      limit = 10,
      category = null,
      onlyToday = true,
      skipExisting = true
    } = options;

    try {
      console.log('Starting Next.js blog publishing...');
      
      // Ensure blog directory exists
      await this.ensureBlogDirectory();
      
      // Get articles from database
      let articles;
      if (onlyToday) {
        const result = await this.database.getTodaysArticles(limit);
        articles = result.success ? result.articles : [];
      } else if (category) {
        const result = await this.database.getArticlesByCategory(category, limit);
        articles = result.success ? result.articles : [];
      } else {
        const result = await this.database.getRecentArticles(days, limit);
        articles = result.success ? result.articles : [];
      }

      if (articles.length === 0) {
        return {
          success: true,
          message: 'No articles found to publish',
          published: 0,
          skipped: 0,
          failed: 0
        };
      }

      // Ensure articles are sorted by publication date (newest first)
      articles.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));
      
      console.log(`Found ${articles.length} articles to process (sorted by date)`);

      const results = [];
      let published = 0;
      let skipped = 0;
      let failed = 0;

      for (const article of articles) {
        try {
          const mdxData = this.articleToMdx(article);
          const filepath = path.join(this.blogDir, mdxData.filename);

          // Check if article already exists
          if (skipExisting && await this.articleExists(mdxData.filename)) {
            console.log(`Skipping existing article: ${mdxData.filename}`);
            skipped++;
            results.push({
              success: true,
              skipped: true,
              filename: mdxData.filename,
              title: article.title
            });
            continue;
          }

          // Write MDX file
          await fs.writeFile(filepath, mdxData.content);
          
          published++;
          console.log(`Published: ${mdxData.filename}`);
          
          results.push({
            success: true,
            filename: mdxData.filename,
            filepath,
            title: article.title,
            date: mdxData.date,
            slug: mdxData.slug
          });

        } catch (error) {
          failed++;
          console.error(`Error publishing ${article.title}:`, error.message);
          results.push({
            success: false,
            title: article.title,
            error: error.message
          });
        }
      }

      console.log(`Publishing complete: ${published} published, ${skipped} skipped, ${failed} failed`);

      return {
        success: published > 0 || skipped > 0,
        published,
        skipped,
        failed,
        total: articles.length,
        results
      };

    } catch (error) {
      console.error('Error in Next.js publishing:', error);
      return {
        success: false,
        error: error.message,
        published: 0,
        skipped: 0,
        failed: 0
      };
    }
  }

  /**
   * Get preview of articles that would be published
   */
  async getPublishPreview(options = {}) {
    const {
      days = 1,
      limit = 10,
      category = null,
      onlyToday = true
    } = options;

    try {
      // Get articles from database
      let articles;
      if (onlyToday) {
        const result = await this.database.getTodaysArticles(limit);
        articles = result.success ? result.articles : [];
      } else if (category) {
        const result = await this.database.getArticlesByCategory(category, limit);
        articles = result.success ? result.articles : [];
      } else {
        const result = await this.database.getRecentArticles(days, limit);
        articles = result.success ? result.articles : [];
      }

      const preview = [];
      for (const article of articles) {
        const mdxData = this.articleToMdx(article);
        const exists = await this.articleExists(mdxData.filename);
        
        preview.push({
          title: article.title,
          filename: mdxData.filename,
          date: mdxData.date,
          tags: this.extractTags(article),
          source: article.feed_title,
          exists,
          wouldSkip: exists
        });
      }

      return {
        success: true,
        articles: preview,
        total: preview.length,
        existing: preview.filter(a => a.exists).length,
        new: preview.filter(a => !a.exists).length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        articles: []
      };
    }
  }

  /**
   * Clean up old published articles (optional maintenance)
   */
  async cleanupOldArticles(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.blogDir);
      const mdxFiles = files.filter(f => f.endsWith('.mdx'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      let deleted = 0;
      
      for (const file of mdxFiles) {
        // Extract date from filename (assuming YYYY-MM-DD-title.mdx format)
        const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(this.blogDir, file));
            console.log(`Deleted old article: ${file}`);
            deleted++;
          }
        }
      }
      
      return {
        success: true,
        deleted,
        message: `Cleaned up ${deleted} old articles`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        deleted: 0
      };
    }
  }
}

module.exports = NextjsPublisher;
