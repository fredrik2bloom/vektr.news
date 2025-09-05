#!/usr/bin/env node

const CryptoFeedAggregator = require('../src/index.js');
// Load environment variables - works for both local development and Railway
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' ? '.env' : '../../.env' 
});

/**
 * Standalone script for publishing articles to Next.js blog
 */

async function main() {
  const args = process.argv.slice(2);
  
  // Check for help first, before initializing database
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const aggregator = new CryptoFeedAggregator();
  
  // Parse command line arguments
  let command = 'publish';
  let options = {
    onlyToday: true,
    limit: 10,
    skipExisting: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--preview':
        command = 'preview';
        break;
      case '--all-recent':
        options.onlyToday = false;
        options.days = 7;
        break;
      case '--today':
        options.onlyToday = true;
        break;
      case '--limit':
        options.limit = parseInt(args[++i]) || 10;
        break;
      case '--force':
        options.skipExisting = false;
        break;
      case '--category':
        options.category = args[++i];
        options.onlyToday = false;
        break;
    }
  }

  try {
    console.log('=== Next.js Blog Publisher ===\n');

    if (command === 'preview') {
      console.log('Previewing articles that would be published...\n');
      const result = await aggregator.previewNextjsPublishing(options);
      
      if (!result.success) {
        console.error('Preview failed:', result.error);
        process.exit(1);
      }
      
    } else {
      console.log('Publishing articles to Next.js blog...\n');
      const result = await aggregator.publishToNextjs(options);
      
      if (result.success) {
        console.log(`\n=== Publishing Results ===`);
        console.log(`✅ Published: ${result.published} articles`);
        console.log(`⏭️  Skipped: ${result.skipped} articles`);
        console.log(`❌ Failed: ${result.failed} articles`);
        
        if (result.results && result.results.length > 0) {
          console.log('\n=== Published Files ===');
          result.results
            .filter(r => r.success && !r.skipped)
            .forEach(r => console.log(`✅ ${r.filename}`));
            
          const skippedFiles = result.results.filter(r => r.success && r.skipped);
          if (skippedFiles.length > 0) {
            console.log('\n=== Skipped Files (Already Exist) ===');
            skippedFiles.forEach(r => console.log(`⏭️  ${r.filename}`));
          }
          
          const failedFiles = result.results.filter(r => !r.success);
          if (failedFiles.length > 0) {
            console.log('\n=== Failed Files ===');
            failedFiles.forEach(r => console.log(`❌ ${r.title}: ${r.error}`));
          }
        }
        
        if (result.published > 0) {
          console.log('\n🎉 Articles published successfully!');
          console.log('💡 Run "cd web && npm run dev" to see your articles in the Next.js blog');
        } else if (result.skipped > 0) {
          console.log('\n ℹ️ All articles were already published. Use --force to republish.');
        }
      } else {
        console.error('❌ Publishing failed:', result.error);
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Next.js Blog Publisher

USAGE:
  node publish-to-nextjs.js [OPTIONS]

COMMANDS:
  (default)     Publish articles to Next.js blog
  --preview     Preview articles that would be published (dry run)

OPTIONS:
  --today       Publish only today's articles (default)
  --all-recent  Publish articles from the last 7 days
  --limit N     Limit number of articles (default: 10)
  --force       Republish existing articles (skip duplicate check)
  --category X  Publish articles from specific category only
  --help, -h    Show this help message

EXAMPLES:
  node publish-to-nextjs.js
                        Publish today's articles (default)
  
  node publish-to-nextjs.js --preview
                        Preview what would be published
  
  node publish-to-nextjs.js --all-recent --limit 20
                        Publish last 7 days, max 20 articles
  
  node publish-to-nextjs.js --category "bitcoin" --limit 5
                        Publish 5 Bitcoin articles
  
  node publish-to-nextjs.js --force
                        Republish today's articles even if they exist

NOTES:
  - Articles are saved as MDX files in web/data/blog/
  - Existing articles are skipped unless --force is used
  - The Next.js app will automatically detect new files
  - Make sure your database has articles before publishing
  `);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, showHelp };