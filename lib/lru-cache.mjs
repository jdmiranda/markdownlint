// @ts-check

/**
 * A simple LRU (Least Recently Used) cache implementation.
 */
export class LRUCache {
  /**
   * Create an LRU cache.
   * @param {number} maxSize Maximum number of entries to store.
   */
  constructor(maxSize) {
    this.maxSize = maxSize;
    /** @type {Map<string, any>} */
    this.cache = new Map();
  }

  /**
   * Get a value from the cache.
   * @param {string} key Cache key.
   * @returns {any} Cached value or undefined.
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Set a value in the cache.
   * @param {string} key Cache key.
   * @param {any} value Value to cache.
   * @returns {void}
   */
  set(key, value) {
    // Delete if exists to re-insert at end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    // Evict oldest if over max size
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Check if key exists in cache.
   * @param {string} key Cache key.
   * @returns {boolean} True if key exists.
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear the cache.
   * @returns {void}
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size.
   * @returns {number} Number of entries.
   */
  get size() {
    return this.cache.size;
  }
}
