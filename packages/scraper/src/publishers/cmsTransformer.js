const Database = require('../services/database');

class CMSTransformer {
  constructor() {
    this.database = new Database();
  }

  /**
   * Transform articles for CMS format (WordPress, Ghost, etc.)
   */
  transformForCMS(articles, format = 'wordpress') {
    switch (format.toLowerCase()) {
      case 'wordpress':
        return this.transformForWordPress(articles);
      case 'ghost':
        return this.transformForGhost(articles);
      case 'markdown':
        return this.transformForMarkdown(articles);
      case 'hugo':
        return this.transformForHugo(articles);
      default:
        return this.transformForGeneric(articles);
    }
  }

  /**
   * Transform articles for WordPress format
   */
  transformForWordPress(articles) {
    return articles.map(article => ({
      title: article.title,
      content: this.formatContentForWordPress(article),
      excerpt: article.snippet || '',
      status: 'publish',
      date: article.pub_date,
      categories: [article.category || 'Crypto'],
      tags: this.extractTags(article),
      featured_media: article.image_url || null,
      meta: {
        source_url: article.link,
        feed_title: article.feed_title,
        original_pub_date: article.pub_date,
        guid: article.guid
      }
    }));
  }

  /**
   * Transform articles for Ghost CMS format
   */
  transformForGhost(articles) {
    return articles.map(article => ({
      title: article.title,
      html: this.formatContentForGhost(article),
      excerpt: article.snippet || '',
      status: 'published',
      published_at: article.pub_date,
      tags: this.extractTagsForGhost(article),
      feature_image: article.image_url || null,
      custom_excerpt: article.snippet?.substring(0, 300) || '',
      meta_title: article.title,
      meta_description: article.snippet?.substring(0, 160) || '',
      slug: this.generateSlug(article.title),
      custom_fields: {
        source_url: article.link,
        feed_title: article.feed_title,
        category: article.category,
        guid: article.guid
      }
    }));
  }

  /**
   * Transform articles for Markdown format
   */
  transformForMarkdown(articles) {
    return articles.map(article => ({
      filename: `${this.generateSlug(article.title)}.md`,
      content: this.formatContentForMarkdown(article),
      frontmatter: {
        title: article.title,
        date: article.pub_date,
        category: article.category || 'crypto',
        tags: this.extractTags(article),
        source_url: article.link,
        feed_title: article.feed_title,
        image: article.image_url || null,
        excerpt: article.snippet || ''
      }
    }));
  }

  /**
   * Transform articles for Hugo format
   */
  transformForHugo(articles) {
    return articles.map(article => ({
      filename: `${this.generateSlug(article.title)}.md`,
      content: this.formatContentForHugo(article),
      frontmatter: {
        title: article.title,
        date: article.pub_date,
        categories: [article.category || 'crypto'],
        tags: this.extractTags(article),
        draft: false,
        featured_image: article.image_url || '',
        source_url: article.link,
        feed_source: article.feed_title,
        summary: article.snippet || ''
      }
    }));
  }

