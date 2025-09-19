import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { FetchAllResult } from '../utils/types/testTypes.js';

describe('GET /api/prs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    
    // Set required environment variables
    process.env.GITHUB_APP_ID = 'test-app-id';
    process.env.GITHUB_PRIVATE_KEY = 'test-private-key';
    process.env.GITHUB_INSTALLATION_ID = 'test-installation-id';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPOS = 'repo1,repo2';
  });

  it('should return PRs with new enhanced response format', async () => {
    // Arrange
    const mockFetchAllResult: FetchAllResult = {
      data: [
        {
          id: 1,
          title: 'Test PR',
          url: 'https://github.com/test/repo/pull/1',
          repo: 'test-repo',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ],
      errors: [],
      count: 1
    };

    // Mock the fetchAllDependabotPRs function
    const mockFetchAllDependabotPRs = vi.fn().mockResolvedValue(mockFetchAllResult);
    
    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs
    }));

    // Import app after mocking
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
      generatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      summary: {
        totalReposQueried: 2, // from GITHUB_REPOS env var
        successfulRepos: 2,
        failedRepos: 0
      }
    });

    expect(mockFetchAllDependabotPRs).toHaveBeenCalledWith(
      {
        GITHUB_APP_ID: 'test-app-id',
        GITHUB_PRIVATE_KEY: 'test-private-key',
        GITHUB_INSTALLATION_ID: 'test-installation-id'
      },
      'test-owner',
      ['repo1', 'repo2']
    );
  });

  it('should handle and report repository errors', async () => {
    // Arrange
    const mockFetchAllResult: FetchAllResult = {
      data: [
        {
          id: 1,
          title: 'Successful PR',
          url: 'https://github.com/test/repo2/pull/1',
          repo: 'repo2',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ],
      errors: [
        {
          repo: 'repo1',
          error: 'Forbidden: insufficient permissions',
          code: '403'
        }
      ],
      count: 1
    };

    const mockFetchAllDependabotPRs = vi.fn().mockResolvedValue(mockFetchAllResult);
    
    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs
    }));

    const { createApp } = await import('../../src/server.js');
    const app = createApp();

    // Act
    const response = await request(app).get('/api/prs');

    // Assert
    expect(response.status).toBe(200); // Still 200 because we got partial results
    expect(response.body).toEqual({
      data: mockFetchAllResult.data,
      errors: [
        {
          repo: 'repo1',
          error: 'Forbidden: insufficient permissions',
          code: '403'
        }
      ],
      count: 1,
      generatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      summary: {
        totalReposQueried: 2,
        successfulRepos: 1,
        failedRepos: 1
      }
    });
  });

  it('should handle complete failures gracefully', async () => {
    // Arrange
    const mockFetchAllDependabotPRs = vi.fn().mockRejectedValue(new Error('GitHub token authentication failed'));
    
    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs
    }));

    const { createApp } = await import('../../src/server.js');
    const app = createApp();

    // Act
    const response = await request(app).get('/api/prs');

    // Assert
    expect(response.status).toBe(500);
    expect(response.body.error.message).toBe('GitHub token authentication failed');
  });
});