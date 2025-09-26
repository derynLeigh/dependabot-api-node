export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStorage<T = unknown> {
  [key: string]: CacheEntry<T>;
}
