import { AuthConfig } from "./auth.js";
import { FetchAllResult } from "./gitHubTypes.js";

export interface SchedulerConfig {
    cronSchedule: string;
    outputPath?: string;
    onSuccess?: (result: FetchAllResult) => Promise<void>;
    onError?: (error: Error) => Promise<void>;
}

export interface ScheduledFetchOptions {
  config: AuthConfig;
  owner: string;
  repos: string[];
  onSuccess?: (result: FetchAllResult) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

export interface ScheduledFetchWithRetryOptions extends ScheduledFetchOptions {
  maxRetries?: number;
  retryDelay?: number; // milliseconds between retries
}

export interface CronTask {
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

export interface SchedulerControls {
  task: CronTask;
  stop: () => void;
  start: () => void;
}