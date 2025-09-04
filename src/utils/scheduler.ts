import cron from 'node-cron';
import fs from 'fs';
import type { PRdto } from '../types/githubTypes.js';
import type { SchedulerConfig } from '../types/schedulerTypes.js';
import { fetchAllDependabotPRs } from './gitHubHelpers.js';

const DEFAULT_CONFIG: SchedulerConfig = {
  cronSchedule: '0 7 * * *',
  outputPath: 'summary.json',
  auth: {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID!,
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY!,
    GITHUB_INSTALLATION_ID: process.env.GITHUB_INSTALLATION_ID!,
  },
  owner: 'derynLeigh',
  repos: [
    'techronymsService',
    'techronyms-user-service',
    'dependabot-pr-summariser',
  ],
};

export function scheduleDailySummary(
  config: Partial<SchedulerConfig> = {},
): void {
  const mergedConfig: SchedulerConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  cron.schedule(mergedConfig.cronSchedule, async () => {
    try {
      const prs: PRdto[] = await fetchAllDependabotPRs(
        mergedConfig.auth,
        mergedConfig.owner,
        mergedConfig.repos,
      );
      storeDailySummary(prs, mergedConfig.outputPath);
      logSuccess(prs.length);
    } catch (error: unknown) {
      handleSchedulerError(error);
    }
  });
}

function storeDailySummary(prs: PRdto[], outputPath: string): void {
  const summary = {
    generatedAt: new Date().toISOString(),
    count: prs.length,
    prs: prs.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      repo: p.repo,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  };
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');
}

function logSuccess(prCount: number): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] Successfully generated summary with ${prCount} PRs`,
  );
}

function handleSchedulerError(error: unknown): void {
  const timestamp = new Date().toISOString();
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error occurred';

  console.error(`[${timestamp}] Scheduler Error:`);
  console.error('  Reason:', errorMessage);

  if (error instanceof Error && error.stack) {
    console.error('  Stack trace:', error.stack);
  }
}
