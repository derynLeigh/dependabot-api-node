// tests/unit/fetchAllDependabotPRs.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define types locally instead of importing from src
interface AuthConfig {
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_INSTALLATION_ID: string;
}

interface RepoError {
  repo: string;
  error: string;
  code?: string;
}

interface FetchAllResult {
  data: PRdto[];
  errors: RepoError[];
  count: number;
}

interface PRdto {
  id: number;
  title: string;
  url: string;
  repo: string;
  createdAt: string;
  updatedAt: string;
}

interface DependabotPR {
  id: number;
  title: string;
  html_url: string;
  head?: {
    repo?: {
      name: string;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}

// Test implementation
function toPRdto(pr: DependabotPR): PRdto {
  return {
    id: pr.id,
    title: pr.title,
    url: pr.html_url,
    repo: pr.head?.repo?.name ?? '',
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
  };
}

async function fetchAllDependabotPRs(
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

function createMockPR(overrides: Partial<DependabotPR> = {}): DependabotPR {
  return {
    id: 1,
    title: 'Mock PR',
    html_url: 'https://example.com/pr/1',
    head: { repo: { name: 'mock-repo' } },
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2025-09-01T11:00:00Z',
    ...overrides
  };
}

describe('fetchAllDependabotPRs', () => {
  const mockConfig: AuthConfig = {
    GITHUB_APP_ID: '12345',
    GITHUB_PRIVATE_KEY: 'private-key',
    GITHUB_INSTALLATION_ID: '67890'
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch PRs from multiple repositories successfully', async () => {
    const mockGetToken = vi.fn().mockResolvedValue('test-token');
    const mockFetchPRs = vi.fn()
      .mockResolvedValueOnce([createMockPR({ id: 1, title: 'Repo1 PR' })])
      .mockResolvedValueOnce([createMockPR({ id: 2, title: 'Repo2 PR' })]);

    const result = await fetchAllDependabotPRs(
      mockConfig, 
      'owner', 
      ['repo1', 'repo2'],
      mockGetToken,
      mockFetchPRs
    );

    expect(mockGetToken).toHaveBeenCalledWith(mockConfig);
    expect(mockFetchPRs).toHaveBeenCalledTimes(2);
    
    expect(result).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({ id: 1, title: 'Repo1 PR' }),
        expect.objectContaining({ id: 2, title: 'Repo2 PR' })
      ]),
      errors: [],
      count: 2
    });
  });

  it('should continue fetching from other repos when one repo fails', async () => {
    const mockGetToken = vi.fn().mockResolvedValue('test-token');
    const mockFetchPRs = vi.fn()
      .mockRejectedValueOnce(new Error('Forbidden: insufficient permissions'))
      .mockResolvedValueOnce([createMockPR({ id: 2, title: 'Repo2 PR' })]);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await fetchAllDependabotPRs(
      mockConfig, 
      'owner', 
      ['repo1', 'repo2'],
      mockGetToken,
      mockFetchPRs
    );

    expect(mockFetchPRs).toHaveBeenCalledTimes(2);
    
    expect(result).toEqual({
      data: [
        expect.objectContaining({ id: 2, title: 'Repo2 PR' })
      ],
      errors: [
        {
          repo: 'repo1',
          error: 'Forbidden: insufficient permissions'
        }
      ],
      count: 1
    });

    consoleSpy.mockRestore();
  });
});