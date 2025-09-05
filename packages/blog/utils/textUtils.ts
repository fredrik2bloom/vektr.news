/**
 * Truncate text to a specified length with proper ellipsis handling
 * Ensures we don't break words and adds ellipsis when needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text
  }

  // Find the last space before the max length to avoid breaking words
  const truncated = text.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  // If we find a space and it's not too far from the end, use it
  if (lastSpaceIndex > maxLength * 0.8) {
    return text.substring(0, lastSpaceIndex) + '...'
  }
  
  // Otherwise, just truncate at the max length
  return truncated + '...'
}

/**
 * Truncate text specifically for headlines with different length for mobile/desktop
 */
export function truncateTitle(title: string, isMobile: boolean = false): string {
  const maxLength = isMobile ? 60 : 80
  return truncateText(title, maxLength)
}

/**
 * Get the appropriate summary for display based on the article data and variant
 * Uses the new OpenAI-generated summaries if available, falls back to truncation
 */
export function getDisplaySummary(article: any, variant: 'short' | 'medium' | 'long' = 'medium'): string {
  // Use OpenAI-generated summaries if available
  if (variant === 'short' && article.summaryShort) {
    return article.summaryShort
  }
  if (variant === 'long' && article.summaryLong) {
    return article.summaryLong
  }
  if (variant === 'medium' && article.summary) {
    return article.summary
  }
  
  // Fallback to truncation for backward compatibility
  const summary = article.summary || article.snippet || ''
  const lengthMap = {
    short: 100,
    medium: 150,
    long: 200
  }
  
  return truncateText(summary, lengthMap[variant])
}

/**
 * Truncate text for article summaries (legacy function, kept for compatibility)
 */
export function truncateSummary(summary: string, variant: 'short' | 'medium' | 'long' = 'medium'): string {
  const lengthMap = {
    short: 100,
    medium: 150,
    long: 200
  }
  
  return truncateText(summary, lengthMap[variant])
}