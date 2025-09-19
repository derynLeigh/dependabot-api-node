import type { 
  DependabotPR as TestDependabotPR, 
  GitHubUser, 
  AuthConfig, 
  RepoError, 
  FetchAllResult, 
  PRdto, 
  DependabotPR, 
  ScheduledFetchOptions,
  ScheduledFetchWithRetryOptions,
  FullSchedulerConfig,
  CronTask,
  SchedulerControls
} from '../types/testTypes.js';

export function toPRdto(pr: DependabotPR): PRdto {
  return {
    id: pr.id,
    title: pr.title,
    url: pr.html_url,
    repo: pr.head?.repo?.name ?? '',
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
  };
}

export function createTestMockUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    login: 'dependabot[bot]',
    id: 49699333,
    type: 'Bot',
    ...overrides
  };
}

export function createTestMockPR(overrides: Partial<TestDependabotPR> = {}): TestDependabotPR {
  return {
    id: 1,
    title: 'Mock PR',
    html_url: 'https://example.com/pr/1',
    user: createTestMockUser(),
    head: { repo: { name: 'mock-repo' } },
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2025-09-01T11:00:00Z',
    ...overrides
  };
}

export async function fetchAllDependabotPRs(
  config: AuthConfig,
  owner: string,
  repos: string[],
  getToken: (config: AuthConfig) => Promise<string>,
  fetchPRs: (token: string, owner: string, repo: string) => Promise<DependabotPR[]>
): Promise<FetchAllResult> {
  const token = await getToken(config);
  const errors: RepoError[] = [];
  const allPRs: PRdto[] = [];

  const results = await Promise.allSettled(
    repos.map(async (repo) => {
      try {
        const prs = await fetchPRs(token, owner, repo);
        return prs.map(toPRdto);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error(`Failed to fetch PRs from repo "${repo}":`, err);
        
        errors.push({
          repo,
          error,
        });
        
        return [] as PRdto[];
      }
    }),
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allPRs.push(...result.value);
    }
  });

  return {
    data: allPRs,
    errors,
    count: allPRs.length,
  };
}

export async function executeScheduledFetch(
  options: ScheduledFetchOptions,
  fetchAllDependabotPRs: (config: AuthConfig, owner: string, repos: string[]) => Promise<FetchAllResult>
): Promise<void> {
  try {
    const result = await fetchAllDependabotPRs(options.config, options.owner, options.repos);
    
    if (options.onSuccess) {
      await options.onSuccess(result);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    
    if (options.onError) {
      await options.onError(err);
    } else {
      // Default behavior: log the error
      console.error('Scheduled fetch failed:', err.message);
    }
  }
}

export async function executeScheduledFetchWithRetry(
  options: ScheduledFetchWithRetryOptions,
  fetchAllDependabotPRs: (config: AuthConfig, owner: string, repos: string[]) => Promise<FetchAllResult>
): Promise<void> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? 1000; // 1 second default
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchAllDependabotPRs(options.config, options.owner, options.repos);
      
      if (options.onSuccess) {
        await options.onSuccess(result);
      }
      return;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
        // In tests, we can mock setTimeout or skip the delay
        if (process.env.NODE_ENV !== 'test') {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }
  
  if (options.onError) {
    await options.onError(lastError!);
  } else {
    console.error(`Scheduled fetch failed after ${maxRetries} attempts:`, lastError!.message);
  }
}

export async function createScheduler(config: FullSchedulerConfig): Promise<SchedulerControls> {
  const cron = await import('node-cron');
  
  const task: CronTask = cron.schedule(config.cronSchedule, async (): Promise<void> => {
    console.log(`[${new Date().toISOString()}] Starting scheduled Dependabot PR fetch...`);
    
    const { fetchAllDependabotPRs } = await import('../../../src/utils/gitHubHelpers.js');
    
    await executeScheduledFetchWithRetry({
      config: config.auth,
      owner: config.owner,
      repos: config.repos,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
      onSuccess: config.onSuccess,
      onError: config.onError
    }, fetchAllDependabotPRs);
  });

  return {
    task,
    stop: (): void => task.destroy(),
    start: (): void => task.start()
  };
}