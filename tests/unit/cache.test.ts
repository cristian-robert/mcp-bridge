import { ResponseCache } from '../../src/cache/response-cache.js';
import { CallToolResult } from '../../src/protocol/types.js';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache({
      enabled: true,
      ttlSeconds: 1,
      maxSize: 10,
    });
  });

  const createMockResult = (text: string): CallToolResult => ({
    content: [{ type: 'text', text }],
  });

  describe('get and set', () => {
    it('should cache and retrieve results', () => {
      const result = createMockResult('test data');
      cache.set('serena', 'findSymbol', { name: 'test' }, result);

      const cached = cache.get('serena', 'findSymbol', { name: 'test' });
      expect(cached).toEqual(result);
    });

    it('should return null for non-existent cache entries', () => {
      const cached = cache.get('serena', 'findSymbol', { name: 'test' });
      expect(cached).toBeNull();
    });

    it('should differentiate cache entries by arguments', () => {
      const result1 = createMockResult('result 1');
      const result2 = createMockResult('result 2');

      cache.set('serena', 'findSymbol', { name: 'test1' }, result1);
      cache.set('serena', 'findSymbol', { name: 'test2' }, result2);

      expect(cache.get('serena', 'findSymbol', { name: 'test1' })).toEqual(result1);
      expect(cache.get('serena', 'findSymbol', { name: 'test2' })).toEqual(result2);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const result = createMockResult('test data');
      cache.set('serena', 'findSymbol', { name: 'test' }, result);

      expect(cache.get('serena', 'findSymbol', { name: 'test' })).toEqual(result);

      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.get('serena', 'findSymbol', { name: 'test' })).toBeNull();
    });
  });

  describe('invalidation', () => {
    it('should clear all cache entries', () => {
      cache.set('serena', 'findSymbol', { name: 'test' }, createMockResult('data'));
      cache.set('context7', 'getLibraryDocs', { lib: 'react' }, createMockResult('docs'));

      const removed = cache.invalidate();
      expect(removed).toBe(2);

      expect(cache.get('serena', 'findSymbol', { name: 'test' })).toBeNull();
      expect(cache.get('context7', 'getLibraryDocs', { lib: 'react' })).toBeNull();
    });

    it('should invalidate entries by server', () => {
      cache.set('serena', 'findSymbol', { name: 'test' }, createMockResult('data'));
      cache.set('context7', 'getLibraryDocs', { lib: 'react' }, createMockResult('docs'));

      const removed = cache.invalidate({ server: 'serena' });
      expect(removed).toBe(1);

      expect(cache.get('serena', 'findSymbol', { name: 'test' })).toBeNull();
      expect(cache.get('context7', 'getLibraryDocs', { lib: 'react' })).not.toBeNull();
    });
  });

  describe('eviction', () => {
    it('should evict oldest entries when max size reached', () => {
      const smallCache = new ResponseCache({
        enabled: true,
        ttlSeconds: 60,
        maxSize: 3,
      });

      smallCache.set('serena', 'tool1', {}, createMockResult('data1'));
      smallCache.set('serena', 'tool2', {}, createMockResult('data2'));
      smallCache.set('serena', 'tool3', {}, createMockResult('data3'));
      smallCache.set('serena', 'tool4', {}, createMockResult('data4'));

      const stats = smallCache.getStats();
      expect(stats.size).toBe(3);
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      cache.set('serena', 'findSymbol', { name: 'test' }, createMockResult('data'));
      cache.get('serena', 'findSymbol', { name: 'test' });
      cache.get('serena', 'findSymbol', { name: 'test' });

      const stats = cache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.enabled).toBe(true);
      expect(stats.ttlSeconds).toBe(1);
    });
  });
});