  /**
   * Generic transformation format
   */
  transformForGeneric(articles) {
    return articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.snippet,
      url: article.link,
      published_date: article.pub_date,
      category: article.category,
      source: article.feed_title,
      image: article.image_url,
      tags: this.extractTags(article),
      slug: this.generateSlug(article.title)
    }));
  }

  /**
   * Format content for WordPress
   */
  formatContentForWordPress(article) {
    let content = '';
    
    if (article.image_url) {
      content += `<img src="${article.image_url}" alt="${article.title}" class="wp-post-image" />\n\n`;
    }
    
    content += `<p>${article.snippet || ''}</p>\n\n`;
    content += `<p><strong>Source:</strong> <a href="${article.link}" target="_blank" rel="noopener">${article.feed_title}</a></p>\n`;
    content += `<p><a href="${article.link}" class="read-more-btn" target="_blank" rel="noopener">Read Full Article →</a></p>`;
    
    return content;
  }

  /**
   * Format content for Ghost
   */
  formatContentForGhost(article) {
    let html = '';
    
    if (article.image_url) {
      html += `<figure><img src="${article.image_url}" alt="${article.title}"></figure>\n\n`;
    }
    
    html += `<p>${article.snippet || ''}</p>\n\n`;
    html += `<p><strong>Source:</strong> <a href="${article.link}" target="_blank" rel="noopener">${article.feed_title}</a></p>\n`;
    html += `<p><a href="${article.link}" class="kg-btn kg-btn-accent" target="_blank" rel="noopener">Read Full Article</a></p>`;
    
    return html;
  }

  /**
   * Format content for Markdown
   */
  formatContentForMarkdown(article) {
    let content = '';
    
    if (article.image_url) {
      content += `![${article.title}](${article.image_url})\n\n`;
    }
    
    content += `${article.snippet || ''}\n\n`;
    content += `**Source:** [${article.feed_title}](${article.link})\n\n`;
    content += `[Read Full Article →](${article.link})\n`;
    
    return content;
  }

  /**
   * Format content for Hugo
   */
  formatContentForHugo(article) {
    let content = '';
    
    content += `${article.snippet || ''}\n\n`;
    content += `**Source:** [${article.feed_title}](${article.link})\n\n`;
    content += `{{< button href="${article.link}" target="_blank" >}}\nRead Full Article →\n{{< /button >}}\n`;
    
    return content;
  }

  /**
   * Extract tags from article content
   */
  extractTags(article) {
    const tags = [];
    
    // Add category as a tag
    if (article.category) {
      tags.push(article.category.toLowerCase());
    }
    
    // Extract common crypto terms from title and snippet
    const content = `${article.title} ${article.snippet || ''}`.toLowerCase();
    const cryptoTerms = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 
      'defi', 'nft', 'altcoin', 'trading', 'mining', 'wallet',
      'solana', 'cardano', 'polkadot', 'chainlink', 'dogecoin',
      'binance', 'coinbase', 'regulation', 'adoption', 'price'
    ];
    
    cryptoTerms.forEach(term => {
      if (content.includes(term) && !tags.includes(term)) {
        tags.push(term);
      }
    });
    
    return tags.slice(0, 8); // Limit to 8 tags
  }

  /**
   * Extract tags for Ghost format
   */
  extractTagsForGhost(article) {
    const tags = this.extractTags(article);
    return tags.map(tag => ({ name: tag }));
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
      .trim('-')
      .substring(0, 100);
  }

  /**
   * Get articles formatted for CMS
   */
  async getFormattedArticles(options = {}) {
    const {
      days = 7,
      limit = 50,
      category = null,
      format = 'wordpress',
      onlyToday = false
    } = options;

    try {
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

      return {
        success: true,
        articles: this.transformForCMS(articles, format),
        metadata: {
          total_articles: articles.length,
          format: format,
          generated_at: new Date().toISOString(),
          options: options
        }
      };
    } catch (error) {
      console.error('Error getting formatted articles:', error);
      return {
        success: false,
        error: error.message,
        articles: []
      };
    }
  }

  /**
   * Generate RSS feed from articles
   */
  generateRSSFeed(articles, feedInfo = {}) {
    const {
      title = 'Crypto Feed Aggregator',
      description = 'Latest cryptocurrency news and articles',
      link = 'https://example.com',
      language = 'en-us'
    } = feedInfo;

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${title}</title>
  <description>${description}</description>
  <link>${link}</link>
  <language>${language}</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${link}/feed.xml" rel="self" type="application/rss+xml" />
`;

    articles.forEach(article => {
      rss += `
  <item>
    <title><![CDATA[${article.title}]]></title>
    <link>${article.link}</link>
    <description><![CDATA[${article.snippet || ''}]]></description>
    <pubDate>${new Date(article.pub_date).toUTCString()}</pubDate>
    <guid>${article.guid || article.link}</guid>
    <category>${article.category || 'Crypto'}</category>
    ${article.image_url ? `<enclosure url="${article.image_url}" type="image/jpeg" />` : ''}
  </item>`;
    });

    rss += `
</channel>
</rss>`;

    return rss;
  }

  /**
   * Export articles to JSON format
   */
  async exportToJSON(options = {}) {
    const result = await this.getFormattedArticles(options);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: JSON.stringify(result, null, 2),
      filename: `crypto-articles-${new Date().toISOString().split('T')[0]}.json`
    };
  }

  /**
   * Export articles to RSS format
   */
  async exportToRSS(options = {}, feedInfo = {}) {
    const {
      days = 7,
      limit = 50,
      category = null
    } = options;

    try {
      let articles;
      
      if (category) {
        const result = await this.database.getArticlesByCategory(category, limit);
        articles = result.success ? result.articles : [];
      } else {
        const result = await this.database.getRecentArticles(days, limit);
        articles = result.success ? result.articles : [];
      }

      const rssContent = this.generateRSSFeed(articles, feedInfo);
      
      return {
        success: true,
        data: rssContent,
        filename: `crypto-feed-${new Date().toISOString().split('T')[0]}.xml`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CMSTransformer;