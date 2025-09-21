import type { FullSchedulerConfig } from '../types/schedulerTypes.js';

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

  return {
    cronSchedule: process.env.CRON_SCHEDULE || '0 7 * * *', // Default: 7 AM daily
    auth: {
      GITHUB_APP_ID: requiredEnvVars.GITHUB_APP_ID!,
      GITHUB_PRIVATE_KEY: requiredEnvVars.GITHUB_PRIVATE_KEY!,
      GITHUB_INSTALLATION_ID: requiredEnvVars.GITHUB_INSTALLATION_ID!,
    },
    owner: requiredEnvVars.GITHUB_OWNER!,
    repos: requiredEnvVars.GITHUB_REPOS!.split(',').map((r) => r.trim()),
    maxRetries: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3,
    retryDelay: process.env.RETRY_DELAY
      ? parseInt(process.env.RETRY_DELAY)
      : 5000,
    outputPath: process.env.OUTPUT_PATH || './pr-summary.json',
  };
}
