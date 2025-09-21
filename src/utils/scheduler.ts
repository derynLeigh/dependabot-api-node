import { fetchAllDependabotPRs } from './gitHubHelpers.js';
import { writeFileSync, readFileSync } from 'fs'; // Add readFileSync import
import { join } from 'path';
import type {
  ScheduledFetchOptions,
  ScheduledFetchWithRetryOptions,
  FullSchedulerConfig,
  SchedulerControls,
  CronTask,
} from '../types/schedulerTypes.js';
import type { FetchAllResult } from '../types/gitHubTypes.js';

export async function executeScheduledFetch(
  options: ScheduledFetchOptions,
): Promise<void> {
  try {
    const result = await fetchAllDependabotPRs(
      options.config,
      options.owner,
      options.repos,
    );

    if (options.onSuccess) {
      await options.onSuccess(result);
    }
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error('Unknown error occurred');

    if (options.onError) {
      await options.onError(err);
    } else {
      console.error('Scheduled fetch failed:', err.message);
    }
  }
}

export async function executeScheduledFetchWithRetry(
  options: ScheduledFetchWithRetryOptions,
): Promise<void> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchAllDependabotPRs(
        options.config,
        options.owner,
        options.repos,
      );

      if (options.onSuccess) {
        await options.onSuccess(result);
      }
      return;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error('Unknown error occurred');

      if (attempt < maxRetries) {
        console.log(
          `Attempt ${attempt} failed, retrying in ${retryDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  if (options.onError) {
    await options.onError(lastError!);
  } else {
    console.error(
      `Scheduled fetch failed after ${maxRetries} attempts:`,
      lastError!.message,
    );
  }
}

// File storage handler
export function createFileStorageHandler(outputPath: string) {
  return async (result: FetchAllResult): Promise<void> => {
    const summary = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPRs: result.count,
        successfulRepos: result.data.reduce((acc, pr) => {
          if (!acc.includes(pr.repo)) acc.push(pr.repo);
          return acc;
        }, [] as string[]).length,
        failedRepos: result.errors.length,
        errors: result.errors,
      },
      data: result.data,
    };

    writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`Results saved to ${outputPath}`);
  };
}

// Error logging handler
export function createErrorHandler(logPath?: string) {
  return async (error: Error): Promise<void> => {
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      error: error.message,
      stack: error.stack,
    };

    if (logPath) {
      const existingLogs = [];
      try {
        const existing = readFileSync(logPath, 'utf8');
        existingLogs.push(...JSON.parse(existing));
      } catch {
        // File doesn't exist or is empty
      }

      existingLogs.push(errorLog);
      writeFileSync(logPath, JSON.stringify(existingLogs, null, 2), 'utf8');
    }

    console.error(`[${timestamp}] Scheduler Error:`, error.message);
  };
}

export async function createScheduler(
  config: FullSchedulerConfig,
): Promise<SchedulerControls> {
  const cron = await import('node-cron');

  // Create storage handlers if outputPath is provided
  const onSuccess =
    config.onSuccess ||
    (config.outputPath
      ? createFileStorageHandler(config.outputPath)
      : undefined);

  const onError =
    config.onError ||
    createErrorHandler(
      config.outputPath
        ? join(config.outputPath, '..', 'scheduler-errors.json')
        : undefined,
    );

  const task: CronTask = cron.schedule(
    config.cronSchedule,
    async (): Promise<void> => {
      console.log(
        `[${new Date().toISOString()}] Starting scheduled Dependabot PR fetch...`,
      );

      await executeScheduledFetchWithRetry({
        config: config.auth,
        owner: config.owner,
        repos: config.repos,
        maxRetries: config.maxRetries,
        retryDelay: config.retryDelay,
        onSuccess,
        onError,
      });
    },
  );

  return {
    task,
    stop: (): void => task.destroy(),
    start: (): void => task.start(),
  };
}
