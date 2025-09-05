#!/usr/bin/env node

/**
 * Script to automatically update Next.js image domains based on published articles
 * Usage: node scripts/update-image-domains.js
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Path to blog articles
const BLOG_DIR = path.join(__dirname, '../packages/blog/data/blog');
const NEXTJS_CONFIG = path.join(__dirname, '../packages/blog/next.config.js');

function extractImageDomains() {
  const domains = new Set();
  
  try {
    const files = fs.readdirSync(BLOG_DIR);
    const mdxFiles = files.filter(f => f.endsWith('.mdx'));
    
    console.log(`Scanning ${mdxFiles.length} articles for image domains...`);
    
    for (const file of mdxFiles) {
      const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      
      // Extract images from frontmatter
      const imageMatch = content.match(/images:\s*\[(.*?)\]/s);
      if (imageMatch) {
        const imageUrls = imageMatch[1].match(/'([^']+)'/g) || [];
        
        for (const urlMatch of imageUrls) {
          const url = urlMatch.replace(/'/g, '');
          try {
            const parsed = new URL(url);
            domains.add(parsed.hostname);
          } catch (e) {
            console.log(`Invalid URL: ${url}`);
          }
        }
      }
      
      // Also extract from markdown content
      const markdownImages = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g) || [];
      for (const imgMatch of markdownImages) {
        const urlMatch = imgMatch.match(/\((https?:\/\/[^\s)]+)\)/);
        if (urlMatch) {
          try {
            const parsed = new URL(urlMatch[1]);
            domains.add(parsed.hostname);
          } catch (e) {
            console.log(`Invalid URL: ${urlMatch[1]}`);
          }
        }
      }
    }
    
    return Array.from(domains).sort();
  } catch (error) {
    console.error('Error reading blog files:', error);
    return [];
  }
}

function updateNextConfig(domains) {
  console.log(`Found ${domains.length} unique image domains:`);
  domains.forEach(domain => console.log(`  - ${domain}`));
  
  // Read current config
  let configContent = fs.readFileSync(NEXTJS_CONFIG, 'utf8');
  
  // Generate new remote patterns
  const newPatterns = domains.map(domain => 
    `        {
          protocol: 'https',
          hostname: '${domain}',
        },`
  ).join('\n');
  
  console.log('\nGenerated image patterns:');
  console.log(newPatterns);
  
  // You can manually add these to your next.config.js
  console.log('\n✅ Image domains extracted successfully!');
  console.log('📝 Add the above patterns to your packages/blog/next.config.js remotePatterns array');
}

function main() {
  console.log('🔍 Extracting image domains from crypto articles...\n');
  
  const domains = extractImageDomains();
  if (domains.length === 0) {
    console.log('No image domains found.');
    return;
  }
  
  updateNextConfig(domains);
}

if (require.main === module) {
  main();
}

module.exports = { extractImageDomains, updateNextConfig };