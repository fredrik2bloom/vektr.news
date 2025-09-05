const fs = require('fs');
const xml2js = require('xml2js');

class OPMLParser {
  constructor(opmlFilePath) {
    this.opmlFilePath = opmlFilePath;
    this.feeds = [];
  }

  async parseOPML() {
    try {
      const data = fs.readFileSync(this.opmlFilePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(data);
      
      this.extractFeeds(result.opml.body[0].outline);
      return this.feeds;
    } catch (error) {
      console.error('Error parsing OPML:', error);
      throw error;
    }
  }

  extractFeeds(outlines) {
    if (!outlines) return;

    outlines.forEach(outline => {
      const attrs = outline.$;
      
      if (attrs && attrs.xmlUrl) {
        this.feeds.push({
          title: attrs.title || attrs.text,
          xmlUrl: attrs.xmlUrl,
          htmlUrl: attrs.htmlUrl,
          type: attrs.type,
          category: this.getCurrentCategory(outline)
        });
      }
      
      if (outline.outline) {
        this.extractFeeds(outline.outline);
      }
    });
  }

  getCurrentCategory(outline) {
    return outline.$.text || outline.$.title || 'Uncategorized';
  }

  getFeeds() {
    return this.feeds;
  }

  getFeedsByCategory() {
    const categorized = {};
    this.feeds.forEach(feed => {
      const category = feed.category || 'Uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(feed);
    });
    return categorized;
  }
}

module.exports = OPMLParser;