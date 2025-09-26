export interface GitHubUser {
  login: string;
  id: number;
  type: string;
}

export interface DependabotPR {
  id: number;
  title: string;
  html_url: string;
  user?: GitHubUser | null;
  head?: {
    repo?: {
      name: string;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface AuthConfig {
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_INSTALLATION_ID: string;
}

export interface RepoError {
  repo: string;
  error: string;
  code?: string;
}

export interface FetchAllResult {
  data: PRdto[];
  errors: RepoError[];
  count: number;
}

export interface PRdto {
  id: number;
  title: string;
  url: string;
  repo: string;
  createdAt: string;
  updatedAt: string;
}

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
  retryDelay?: number;
  delayFn?: (ms: number) => Promise<void>;
}

export interface FullSchedulerConfig {
  cronSchedule: string;
  auth: AuthConfig;
  owner: string;
  repos: string[];
  maxRetries?: number;
  retryDelay?: number;
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

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStorage<T = unknown> {
  [key: string]: CacheEntry<T>;
}
