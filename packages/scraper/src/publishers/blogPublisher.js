const axios = require('axios');
const fs = require('fs').promises;
const CMSTransformer = require('./cmsTransformer');

class BlogPublisher {
  constructor() {
    this.cmsTransformer = new CMSTransformer();
    this.publishedArticles = new Set(); // Track already published articles
  }

  /**
   * Publish to WordPress site
   */
  async publishToWordPress(articles, config) {
    const {
      siteUrl,
      username,
      password, // Application password
      batchSize = 5
    } = config;

    const results = [];
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      for (const article of batch) {
        try {
          // Check if already published
          if (this.publishedArticles.has(article.guid || article.meta?.guid)) {
            console.log(`Skipping already published article: ${article.title}`);
            continue;
          }

          const response = await axios.post(
            `${siteUrl}/wp-json/wp/v2/posts`,
            article,
            {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log(`Published to WordPress: ${article.title}`);
          this.publishedArticles.add(article.guid || article.meta?.guid);
          
          results.push({
            success: true,
            article: article.title,
            id: response.data.id,
            url: response.data.link
          });

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error publishing ${article.title}:`, error.response?.data || error.message);
          results.push({
            success: false,
            article: article.title,
            error: error.response?.data?.message || error.message
          });
        }
      }
    }

    return {
      success: results.some(r => r.success),
      published: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Publish to Ghost CMS
   */
  async publishToGhost(articles, config) {
    const {
      adminApiUrl,
      adminApiKey,
      batchSize = 3
    } = config;

    const results = [];
    
    // Ghost Admin API requires JWT token
    const GhostAdminAPI = require('@tryghost/admin-api');
    const api = new GhostAdminAPI({
      url: adminApiUrl,
      key: adminApiKey,
      version: 'v5.0'
    });

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      for (const article of batch) {
        try {
          // Check if already published
          if (this.publishedArticles.has(article.custom_fields?.guid)) {
            console.log(`Skipping already published article: ${article.title}`);
            continue;
          }

          const response = await api.posts.add(article);
          
          console.log(`Published to Ghost: ${article.title}`);
          this.publishedArticles.add(article.custom_fields?.guid);
          
          results.push({
            success: true,
            article: article.title,
            id: response.id,
            url: response.url
          });

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`Error publishing ${article.title}:`, error.message);
          results.push({
            success: false,
            article: article.title,
            error: error.message
          });
        }
      }
    }

    return {
      success: results.some(r => r.success),
      published: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Export to static site files (Hugo, Jekyll, etc.)
   */
  async exportToStaticSite(articles, config) {
    const {
      outputDirectory,
      format = 'hugo',
      frontmatterFormat = 'yaml'
    } = config;

    const results = [];

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDirectory, { recursive: true });

      for (const article of articles) {
        try {
          const filename = article.filename || `${article.frontmatter?.title || 'untitled'}.md`;
          const filepath = `${outputDirectory}/${filename}`;

          let content = '';

          // Add frontmatter
          if (frontmatterFormat === 'yaml') {
            content += '---\n';
            Object.entries(article.frontmatter || {}).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                content += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
              } else if (typeof value === 'string') {
                content += `${key}: "${value}"\n`;
              } else {
                content += `${key}: ${value}\n`;
              }
            });
            content += '---\n\n';
          } else if (frontmatterFormat === 'toml') {
            content += '+++\n';
            Object.entries(article.frontmatter || {}).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                content += `${key} = [${value.map(v => `"${v}"`).join(', ')}]\n`;
              } else if (typeof value === 'string') {
                content += `${key} = "${value}"\n`;
              } else {
                content += `${key} = ${value}\n`;
              }
            });
            content += '+++\n\n';
          }

          // Add content
          content += article.content || '';

          await fs.writeFile(filepath, content);
          
          console.log(`Exported: ${filename}`);
          results.push({
            success: true,
            filename,
            filepath
          });

        } catch (error) {
          console.error(`Error exporting ${article.title}:`, error.message);
          results.push({
            success: false,
            article: article.title || 'Unknown',
            error: error.message
          });
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: []
      };
    }

    return {
      success: results.some(r => r.success),
      exported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Push via webhook to any CMS/service
   */
  async publishViaWebhook(articles, config) {
    const {
      webhookUrl,
      headers = {},
      method = 'POST',
      batchSize = 1
    } = config;

    const results = [];

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      try {
        const payload = batchSize === 1 ? batch[0] : batch;
        
        const response = await axios({
          method,
          url: webhookUrl,
          data: payload,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        });

        console.log(`Webhook published batch ${Math.floor(i / batchSize) + 1}`);
        results.push({
          success: true,
          batch: batch.map(a => a.title),
          status: response.status
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Webhook error for batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        results.push({
          success: false,
          batch: batch.map(a => a.title),
          error: error.response?.data || error.message
        });
      }
    }

    return {
      success: results.some(r => r.success),
      published: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Save to file system (JSON, XML, etc.)
   */
  async saveToFile(data, config) {
    const {
      filepath,
      format = 'json'
    } = config;

    try {
      let content;
      
      switch (format.toLowerCase()) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          break;
        case 'xml':
        case 'rss':
          content = data; // Assume data is already XML string
          break;
        default:
          content = data;
      }

      await fs.writeFile(filepath, content);
      
      console.log(`Saved to file: ${filepath}`);
      return {
        success: true,
        filepath,
        size: Buffer.byteLength(content, 'utf8')
      };

    } catch (error) {
      console.error(`Error saving to file:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Main publish method - handles different platforms
   */
  async publish(options = {}) {
    const {
      platform = 'wordpress', // wordpress, ghost, static, webhook, file
      articleOptions = {},
      publishConfig = {},
      dryRun = false
    } = options;

    try {
      console.log(`Starting publish process for platform: ${platform}`);
      
      // Get articles from database in the right format
      const articleResult = await this.cmsTransformer.getFormattedArticles({
        format: platform === 'ghost' ? 'ghost' : 
                platform === 'static' ? 'hugo' : 
                platform === 'webhook' ? 'generic' : 'wordpress',
        ...articleOptions
      });

      if (!articleResult.success || articleResult.articles.length === 0) {
        return {
          success: false,
          error: 'No articles to publish',
          articles: []
        };
      }

      console.log(`Found ${articleResult.articles.length} articles to publish`);

      if (dryRun) {
        console.log('DRY RUN - Would publish the following articles:');
        articleResult.articles.forEach(article => {
          console.log(`- ${article.title}`);
        });
        return {
          success: true,
          message: 'Dry run completed',
          articles: articleResult.articles.length
        };
      }

      // Publish based on platform
      let result;
      switch (platform.toLowerCase()) {
        case 'wordpress':
          result = await this.publishToWordPress(articleResult.articles, publishConfig);
          break;
        
        case 'ghost':
          result = await this.publishToGhost(articleResult.articles, publishConfig);
          break;
        
        case 'static':
          result = await this.exportToStaticSite(articleResult.articles, publishConfig);
          break;
        
        case 'webhook':
          result = await this.publishViaWebhook(articleResult.articles, publishConfig);
          break;
        
        case 'file':
          const fileData = publishConfig.format === 'rss' ? 
            await this.cmsTransformer.exportToRSS(articleOptions, publishConfig.feedInfo || {}) :
            await this.cmsTransformer.exportToJSON(articleOptions);
          
          if (fileData.success) {
            result = await this.saveToFile(fileData.data, publishConfig);
          } else {
            result = fileData;
          }
          break;
        
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      return {
        success: result.success,
        platform,
        ...result,
        metadata: articleResult.metadata
      };

    } catch (error) {
      console.error('Error in publish process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule automatic publishing
   */
  schedulePublishing(options = {}, cronExpression = '0 */6 * * *') {
    const cron = require('node-cron');
    
    console.log(`Scheduling automatic publishing with cron: ${cronExpression}`);
    
    cron.schedule(cronExpression, async () => {
      console.log('Scheduled publish triggered');
      const result = await this.publish(options);
      
      if (result.success) {
        console.log(`Successfully published ${result.published || result.exported || 0} articles`);
      } else {
        console.error('Scheduled publish failed:', result.error);
      }
    });
    
    console.log('Publishing scheduler started');
  }
}

module.exports = BlogPublisher;