const CuratorAgent = require('../src/services/curatorAgent');
const path = require('path');
// Load environment variables - works for both local development and Railway
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' ? '.env' : path.join(__dirname, '../../../.env') 
});

class CuratorTester {
  constructor() {
    this.curator = new CuratorAgent();
  }

  // Sample test articles with varying quality and relevance
  getSampleArticles() {
    return [
      {
        title: "Bitcoin Surges Past $70K as ETF Inflows Hit Record High",
        snippet: "Bitcoin price climbed above $70,000 for the first time in weeks as institutional inflows through spot ETFs reached unprecedented levels, signaling renewed institutional interest.",
        feedTitle: "CoinDesk",
        link: "https://example.com/bitcoin-etf-surge"
      },
      {
        title: "Ethereum Foundation Announces Major Protocol Upgrade",
        snippet: "The Ethereum Foundation revealed plans for a significant protocol upgrade that will improve transaction throughput and reduce gas fees across the network.",
        feedTitle: "Cointelegraph",
        link: "https://example.com/ethereum-upgrade"
      },
      {
        title: "Celebrity Chef Opens Restaurant That Accepts Crypto",
        snippet: "Famous celebrity chef Gordon Ramsay announced his new restaurant will accept various cryptocurrencies as payment, joining the growing trend of crypto adoption in hospitality.",
        feedTitle: "Food & Crypto Weekly",
        link: "https://example.com/celebrity-crypto-restaurant"
      },
      {
        title: "How to Store Your Private Keys Safely",
        snippet: "A comprehensive guide on best practices for storing your cryptocurrency private keys securely, including hardware wallets, paper wallets, and multi-signature setups.",
        feedTitle: "Crypto Tutorials",
        link: "https://example.com/private-keys-guide"
      },
      {
        title: "Major DeFi Protocol Suffers $50M Hack",
        snippet: "One of the largest DeFi lending protocols was exploited for approximately $50 million due to a smart contract vulnerability, causing significant market impact.",
        feedTitle: "The Block",
        link: "https://example.com/defi-hack-50m"
      },
      {
        title: "Apple Announces New iPhone Features",
        snippet: "Apple unveiled its latest iPhone lineup with improved camera capabilities, longer battery life, and enhanced performance, though no crypto-related features were mentioned.",
        feedTitle: "Tech News Daily",
        link: "https://example.com/iphone-announcement"
      },
      {
        title: "Crypto Influencer Promotes New Meme Coin",
        snippet: "Popular crypto influencer on social media is heavily promoting a new meme coin called 'ToTheMoon', promising followers massive returns with little fundamental analysis.",
        feedTitle: "Crypto Social",
        link: "https://example.com/meme-coin-promo"
      },
      {
        title: "Federal Reserve Hints at Digital Dollar Development",
        snippet: "In a recent speech, a Federal Reserve official suggested the central bank is actively researching the development of a central bank digital currency (CBDC) for the United States.",
        feedTitle: "Bitcoin Magazine",
        link: "https://example.com/fed-digital-dollar"
      }
    ];
  }

  async testIndividualCuration() {
    console.log('=== Testing Individual Article Curation ===\n');
    
    const articles = this.getSampleArticles();
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`Testing Article ${i + 1}: "${article.title}"`);
      console.log(`Snippet: "${article.snippet.substring(0, 100)}..."`);
      
      try {
        const result = await this.curator.curateArticle(article);
        console.log(`Result: ${result.decision} (Confidence: ${result.confidence}/10)`);
        console.log(`Reason: ${result.reason}`);
        console.log('---');
      } catch (error) {
        console.error(`Error curating article: ${error.message}`);
        console.log('---');
      }
    }
  }

  async testBatchCuration() {
    console.log('\n=== Testing Batch Curation ===\n');
    
    const articles = this.getSampleArticles();
    
    try {
      const result = await this.curator.curateMultipleArticles(articles, 500); // 500ms delay for testing
      
      console.log(`\nBatch Curation Results:`);
      console.log(`Total articles: ${result.stats.total}`);
      console.log(`Published: ${result.stats.published} (${result.stats.publishRate}%)`);
      console.log(`Scrapped: ${result.stats.scrapped}`);
      
      console.log(`\nPublishable Articles:`);
      result.publishableArticles.forEach((article, index) => {
        console.log(`${index + 1}. "${article.title.substring(0, 60)}..."`);
      });
      
      console.log(`\nScrapped Articles:`);
      result.scrappedArticles.forEach((item, index) => {
        console.log(`${index + 1}. "${item.article.title.substring(0, 60)}..." - ${item.reason}`);
      });
      
    } catch (error) {
      console.error(`Error during batch curation: ${error.message}`);
    }
  }

  async testCuratorStats() {
    console.log('\n=== Testing Curator Statistics ===\n');
    
    const articles = this.getSampleArticles();
    
    try {
      const result = await this.curator.curateMultipleArticles(articles, 100);
      const stats = this.curator.getCurationStats(result.curationResults);
      
      console.log('Curation Statistics:');
      console.log(`- Total articles processed: ${stats.total}`);
      console.log(`- Published: ${stats.published}`);
      console.log(`- Scrapped: ${stats.scrapped}`);
      console.log(`- Publish rate: ${stats.publishRate}%`);
      console.log(`- Average confidence: ${stats.avgConfidence}/10`);
      
    } catch (error) {
      console.error(`Error calculating stats: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Curator Agent Tests...\n');
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      process.exit(1);
    }
    
    console.log('✅ OpenAI API key found');
    console.log('✅ Curator Agent initialized\n');
    
    await this.testIndividualCuration();
    await this.testBatchCuration();
    await this.testCuratorStats();
    
    console.log('\n🎉 All curator tests completed!');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new CuratorTester();
  tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = CuratorTester;