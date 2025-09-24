import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { existsSync, unlinkSync } from 'fs';
import type { FetchAllResult } from '../utils/types/testTypes.js';

describe('GET /api/prs', () => {
  const testCacheFile = './test-pr-cache.json';

  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();

    process.env.GITHUB_APP_ID = 'test-app-id';
    process.env.GITHUB_PRIVATE_KEY = 'test-private-key';
    process.env.GITHUB_INSTALLATION_ID = 'test-installation-id';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPOS = 'repo1,repo2';
    process.env.CACHE_TTL_MS = '300000';
  });

  afterEach(() => {
    if (existsSync(testCacheFile)) {
      unlinkSync(testCacheFile);
    }
    if (existsSync('./pr-cache.json')) {
      unlinkSync('./pr-cache.json');
    }
  });

  it('should return PRs with enhanced response format on cache miss', async () => {
    // Arrange
    const mockFetchAllResult: FetchAllResult = {
      data: [
        {
          id: 1,
          title: 'Test PR',
          url: 'https://github.com/test/repo/pull/1',
          repo: 'test-repo',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      errors: [],
      count: 1,
    };

    const mockFetchAllDependabotPRs = vi
      .fn()
      .mockResolvedValue(mockFetchAllResult);

    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs,
    }));

    const { createApp } = await import('../../src/server.js');
    const app = createApp();

    // Act
    const response = await request(app).get('/api/prs');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: mockFetchAllResult.data,
      errors: [],
      count: 1,
      fromCache: false, // First request should be cache miss
      generatedAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      ),
      summary: {
        totalReposQueried: 2,
        successfulRepos: 2,
        failedRepos: 0,
      },
    });

    expect(mockFetchAllDependabotPRs).toHaveBeenCalledWith(
      {
        GITHUB_APP_ID: 'test-app-id',
        GITHUB_PRIVATE_KEY: 'test-private-key',
        GITHUB_INSTALLATION_ID: 'test-installation-id',
      },
      'test-owner',
      ['repo1', 'repo2'],
    );
  });

  it('should return cached data on subsequent requests', async () => {
    // Arrange
    const mockFetchAllResult: FetchAllResult = {
      data: [
        {
          id: 1,
          title: 'Test PR',
          url: 'https://github.com/test/repo/pull/1',
          repo: 'test-repo',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      errors: [],
      count: 1,
    };

    const mockFetchAllDependabotPRs = vi
      .fn()
      .mockResolvedValue(mockFetchAllResult);

    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs,
    }));

    const { createApp } = await import('../../src/server.js');
    const app = createApp();

    // Act - Make two requests
    const firstResponse = await request(app).get('/api/prs');
    const secondResponse = await request(app).get('/api/prs');

    // Assert
    expect(firstResponse.body.fromCache).toBe(false);
    expect(secondResponse.body.fromCache).toBe(true);

    // GitHub API should only be called once due to caching
    expect(mockFetchAllDependabotPRs).toHaveBeenCalledTimes(1);
  });

  it('should handle and report repository errors', async () => {
    // Keep your existing error test, just add fromCache: false expectation
    const mockFetchAllResult: FetchAllResult = {
      data: [
        {
          id: 1,
          title: 'Successful PR',
          url: 'https://github.com/test/repo2/pull/1',
          repo: 'repo2',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      errors: [
        {
          repo: 'repo1',
          error: 'Forbidden: insufficient permissions',
          code: '403',
        },
      ],
      count: 1,
    };

    const mockFetchAllDependabotPRs = vi
      .fn()
      .mockResolvedValue(mockFetchAllResult);

    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs,
    }));

    const { createApp } = await import('../../src/server.js');
    const app = createApp();

    const response = await request(app).get('/api/prs');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: mockFetchAllResult.data,
      errors: [
        {
          repo: 'repo1',
          error: 'Forbidden: insufficient permissions',
          code: '403',
        },
      ],
      count: 1,
      fromCache: false, // Add this expectation
      generatedAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      ),
      summary: {
        totalReposQueried: 2,
        successfulRepos: 1,
        failedRepos: 1,
      },
    });
  });

  it('should handle complete failures gracefully', async () => {
    // Arrange
    const mockFetchAllDependabotPRs = vi
      .fn()
      .mockRejectedValue(new Error('GitHub token authentication failed'));

    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs,
    }));

    const { createApp } = await import('../../src/server.js');
    const app = createApp();

    // Act
    const response = await request(app).get('/api/prs');

    // Assert
    expect(response.status).toBe(500);
    expect(response.body.error.message).toBe(
      'GitHub token authentication failed',
    );
  });
});
