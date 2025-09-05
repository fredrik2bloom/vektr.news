const Parser = require('rss-parser');
const axios = require('axios');

class FeedFetcher {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        feed: ['language', 'copyright'],
        item: ['media:content', 'media:thumbnail', 'enclosure']
      }
    });
  }

  async fetchFeed(feedUrl, retries = 3) {
    try {
      console.log(`Fetching feed: ${feedUrl}`);
      const feed = await this.parser.parseURL(feedUrl);
      return feed;
    } catch (error) {
      console.error(`Error fetching feed ${feedUrl}:`, error.message);
      
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.fetchFeed(feedUrl, retries - 1);
      }
      
      return null;
    }
  }

  async fetchAllFeeds(feeds, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < feeds.length; i += batchSize) {
      const batch = feeds.slice(i, i + batchSize);
      const batchPromises = batch.map(feed => this.fetchFeed(feed.xmlUrl));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push({
              feedInfo: batch[index],
              feedData: result.value
            });
          }
        });
        
        console.log(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(feeds.length / batchSize)}`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error processing batch:', error);
      }
    }
    
    return results;
  }

  extractImageFromItem(item) {
    let imageUrl = null;

    if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
      const mediaContent = item['media:content'];
      if (Array.isArray(mediaContent)) {
        imageUrl = mediaContent.find(m => m['$'] && m['$'].medium === 'image')?.['$']?.url;
      } else if (mediaContent['$'] && mediaContent['$'].medium === 'image') {
        imageUrl = mediaContent['$'].url;
      }
    }

    if (!imageUrl && item['media:thumbnail'] && item['media:thumbnail']['$']) {
      imageUrl = item['media:thumbnail']['$'].url;
    }

    if (!imageUrl && item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
      imageUrl = item.enclosure.url;
    }

    if (!imageUrl && item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    if (!imageUrl && item.contentSnippet) {
      const imgMatch = item.contentSnippet.match(/\bhttps?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)\b/i);
      if (imgMatch) {
        imageUrl = imgMatch[0];
      }
    }

    return imageUrl;
  }

  filterTodaysArticles(feedResults) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todaysArticles = [];

    feedResults.forEach(({ feedInfo, feedData }) => {
      if (!feedData || !feedData.items) return;

      const filteredItems = feedData.items.filter(item => {
        if (!item.pubDate) return false;
        
        const pubDate = new Date(item.pubDate);
        return pubDate >= todayStart && pubDate < todayEnd;
      });

      filteredItems.forEach(item => {
        const snippet = item.contentSnippet || item.content || '';
        const cleanSnippet = snippet.replace(/<[^>]*>/g, '').substring(0, 300);

        todaysArticles.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          snippet: cleanSnippet,
          imageUrl: this.extractImageFromItem(item),
          feedTitle: feedData.title,
          feedUrl: feedInfo.xmlUrl,
          category: feedInfo.category,
          guid: item.guid || item.link
        });
      });
    });

    return todaysArticles;
  }
}

module.exports = FeedFetcher;