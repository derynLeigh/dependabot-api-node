import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthConfig } from '../utils/types/testTypes';
import { fetchAllDependabotPRs } from '../utils/testFunctions/testImplementations.js';
import { createTestMockPR } from '../utils/testFunctions/helperFunctions.js';

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
      .mockResolvedValueOnce([createTestMockPR({ id: 1, title: 'Repo1 PR' })])
      .mockResolvedValueOnce([createTestMockPR({ id: 2, title: 'Repo2 PR' })]);

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
      .mockResolvedValueOnce([createTestMockPR({ id: 2, title: 'Repo2 PR' })]);

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

  it('should handle repositories with no PRs', async () => {
  const mockGetToken = vi.fn().mockResolvedValue('test-token');
  const mockFetchPRs = vi.fn()
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([createTestMockPR({ id: 2, title: 'Repo2 PR' })]);

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
    errors: [],
    count: 1
  });
});

it('should handle all repositories having no PRs', async () => {
  const mockGetToken = vi.fn().mockResolvedValue('test-token');
  const mockFetchPRs = vi.fn()
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);

  const result = await fetchAllDependabotPRs(
    mockConfig, 
    'owner', 
    ['repo1', 'repo2'],
    mockGetToken,
    mockFetchPRs
  );

  expect(result).toEqual({
    data: [],
    errors: [],
    count: 0
  });
});
});

