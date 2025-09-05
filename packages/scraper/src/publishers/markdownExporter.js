const Database = require('../services/database');
const fs = require('fs').promises;
const path = require('path');

class MarkdownExporter {
  constructor() {
    this.database = new Database();
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
   * Convert article to markdown format
   */
  articleToMarkdown(article) {
    const slug = this.generateSlug(article.title);
    const tags = this.extractTags(article);
    const date = new Date(article.pub_date);
    
    // YAML frontmatter
    let frontmatter = '---\n';
    frontmatter += `title: "${article.title}"\n`;
    frontmatter += `date: ${date.toISOString()}\n`;
    frontmatter += `slug: "${slug}"\n`;
    frontmatter += `category: "${article.category || 'crypto'}"\n`;
    frontmatter += `tags: [${tags.map(tag => `"${tag}"`).join(', ')}]\n`;
    frontmatter += `source: "${article.feed_title}"\n`;
    frontmatter += `source_url: "${article.link}"\n`;
    if (article.image_url) {
      frontmatter += `image: "${article.image_url}"\n`;
    }
    frontmatter += `excerpt: "${(article.snippet || '').replace(/"/g, '\\"').substring(0, 200)}"\n`;
    frontmatter += `draft: false\n`;
    frontmatter += '---\n\n';

    // Content
    let content = '';
    
    if (article.image_url) {
      content += `![${article.title}](${article.image_url})\n\n`;
    }
    
    content += `${article.snippet || ''}\n\n`;
    content += `**Source:** [${article.feed_title}](${article.link})\n\n`;
    content += `[Read Full Article →](${article.link})\n`;

    return {
      filename: `${date.toISOString().split('T')[0]}-${slug}.md`,
      content: frontmatter + content,
      frontmatter: {
        title: article.title,
        date: date.toISOString(),
        slug: slug,
        category: article.category || 'crypto',
        tags: tags,
        source: article.feed_title,
        source_url: article.link,
        image: article.image_url || null,
        excerpt: article.snippet || ''
      }
    };
  }

  /**
   * Export articles to markdown files
   */
  async exportToMarkdown(options = {}) {
    const {
      outputDir = './markdown-exports',
      days = 7,
      limit = 100,
      category = null,
      onlyToday = false
    } = options;

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

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
          message: 'No articles found to export',
          exported: 0,
          files: []
        };
      }

      console.log(`Converting ${articles.length} articles to markdown...`);

      const results = [];
      const exportedFiles = [];

      for (const article of articles) {
        try {
          const markdown = this.articleToMarkdown(article);
          const filepath = path.join(outputDir, markdown.filename);

          await fs.writeFile(filepath, markdown.content);
          
          console.log(`Exported: ${markdown.filename}`);
          
          results.push({
            success: true,
            filename: markdown.filename,
            filepath: filepath,
            title: article.title
          });
          
          exportedFiles.push({
            filename: markdown.filename,
            filepath: filepath,
            title: article.title,
            date: article.pub_date,
            category: article.category
          });

        } catch (error) {
          console.error(`Error exporting ${article.title}:`, error.message);
          results.push({
            success: false,
            title: article.title,
            error: error.message
          });
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Create index file
      await this.createIndexFile(outputDir, exportedFiles);

      return {
        success: successful.length > 0,
        exported: successful.length,
        failed: failed.length,
        outputDir: outputDir,
        files: exportedFiles,
        results: results
      };

    } catch (error) {
      console.error('Error in markdown export:', error);
      return {
        success: false,
        error: error.message,
        exported: 0,
        files: []
      };
    }
  }

  /**
   * Create an index file listing all exported articles
   */
  async createIndexFile(outputDir, files) {
    try {
      let indexContent = '# Crypto Articles Export\n\n';
      indexContent += `Generated: ${new Date().toISOString()}\n`;
      indexContent += `Total articles: ${files.length}\n\n`;

      // Group by date
      const groupedByDate = files.reduce((groups, file) => {
        const date = new Date(file.date).toISOString().split('T')[0];
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(file);
        return groups;
      }, {});

      // Sort dates descending
      const sortedDates = Object.keys(groupedByDate).sort().reverse();

      for (const date of sortedDates) {
        indexContent += `## ${date}\n\n`;
        
        for (const file of groupedByDate[date]) {
          indexContent += `- [${file.title}](./${file.filename})`;
          if (file.category) {
            indexContent += ` (${file.category})`;
          }
          indexContent += '\n';
        }
        indexContent += '\n';
      }

      await fs.writeFile(path.join(outputDir, 'README.md'), indexContent);
      console.log('Created index file: README.md');

    } catch (error) {
      console.error('Error creating index file:', error);
    }
  }

  /**
   * Get articles and return as markdown data (without writing files)
   */
  async getMarkdownData(options = {}) {
    const {
      days = 7,
      limit = 100,
      category = null,
      onlyToday = false
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

      const markdownArticles = articles.map(article => this.articleToMarkdown(article));

      return {
        success: true,
        articles: markdownArticles,
        metadata: {
          total: markdownArticles.length,
          generated_at: new Date().toISOString(),
          options: options
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        articles: []
      };
    }
  }
}

module.exports = MarkdownExporter;