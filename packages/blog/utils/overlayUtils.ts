/**
 * Utility functions for random overlay assignment
 */

/**
 * Generates a random overlay class name
 * @returns A random overlay class (overlay-1 through overlay-5)
 */
export function getRandomOverlayClass(): string {
  const overlayNumber = Math.floor(Math.random() * 5) + 1
  return `overlay-${overlayNumber}`
}

/**
 * Generates a consistent overlay class based on a seed (useful for SSR)
 * @param seed - A string or number to use as seed for consistent results
 * @returns A consistent overlay class based on the seed
 */
export function getSeededOverlayClass(seed: string | number): string {
  // Simple hash function to convert seed to number
  let hash = 0
  const str = seed.toString()
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get overlay number
  const overlayNumber = (Math.abs(hash) % 5) + 1
  return `overlay-${overlayNumber}`
}

/**
 * Gets all available overlay classes
 * @returns Array of all overlay class names
 */
export function getAllOverlayClasses(): string[] {
  return ['overlay-1', 'overlay-2', 'overlay-3', 'overlay-4', 'overlay-5']
}
