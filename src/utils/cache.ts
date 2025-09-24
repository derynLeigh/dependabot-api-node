import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import type { CacheStorage } from '../types/cacheTypes.js';

export class CacheManager<T> {
  private cacheFile: string;
  private defaultTTL: number;

  constructor(cacheFile: string, defaultTTL: number = 300000) {
    // 5 minutes default
    this.cacheFile = cacheFile;
    this.defaultTTL = defaultTTL;
  }

  async get(key: string): Promise<T | null> {
    try {
      if (!existsSync(this.cacheFile)) {
        return null;
      }

      const cacheData: CacheStorage<T> = JSON.parse(
        readFileSync(this.cacheFile, 'utf8'),
      );
      const entry = cacheData[key];

      if (!entry) {
        return null;
      }

      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    const actualTTL = ttl ?? this.defaultTTL;

    let cacheData: CacheStorage<T> = {};

    if (existsSync(this.cacheFile)) {
      try {
        cacheData = JSON.parse(readFileSync(this.cacheFile, 'utf8'));
      } catch {
        // File exists but is corrupted, start fresh
      }
    }

    cacheData[key] = {
      data,
      timestamp: Date.now(),
      ttl: actualTTL,
    };

    writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
  }

  async delete(key: string): Promise<void> {
    if (!existsSync(this.cacheFile)) {
      return;
    }

    try {
      const cacheData: CacheStorage<T> = JSON.parse(
        readFileSync(this.cacheFile, 'utf8'),
      );
      delete cacheData[key];
      writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
    } catch {
      // Ignore errors when cleaning up
    }
  }

  async clear(): Promise<void> {
    if (existsSync(this.cacheFile)) {
      unlinkSync(this.cacheFile);
    }
  }
}
