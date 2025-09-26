import { AuthConfig } from './auth.js';
import { FetchAllResult } from './gitHubTypes.js';

export interface ScheduledFetchOptions {
  config: AuthConfig;
  owner: string;
  repos: string[];
  onSuccess?: (result: FetchAllResult) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

export interface ScheduledFetchWithRetryOptions extends ScheduledFetchOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export interface FullSchedulerConfig {
  cronSchedule: string;
  auth: AuthConfig;
  owner: string;
  repos: string[];
  maxRetries?: number;
  retryDelay?: number;
  outputPath?: string; // For file storage
  onSuccess?: (result: FetchAllResult) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
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
