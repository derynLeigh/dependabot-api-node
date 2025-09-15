import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPR, createMockUser } from '../utils/helperFunctions.js';

describe('fetchDependabotPRs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('should fetch and filter Dependabot PRs', async () => {
    // Arrange
    const mockPRs = [
      createMockPR({ 
        id: 1, 
        title: 'Bump package version',
        user: createMockUser({ login: 'dependabot[bot]', id: 1, type: 'Bot' as const })
      }),
      createMockPR({ 
        id: 2, 
        title: 'Feature update',
        user: createMockUser({ login: 'regular-user', id: 2, type: 'User' as const })
      }),
      createMockPR({ 
        id: 3, 
        title: 'Security update',
        user: createMockUser({ login: 'dependabot[bot]', id: 1, type: 'Bot' as const })
      })
    ];
    
    const mockList = vi.fn().mockResolvedValue({ data: mockPRs });
    const mockOctokit = { pulls: { list: mockList } };

    // Mock Octokit constructor
    vi.doMock('@octokit/rest', () => ({
      Octokit: vi.fn().mockImplementation(() => mockOctokit)
    }));

    // Import after mocking
    const { fetchDependabotPRs } = await import('../../src/utils/gitHubHelpers.js');

    // Act
    const result = await fetchDependabotPRs('test-token', 'owner', 'repo');

    // Assert
    expect(mockList).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      state: 'open'
    });
    
    // Should only return the Dependabot PRs (id: 1 and 3)
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
    expect(result.every(pr => pr.user?.login === 'dependabot[bot]')).toBe(true);
  });

  it('should handle empty PR list', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [] });
    const mockOctokit = { pulls: { list: mockList } };

    vi.doMock('@octokit/rest', () => ({
      Octokit: vi.fn().mockImplementation(() => mockOctokit)
    }));

    const { fetchDependabotPRs } = await import('../../src/utils/gitHubHelpers.js');

    const result = await fetchDependabotPRs('test-token', 'owner', 'repo');

    expect(result).toEqual([]);
  });

  it('should handle API errors', async () => {
    const mockList = vi.fn().mockRejectedValue(new Error('API rate limit exceeded'));
    const mockOctokit = { pulls: { list: mockList } };

    vi.doMock('@octokit/rest', () => ({
      Octokit: vi.fn().mockImplementation(() => mockOctokit)
    }));

    const { fetchDependabotPRs } = await import('../../src/utils/gitHubHelpers.js');

    await expect(fetchDependabotPRs('test-token', 'owner', 'repo')).rejects.toThrow('API rate limit exceeded');
  });
});