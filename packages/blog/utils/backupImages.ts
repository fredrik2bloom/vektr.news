// Backup images for articles without image URLs
const BACKUP_IMAGES = [
  '/static/images/backup/all-news.png',
  '/static/images/backup/all-news-2.png', 
  '/static/images/backup/all-news3.png'
]

/**
 * Get a random backup image based on article slug for consistency
 * Uses the slug as a seed to ensure the same article always gets the same backup image
 */
export function getBackupImage(articleSlug: string): string {
  // Simple hash function to convert string to number
  let hash = 0
  for (let i = 0; i < articleSlug.length; i++) {
    const char = articleSlug.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % BACKUP_IMAGES.length
  return BACKUP_IMAGES[index]
}

/**
 * Check if an article has a valid image URL
 */
export function hasValidImage(images?: string[]): boolean {
  return Boolean(images && images.length > 0 && images[0] && images[0].trim() !== '')
}

/**
 * Get the appropriate image URL for an article (original or backup)
 */
export function getArticleImage(images: string[] | undefined, articleSlug: string): string {
  if (hasValidImage(images)) {
    return images![0]
  }
  return getBackupImage(articleSlug)
}