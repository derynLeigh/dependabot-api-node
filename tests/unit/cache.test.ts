import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';

describe('Cache', () => {
  const testCacheFile = './test-cache.json';

  afterEach(() => {
    // Clean up test files
    if (existsSync(testCacheFile)) {
      unlinkSync(testCacheFile);
    }
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('CacheManager', () => {
    it('should store and retrieve data within TTL', async () => {
      const { CacheManager } = await import(
        '../utils/functions/testImplementations.js'
      );

      const cache = new CacheManager(testCacheFile, 5000); // 5 second TTL
      const testData = {
        data: [{ id: 1, title: 'Test PR' }],
        errors: [],
        count: 1,
      };

      await cache.set('test-key', testData);
      const retrieved = await cache.get('test-key');

      expect(retrieved).toEqual(testData);
    });

    it('should return null for expired data', async () => {
      const { CacheManager } = await import(
        '../utils/functions/testImplementations.js'
      );

      const cache = new CacheManager(testCacheFile, 100); // 100ms TTL

      await cache.set('test-key', { data: [] });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      const retrieved = await cache.get('test-key');
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent keys', async () => {
      const { CacheManager } = await import(
        '../utils/functions/testImplementations.js'
      );

      const cache = new CacheManager(testCacheFile, 5000);
      const retrieved = await cache.get('non-existent-key');

      expect(retrieved).toBeNull();
    });
  });
});
