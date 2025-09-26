import type { FullSchedulerConfig } from '../types/schedulerTypes.js';
import { CacheManager } from './cache.js';
import type { FetchAllResult } from '../types/gitHubTypes.js';

export function createCacheWarmingHandler(
  cache: CacheManager<FetchAllResult>,
  owner: string,
  repos: string[],
) {
  return async (result: FetchAllResult): Promise<void> => {
    const cacheKey = `${owner}-${repos.join(',')}`;
    await cache.set(cacheKey, result);
    console.log(`Cache warmed for key: ${cacheKey}`);
  };
}

export function getSchedulerConfig(): FullSchedulerConfig {
  const requiredEnvVars = {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY,
    GITHUB_INSTALLATION_ID: process.env.GITHUB_INSTALLATION_ID,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPOS: process.env.GITHUB_REPOS,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  // Helper function to parse integer env vars with defaults
  const parseIntWithDefault = (envVar: string | undefined, defaultValue: number): number => {
    if (!envVar) return defaultValue;
    const parsed = parseInt(envVar, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  return {
    cronSchedule: process.env.CRON_SCHEDULE || '0 7 * * *', // Default: 7 AM daily
    auth: {
      GITHUB_APP_ID: requiredEnvVars.GITHUB_APP_ID!,
      GITHUB_PRIVATE_KEY: requiredEnvVars.GITHUB_PRIVATE_KEY!,
      GITHUB_INSTALLATION_ID: requiredEnvVars.GITHUB_INSTALLATION_ID!,
    },
    owner: requiredEnvVars.GITHUB_OWNER!,
    repos: requiredEnvVars.GITHUB_REPOS!.split(',').map((r) => r.trim()),
    maxRetries: parseIntWithDefault(process.env.MAX_RETRIES, 3),
    retryDelay: parseIntWithDefault(process.env.RETRY_DELAY, 5000),
    outputPath: process.env.OUTPUT_PATH || './pr-summary.json',
  };
}
