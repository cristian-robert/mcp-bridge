import { CallToolResult } from '../protocol/types.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('cache');

interface CacheEntry {
  value: CallToolResult;
  timestamp: number;
  hits: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttlSeconds: number;
  maxSize: number;
}

export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: config?.enabled ?? (process.env.CACHE_ENABLED !== 'false'),
      ttlSeconds: config?.ttlSeconds ?? parseInt(process.env.CACHE_TTL_SECONDS || '300'),
      maxSize: config?.maxSize ?? parseInt(process.env.CACHE_MAX_SIZE || '1000'),
    };

    logger.info('Cache initialized', this.config);

    if (this.config.enabled) {
      this.startCleanupInterval();
    }
  }

  /**
   * Generate cache key from server, tool, and arguments
   */
  private generateKey(server: string, tool: string, args: Record<string, unknown>): string {
    const sortedArgs = JSON.stringify(args, Object.keys(args).sort());
    return `${server}:${tool}:${sortedArgs}`;
  }

  /**
   * Get cached result if available and not expired
   */
  get(server: string, tool: string, args: Record<string, unknown>): CallToolResult | null {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.generateKey(server, tool, args);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    const maxAge = this.config.ttlSeconds * 1000;

    if (age > maxAge) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`, { age, maxAge });
      return null;
    }

    entry.hits++;
    logger.debug(`Cache hit: ${key}`, { hits: entry.hits, age });

    return entry.value;
  }

  /**
   * Store result in cache
   */
  set(server: string, tool: string, args: Record<string, unknown>, value: CallToolResult): void {
    if (!this.config.enabled) {
      return;
    }

    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const key = this.generateKey(server, tool, args);

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });

    logger.debug(`Cache set: ${key}`, { size: this.cache.size });
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern?: { server?: string; tool?: string }): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      logger.info('Cache cleared', { entriesRemoved: size });
      return size;
    }

    let removed = 0;

    for (const [key] of this.cache) {
      const [keyServer, keyTool] = key.split(':');

      const matches =
        (!pattern.server || keyServer === pattern.server) &&
        (!pattern.tool || keyTool === pattern.tool);

      if (matches) {
        this.cache.delete(key);
        removed++;
      }
    }

    logger.info('Cache invalidated', { pattern, removed });
    return removed;
  }

  /**
   * Evict oldest entry based on LRU (least hits + oldest timestamp)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestScore = Infinity;

    for (const [key, entry] of this.cache) {
      const score = entry.timestamp / (entry.hits + 1);

      if (score < oldestScore) {
        oldestScore = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Evicted cache entry: ${oldestKey}`);
    }
  }

  /**
   * Clean up expired entries periodically
   */
  private startCleanupInterval(): void {
    const intervalMs = Math.max(this.config.ttlSeconds * 1000 / 2, 60000);

    setInterval(() => {
      const now = Date.now();
      const maxAge = this.config.ttlSeconds * 1000;
      let removed = 0;

      for (const [key, entry] of this.cache) {
        if (now - entry.timestamp > maxAge) {
          this.cache.delete(key);
          removed++;
        }
      }

      if (removed > 0) {
        logger.debug(`Cleaned up ${removed} expired cache entries`);
      }
    }, intervalMs);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    enabled: boolean;
    ttlSeconds: number;
    hitRate?: number;
  } {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled,
      ttlSeconds: this.config.ttlSeconds,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : undefined,
    };
  }
}
