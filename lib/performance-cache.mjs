// @ts-check

import { LRUCache } from "./lru-cache.mjs";

/**
 * Performance optimization caches for markdownlint.
 */

// LRU cache for rule execution results (1000 entries)
const ruleResultCache = new LRUCache(1000);

// LRU cache for AST parsing results (500 entries - ASTs are larger)
const astParseCache = new LRUCache(500);

// Object pool for result objects to reduce allocations
const resultObjectPool = [];
const MAX_POOL_SIZE = 100;

// Regex cache to avoid recompiling the same patterns
const regexCache = new Map();

/**
 * Create a simple hash key for content.
 * Uses a simple string hash for browser compatibility.
 * @param {string} content Content to hash.
 * @returns {string} Hash key.
 */
function createHashKey(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36) + content.length;
}

/**
 * Get cached rule execution result.
 * @param {string} ruleName Rule name.
 * @param {string} content Content being linted.
 * @param {Object} config Rule configuration.
 * @returns {any} Cached result or undefined.
 */
export function getCachedRuleResult(ruleName, content, config) {
  const configKey = JSON.stringify(config);
  const contentHash = createHashKey(content);
  const key = `${ruleName}:${contentHash}:${configKey}`;
  return ruleResultCache.get(key);
}

/**
 * Cache rule execution result.
 * @param {string} ruleName Rule name.
 * @param {string} content Content being linted.
 * @param {Object} config Rule configuration.
 * @param {any} result Result to cache.
 * @returns {void}
 */
export function setCachedRuleResult(ruleName, content, config, result) {
  const configKey = JSON.stringify(config);
  const contentHash = createHashKey(content);
  const key = `${ruleName}:${contentHash}:${configKey}`;
  ruleResultCache.set(key, result);
}

/**
 * Get cached AST parse result.
 * @param {string} markdown Markdown content.
 * @returns {any} Cached AST or undefined.
 */
export function getCachedAST(markdown) {
  const key = createHashKey(markdown);
  return astParseCache.get(key);
}

/**
 * Cache AST parse result.
 * @param {string} markdown Markdown content.
 * @param {any} ast Parsed AST.
 * @returns {void}
 */
export function setCachedAST(markdown, ast) {
  const key = createHashKey(markdown);
  astParseCache.set(key, ast);
}

/**
 * Get a result object from the pool.
 * @returns {Object} Result object.
 */
export function getPooledResultObject() {
  if (resultObjectPool.length > 0) {
    return resultObjectPool.pop();
  }
  return {};
}

/**
 * Return a result object to the pool.
 * @param {Object} obj Object to return to pool.
 * @returns {void}
 */
export function returnPooledResultObject(obj) {
  if (resultObjectPool.length < MAX_POOL_SIZE) {
    // Clear all properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        delete obj[key];
      }
    }
    resultObjectPool.push(obj);
  }
}

/**
 * Get or create a cached regex.
 * @param {string} pattern Regex pattern.
 * @param {string} [flags] Regex flags.
 * @returns {RegExp} Compiled regex.
 */
export function getCachedRegex(pattern, flags = "") {
  const key = `${pattern}::${flags}`;
  if (regexCache.has(key)) {
    return regexCache.get(key);
  }
  const regex = new RegExp(pattern, flags);
  regexCache.set(key, regex);
  return regex;
}

/**
 * Clear all performance caches.
 * @returns {void}
 */
export function clearPerformanceCaches() {
  ruleResultCache.clear();
  astParseCache.clear();
  resultObjectPool.length = 0;
  regexCache.clear();
}

/**
 * Get cache statistics.
 * @returns {Object} Cache stats.
 */
export function getCacheStats() {
  return {
    ruleResultCacheSize: ruleResultCache.size,
    astParseCacheSize: astParseCache.size,
    resultObjectPoolSize: resultObjectPool.length,
    regexCacheSize: regexCache.size
  };
}
