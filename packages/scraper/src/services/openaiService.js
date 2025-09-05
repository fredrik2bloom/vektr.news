const OpenAI = require('openai');
require('dotenv').config();

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.defaultPrompt = `You are a professional crypto news editor. Rewrite the following article snippet to be more engaging, clear, and informative for crypto enthusiasts.

Create THREE versions:
1. SHORT (80-100 characters) - For compact card displays
2. MEDIUM (150-200 characters) - For standard article previews  
3. LONG (250-300 characters) - For featured/hero articles

Guidelines for all versions:
- Use clear, accessible language
- Highlight key crypto/blockchain concepts
- Maintain factual accuracy
- Make it compelling to read
- Remove any promotional language or excessive hype

Original snippet: {snippet}

Format your response exactly like this:
SHORT: [80-100 character version]
MEDIUM: [150-200 character version] 
LONG: [250-300 character version]`;
  }

  async rewriteSnippet(originalSnippet, customPrompt = null) {
    try {
      if (!originalSnippet || originalSnippet.trim().length === 0) {
        return {
          summary: originalSnippet,
          summaryShort: originalSnippet,
          summaryLong: originalSnippet
        };
      }

      const prompt = customPrompt || this.defaultPrompt;
      const fullPrompt = prompt.replace('{snippet}', originalSnippet);

      console.log(`Rewriting snippet: "${originalSnippet.substring(0, 50)}..."`);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        console.warn('OpenAI returned empty response, using original snippet');
        return {
          summary: originalSnippet,
          summaryShort: originalSnippet,
          summaryLong: originalSnippet
        };
      }

      // Parse the structured response
      const summaries = this.parseSummaryResponse(response);
      
      console.log(`Original: "${originalSnippet.substring(0, 50)}..."`);
      console.log(`Short: "${summaries.summaryShort.substring(0, 30)}..."`);
      console.log(`Medium: "${summaries.summary.substring(0, 30)}..."`);
      console.log(`Long: "${summaries.summaryLong.substring(0, 30)}..."`);
      
      return summaries;
      
    } catch (error) {
      console.error('Error rewriting snippet with OpenAI:', error.message);
      return {
        summary: originalSnippet,
        summaryShort: originalSnippet,
        summaryLong: originalSnippet
      };
    }
  }

  parseSummaryResponse(response) {
    try {
      const lines = response.split('\n').filter(line => line.trim());
      
      let summaryShort = '';
      let summary = '';
      let summaryLong = '';
      
      for (const line of lines) {
        if (line.startsWith('SHORT:')) {
          summaryShort = line.replace('SHORT:', '').trim();
        } else if (line.startsWith('MEDIUM:')) {
          summary = line.replace('MEDIUM:', '').trim();
        } else if (line.startsWith('LONG:')) {
          summaryLong = line.replace('LONG:', '').trim();
        }
      }
      
      // Fallback: if parsing fails, use the first line as summary
      if (!summary) {
        summary = lines[0] || response.substring(0, 200);
      }
      if (!summaryShort) {
        summaryShort = summary.substring(0, 100);
      }
      if (!summaryLong) {
        summaryLong = summary;
      }
      
      return {
        summary: summary,
        summaryShort: summaryShort,
        summaryLong: summaryLong
      };
      
    } catch (error) {
      console.error('Error parsing summary response:', error.message);
      return {
        summary: response.substring(0, 200),
        summaryShort: response.substring(0, 100),
        summaryLong: response.substring(0, 300)
      };
    }
  }

  async rewriteMultipleSnippets(articles, customPrompt = null, batchDelay = 100) {
    const rewrittenArticles = [];
    
    console.log(`Starting to rewrite ${articles.length} article snippets...`);
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      try {
        const rewrittenSummaries = await this.rewriteSnippet(article.snippet, customPrompt);
        
        rewrittenArticles.push({
          ...article,
          snippet: rewrittenSummaries.summary, // Keep existing field for backward compatibility
          summary: rewrittenSummaries.summary,
          summaryShort: rewrittenSummaries.summaryShort,
          summaryLong: rewrittenSummaries.summaryLong,
          originalSnippet: article.snippet
        });
        
        console.log(`Progress: ${i + 1}/${articles.length} snippets rewritten`);
        
        if (i < articles.length - 1 && batchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
        
      } catch (error) {
        console.error(`Error rewriting snippet for article "${article.title}":`, error.message);
        rewrittenArticles.push({
          ...article,
          originalSnippet: article.snippet
        });
      }
    }
    
    console.log(`Completed rewriting ${rewrittenArticles.length} article snippets`);
    return rewrittenArticles;
  }

  setDefaultPrompt(newPrompt) {
    this.defaultPrompt = newPrompt;
    console.log('Updated default prompt for snippet rewriting');
  }

  // New method for generating TLDRs from full article content
  async generateTLDRFromContent(articleContent, title = '') {
    try {
      if (!articleContent || articleContent.trim().length === 0) {
        return {
          summary: '',
          summaryShort: '',
          summaryLong: ''
        };
      }

      // Truncate very long articles to stay within token limits
      const maxContentLength = 8000; // ~2000 tokens for content, leaving room for prompt
      const truncatedContent = articleContent.length > maxContentLength 
        ? articleContent.substring(0, maxContentLength) + '...' 
        : articleContent;

      const tldrPrompt = `You are a professional crypto news editor. Read the full article below and create THREE concise summaries optimized for different display contexts.

Article Title: ${title}

Article Content:
${truncatedContent}

Create THREE versions:
1. SHORT (80-100 characters) - For compact card displays, focus on the most newsworthy point
2. MEDIUM (150-200 characters) - For standard article previews, include key details
3. LONG (250-300 characters) - For featured/hero articles, comprehensive but concise

Guidelines for all versions:
- Extract the most important crypto/blockchain information
- Use clear, accessible language
- Focus on actionable insights and key developments  
- Maintain factual accuracy
- Make it compelling and newsworthy
- Remove fluff, focus on substance

Format your response exactly like this:
SHORT: [80-100 character version]
MEDIUM: [150-200 character version]
LONG: [250-300 character version]`;

      console.log(`Generating TLDR from full article: "${title.substring(0, 50)}..."`);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: tldrPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3, // Lower temperature for more focused summaries
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        console.warn('OpenAI returned empty response for TLDR generation');
        return {
          summary: title.substring(0, 150) || 'No summary available',
          summaryShort: title.substring(0, 80) || 'No summary available',
          summaryLong: title.substring(0, 250) || 'No summary available'
        };
      }

      // Parse the structured response
      const summaries = this.parseSummaryResponse(response);
      
      console.log(`TLDR generated - Short: "${summaries.summaryShort.substring(0, 30)}..."`);
      console.log(`TLDR generated - Medium: "${summaries.summary.substring(0, 30)}..."`);
      console.log(`TLDR generated - Long: "${summaries.summaryLong.substring(0, 30)}..."`);
      
      return summaries;
      
    } catch (error) {
      console.error('Error generating TLDR from content:', error.message);
      return {
        summary: title.substring(0, 150) || 'Error generating summary',
        summaryShort: title.substring(0, 80) || 'Error generating summary',
        summaryLong: title.substring(0, 250) || 'Error generating summary'
      };
    }
  }

  async generateTLDRForMultipleArticles(articlesWithContent, batchDelay = 1000) {
    const processedArticles = [];
    
    console.log(`Starting to generate TLDRs for ${articlesWithContent.length} articles...`);
    
    for (let i = 0; i < articlesWithContent.length; i++) {
      const article = articlesWithContent[i];
      
      try {
        let summaries;
        
        if (article.scrapedContent?.success && article.scrapedContent.markdown) {
          // Use full article content for TLDR
          summaries = await this.generateTLDRFromContent(
            article.scrapedContent.markdown, 
            article.title
          );
        } else {
          // Fallback to RSS snippet if scraping failed
          console.log(`Scraping failed for "${article.title}", using RSS snippet fallback`);
          summaries = await this.rewriteSnippet(article.snippet);
        }
        
        processedArticles.push({
          ...article,
          snippet: summaries.summary,
          summary: summaries.summary,
          summaryShort: summaries.summaryShort,
          summaryLong: summaries.summaryLong,
          originalSnippet: article.snippet,
          usedFullContent: !!(article.scrapedContent?.success)
        });
        
        console.log(`Progress: ${i + 1}/${articlesWithContent.length} TLDRs generated`);
        
        // Delay between requests to respect rate limits
        if (i < articlesWithContent.length - 1 && batchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
        
      } catch (error) {
        console.error(`Error generating TLDR for article "${article.title}":`, error.message);
        processedArticles.push({
          ...article,
          originalSnippet: article.snippet,
          usedFullContent: false
        });
      }
    }
    
    console.log(`Completed generating TLDRs for ${processedArticles.length} articles`);
    return processedArticles;
  }
}

module.exports = OpenAIService;