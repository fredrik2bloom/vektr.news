const OpenAI = require('openai');
require('dotenv').config();

class CuratorAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.curatorPrompt = `You are an extremely selective crypto news curator. You ONLY publish MAJOR events that significantly impact the crypto industry. Be very strict - aim to publish only 5-10% of articles.

PUBLISH ONLY if article contains:
- Major regulatory decisions/government announcements (SEC approvals, country bans/adoptions)
- Significant protocol launches or major upgrades (mainnet launches, hard forks)
- Large-scale hacks/exploits ($10M+) or major security breaches
- Major institutional adoption (Fortune 500 companies, sovereign funds)
- Breaking: Major price movements with clear catalysts (>10% moves with news)
- Critical infrastructure developments (major exchange launches/closures)
- Groundbreaking technological breakthroughs

SCRAP everything else including:
- Daily price analysis or minor price movements
- Regular DeFi protocol updates or small partnerships  
- Minor corporate crypto adoption stories
- Standard market commentary or opinion pieces
- Routine protocol updates or minor improvements
- Small hacks/exploits (<$10M)
- Celebrity involvement or social media drama
- Tutorials, guides, or educational content
- Repetitive news or minor regulatory updates
- Speculation or unconfirmed rumors

STRICT CRITERIA: Only publish if the news would be front-page worthy and significantly impact crypto markets or adoption.

Article to evaluate:
Title: {title}
Snippet: {snippet}
Source: {source}

Respond in this exact format:
DECISION: PUBLISH or SCRAP
CONFIDENCE: [1-10]
REASON: [Brief explanation of your decision]`;
  }

  async curateArticle(article) {
    try {
      if (!article.title || !article.snippet) {
        console.warn('Missing title or snippet for curation, defaulting to SCRAP');
        return {
          decision: 'SCRAP',
          confidence: 10,
          reason: 'Missing essential content (title or snippet)',
          article: article
        };
      }

      const prompt = this.curatorPrompt
        .replace('{title}', article.title)
        .replace('{snippet}', article.snippet || '')
        .replace('{source}', article.feedTitle || 'Unknown');

      console.log(`Curating article: "${article.title.substring(0, 50)}..."`);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.1, // Low temperature for consistent decisions
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        console.warn('OpenAI returned empty response for curation, defaulting to PUBLISH');
        return {
          decision: 'PUBLISH',
          confidence: 5,
          reason: 'Curator failed - defaulting to publish',
          article: article
        };
      }

      const curationResult = this.parseCurationResponse(response);
      
      console.log(`Curation result: ${curationResult.decision} (confidence: ${curationResult.confidence}) - ${curationResult.reason}`);
      
      return {
        ...curationResult,
        article: article
      };
      
    } catch (error) {
      console.error('Error during article curation:', error.message);
      // Default to PUBLISH on errors to avoid losing potentially good content
      return {
        decision: 'PUBLISH',
        confidence: 5,
        reason: 'Curator error - defaulting to publish for safety',
        article: article
      };
    }
  }

  parseCurationResponse(response) {
    try {
      const lines = response.split('\n').filter(line => line.trim());
      
      let decision = 'PUBLISH'; // Default to publish
      let confidence = 5;
      let reason = 'Unable to parse curator response';
      
      for (const line of lines) {
        if (line.startsWith('DECISION:')) {
          const decisionMatch = line.match(/DECISION:\s*(PUBLISH|SCRAP)/i);
          if (decisionMatch) {
            decision = decisionMatch[1].toUpperCase();
          }
        } else if (line.startsWith('CONFIDENCE:')) {
          const confidenceMatch = line.match(/CONFIDENCE:\s*(\d+)/);
          if (confidenceMatch) {
            confidence = Math.min(10, Math.max(1, parseInt(confidenceMatch[1])));
          }
        } else if (line.startsWith('REASON:')) {
          reason = line.replace('REASON:', '').trim();
        }
      }
      
      return { decision, confidence, reason };
      
    } catch (error) {
      console.error('Error parsing curation response:', error.message);
      return {
        decision: 'PUBLISH',
        confidence: 5,
        reason: 'Failed to parse curator response'
      };
    }
  }

  async curateMultipleArticles(articles, batchDelay = 200) {
    const curationResults = [];
    const publishableArticles = [];
    const scrappedArticles = [];
    
    console.log(`Starting curation of ${articles.length} articles...`);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      try {
        const result = await this.curateArticle(article);
        curationResults.push(result);
        
        if (result.decision === 'PUBLISH') {
          publishableArticles.push(result.article);
        } else {
          scrappedArticles.push({
            article: result.article,
            reason: result.reason,
            confidence: result.confidence
          });
        }
        
        console.log(`Progress: ${i + 1}/${articles.length} articles curated`);
        
        // Small delay between requests to be respectful to OpenAI API
        if (i < articles.length - 1 && batchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
        
      } catch (error) {
        console.error(`Error curating article "${article.title}":`, error.message);
        // Default to publish on individual errors
        publishableArticles.push(article);
      }
    }
    
    const stats = {
      total: articles.length,
      published: publishableArticles.length,
      scrapped: scrappedArticles.length,
      publishRate: Math.round((publishableArticles.length / articles.length) * 100)
    };
    
    console.log(`Curation completed: ${stats.published}/${stats.total} articles approved for publishing (${stats.publishRate}%)`);
    
    if (scrappedArticles.length > 0) {
      console.log('\nScrapped articles:');
      scrappedArticles.forEach((item, index) => {
        console.log(`${index + 1}. "${item.article.title.substring(0, 60)}..." - ${item.reason}`);
      });
    }
    
    return {
      publishableArticles,
      scrappedArticles,
      curationResults,
      stats
    };
  }

  // Helper method to get curation statistics
  getCurationStats(curationResults) {
    const total = curationResults.length;
    const published = curationResults.filter(r => r.decision === 'PUBLISH').length;
    const scrapped = total - published;
    const avgConfidence = curationResults.reduce((sum, r) => sum + r.confidence, 0) / total;
    
    return {
      total,
      published,
      scrapped,
      publishRate: Math.round((published / total) * 100),
      avgConfidence: Math.round(avgConfidence * 10) / 10
    };
  }

  // Method to adjust curator sensitivity
  setMinConfidence(minConfidence) {
    this.minConfidence = Math.min(10, Math.max(1, minConfidence));
    console.log(`Updated minimum confidence threshold to: ${this.minConfidence}`);
  }
}

module.exports = CuratorAgent;