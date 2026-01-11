const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', 'html-cache');
const CACHE_ENABLED = process.env.USE_HTML_CACHE === 'true';

/**
 * Check if HTML caching is enabled
 * @returns {boolean}
 */
function isCacheEnabled() {
  return CACHE_ENABLED;
}

/**
 * Generate a cache key (filename) from a URL
 * @param {string} url - The URL to generate a key for
 * @returns {string} - Sanitized filename-safe hash
 */
function getCacheKey(url) {
  // Remove protocol and normalize
  const normalizedUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  // Create hash for filesystem safety
  const hash = crypto.createHash('md5').update(normalizedUrl).digest('hex');
  return `${hash}.html`;
}

/**
 * Get the full cache file path for a URL
 * @param {string} url - The URL
 * @returns {string} - Full path to cache file
 */
function getCachePath(url) {
  const key = getCacheKey(url);
  return path.join(CACHE_DIR, key);
}

/**
 * Ensure the cache directory exists
 * @returns {Promise<void>}
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Get cached HTML for a URL
 * @param {string} url - The URL to get cached HTML for
 * @returns {Promise<string|null>} - Cached HTML or null if not cached
 */
async function getCachedHtml(url) {
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const cachePath = getCachePath(url);
    const html = await fs.readFile(cachePath, 'utf-8');
    console.log(`[Cache] Hit: ${url.substring(0, 50)}...`);
    return html;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, not an error
      return null;
    }
    // Other errors: log but don't fail
    console.warn(`[Cache] Error reading cache for ${url}:`, error.message);
    return null;
  }
}

/**
 * Save HTML to cache
 * @param {string} url - The URL
 * @param {string} html - The HTML content to cache
 * @returns {Promise<void>}
 */
async function saveCachedHtml(url, html) {
  if (!isCacheEnabled()) {
    return;
  }

  try {
    await ensureCacheDir();
    const cachePath = getCachePath(url);
    await fs.writeFile(cachePath, html, 'utf-8');
    console.log(`[Cache] Saved: ${url.substring(0, 50)}...`);
  } catch (error) {
    // Log but don't fail the scraping process
    console.warn(`[Cache] Error saving cache for ${url}:`, error.message);
  }
}

/**
 * Check if a URL is cached
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>}
 */
async function isCached(url) {
  if (!isCacheEnabled()) {
    return false;
  }

  try {
    const cachePath = getCachePath(url);
    await fs.access(cachePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Navigate to a URL with cache support
 * If cache is enabled and cached HTML exists, use it
 * Otherwise, fetch from server and optionally save to cache
 * @param {object} page - Playwright page object
 * @param {string} url - The URL to navigate to
 * @param {object} options - Options to pass to page.goto() or page.setContent()
 * @returns {Promise<void>}
 */
async function navigateWithCache(page, url, options = {}) {
  if (!isCacheEnabled()) {
    // Caching disabled: normal navigation
    await page.goto(url, options);
    return;
  }

  // Check for cached HTML
  const cachedHtml = await getCachedHtml(url);
  
  if (cachedHtml) {
    // Use cached HTML
    // Extract base URL for resolving relative resources
    const baseUrl = new URL(url).origin;
    await page.setContent(cachedHtml, { url: baseUrl });
    // Wait for network to be idle if specified
    if (options.waitUntil === 'networkidle') {
      await page.waitForLoadState('networkidle');
    }
  } else {
    // Fetch from server
    console.log(`[Cache] Miss: ${url.substring(0, 50)}...`);
    await page.goto(url, options);
    
    // Save HTML to cache
    try {
      const html = await page.content();
      await saveCachedHtml(url, html);
    } catch (error) {
      console.warn(`[Cache] Error saving HTML for ${url}:`, error.message);
    }
  }
}

module.exports = {
  isCacheEnabled,
  getCachedHtml,
  saveCachedHtml,
  isCached,
  navigateWithCache,
};
