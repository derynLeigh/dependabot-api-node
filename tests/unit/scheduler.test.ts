// tests/unit/scheduler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SchedulerConfig, FetchAllResult, AuthConfig } from '../utils/types/testTypes.js';

describe('Scheduler Execution Logic', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('executeScheduledFetch', () => {
    it('should execute fetch successfully and call onSuccess handler', async () => {
      // Arrange
      const mockConfig: AuthConfig = {
        GITHUB_APP_ID: 'test-app-id',
        GITHUB_PRIVATE_KEY: 'test-key',
        GITHUB_INSTALLATION_ID: 'test-install-id'
      };

      const mockResult: FetchAllResult = {
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

      const mockFetchAllDependabotPRs = vi.fn().mockResolvedValue(mockResult);
      const mockOnSuccess = vi.fn().mockResolvedValue(undefined);
      const mockOnError = vi.fn();

      // Import the function we'll implement
      const { executeScheduledFetch } = await import('../utils/testFunctions/testImplementations.js');

      // Act
      await executeScheduledFetch({
        config: mockConfig,
        owner: 'test-owner',
        repos: ['repo1', 'repo2'],
        onSuccess: mockOnSuccess,
        onError: mockOnError
      }, mockFetchAllDependabotPRs);

      // Assert
      expect(mockFetchAllDependabotPRs).toHaveBeenCalledWith(mockConfig, 'test-owner', ['repo1', 'repo2']);
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle errors and call onError handler', async () => {
      // Arrange
      const mockConfig: AuthConfig = {
        GITHUB_APP_ID: 'test-app-id',
        GITHUB_PRIVATE_KEY: 'test-key',
        GITHUB_INSTALLATION_ID: 'test-install-id'
      };

      const testError = new Error('GitHub API failed');
      const mockFetchAllDependabotPRs = vi.fn().mockRejectedValue(testError);
      const mockOnSuccess = vi.fn();
      const mockOnError = vi.fn().mockResolvedValue(undefined);

      const { executeScheduledFetch } = await import('../utils/testFunctions/testImplementations.js');

      // Act
      await executeScheduledFetch({
        config: mockConfig,
        owner: 'test-owner',
        repos: ['repo1', 'repo2'],
        onSuccess: mockOnSuccess,
        onError: mockOnError
      }, mockFetchAllDependabotPRs);

      // Assert
      expect(mockFetchAllDependabotPRs).toHaveBeenCalledWith(mockConfig, 'test-owner', ['repo1', 'repo2']);
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });

    it('should handle missing onSuccess handler gracefully', async () => {
      // Test that the function doesn't crash if onSuccess is undefined
      const mockConfig: AuthConfig = {
        GITHUB_APP_ID: 'test-app-id',
        GITHUB_PRIVATE_KEY: 'test-key',
        GITHUB_INSTALLATION_ID: 'test-install-id'
      };

      const mockResult: FetchAllResult = {
        data: [],
        errors: [],
        count: 0
      };

      const mockFetchAllDependabotPRs = vi.fn().mockResolvedValue(mockResult);

      const { executeScheduledFetch } = await import('../utils/testFunctions/testImplementations.js');

      // Act & Assert - should not throw
      await expect(executeScheduledFetch({
        config: mockConfig,
        owner: 'test-owner',
        repos: ['repo1']
        // No onSuccess or onError handlers
      }, mockFetchAllDependabotPRs)).resolves.not.toThrow();
    });
  });
});