const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async insertArticles(articles) {
    if (!articles || articles.length === 0) {
      console.log('No articles to insert');
      return { success: true, inserted: 0, skipped: 0 };
    }

    let inserted = 0;
    let skipped = 0;

    console.log(`Attempting to insert ${articles.length} articles...`);

    for (const article of articles) {
      try {
        const articleData = {
          title: article.title,
          link: article.link,
          snippet: article.snippet,
          summary_short: article.summaryShort,
          summary_long: article.summaryLong,
          original_snippet: article.originalSnippet,
          image_url: article.imageUrl,
          pub_date: new Date(article.pubDate).toISOString(),
          feed_title: article.feedTitle,
          feed_url: article.feedUrl,
          category: article.category,
          guid: article.guid
        };

        const { data, error } = await this.supabase
          .from('articles')
          .insert([articleData])
          .select();

        if (error) {
          if (error.code === '23505') {
            console.log(`Skipping duplicate article: ${article.title}`);
            skipped++;
          } else {
            console.error('Error inserting article:', error);
          }
        } else {
          console.log(`Inserted: ${article.title}`);
          inserted++;
        }
      } catch (error) {
        console.error('Error processing article:', error);
      }
    }

    return { success: true, inserted, skipped };
  }

  async insertFeeds(feeds) {
    if (!feeds || feeds.length === 0) {
      console.log('No feeds to insert');
      return { success: true, inserted: 0 };
    }

    console.log(`Inserting ${feeds.length} feeds...`);

    const feedData = feeds.map(feed => ({
      title: feed.title,
      xml_url: feed.xmlUrl,
      html_url: feed.htmlUrl,
      category: feed.category
    }));

    const { data, error } = await this.supabase
      .from('feeds')
      .upsert(feedData, { 
        onConflict: 'xml_url',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error inserting feeds:', error);
      return { success: false, error };
    }

    return { success: true, inserted: data.length };
  }

  async updateFeedLastFetched(xmlUrl) {
    const { error } = await this.supabase
      .from('feeds')
      .update({ last_fetched: new Date().toISOString() })
      .eq('xml_url', xmlUrl);

    if (error) {
      console.error('Error updating feed last_fetched:', error);
    }
  }

  async getTodaysArticles(limit = 100) {
    const { data, error } = await this.supabase
      .from('todays_articles')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching today\'s articles:', error);
      return { success: false, error };
    }

    return { success: true, articles: data };
  }

  async getArticlesByCategory(category, limit = 50) {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('category', category)
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching articles by category:', error);
      return { success: false, error };
    }

    return { success: true, articles: data };
  }

  async getArticleStats() {
    const { data, error } = await this.supabase
      .from('articles_by_category')
      .select('*');

    if (error) {
      console.error('Error fetching article stats:', error);
      return { success: false, error };
    }

    return { success: true, stats: data };
  }

  async getRecentArticles(days = 7, limit = 100) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .gte('pub_date', startDate.toISOString())
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent articles:', error);
      return { success: false, error };
    }

    return { success: true, articles: data };
  }
}

module.exports = Database;