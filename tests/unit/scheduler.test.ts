// tests/unit/scheduler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FetchAllResult, AuthConfig } from '../utils/types/testTypes.js';

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

      const { executeScheduledFetch } = await import('../utils/functions/testImplementations.js');

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

      const { executeScheduledFetch } = await import('../utils/functions/testImplementations.js');

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
        // Arrange
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

      const { executeScheduledFetch } = await import('../utils/functions/testImplementations.js');

      // Act & Assert - should not throw
      await expect(executeScheduledFetch({
        config: mockConfig,
        owner: 'test-owner',
        repos: ['repo1']
      }, mockFetchAllDependabotPRs)).resolves.not.toThrow();
    });
  });
});

describe('executeScheduledFetchWithRetry', () => {
  it('should retry failed attempts up to the specified limit', async () => {
    // Arrange
    const mockConfig: AuthConfig = {
      GITHUB_APP_ID: 'test-app-id',
      GITHUB_PRIVATE_KEY: 'test-key',
      GITHUB_INSTALLATION_ID: 'test-install-id'
    };

    const testError = new Error('Temporary network failure');
    const mockFetchAllDependabotPRs = vi.fn()
      .mockRejectedValueOnce(testError) // Fail first attempt
      .mockRejectedValueOnce(testError) // Fail second attempt
      .mockResolvedValueOnce({ data: [], errors: [], count: 0 }); // Succeed third attempt

    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    const { executeScheduledFetchWithRetry } = await import('../utils/functions/testImplementations.js');

    // Act
    await executeScheduledFetchWithRetry({
      config: mockConfig,
      owner: 'test-owner',
      repos: ['repo1'],
      onSuccess: mockOnSuccess,
      onError: mockOnError,
      maxRetries: 3
    }, mockFetchAllDependabotPRs);

    // Assert
    expect(mockFetchAllDependabotPRs).toHaveBeenCalledTimes(3);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should call onError after exhausting all retries', async () => {
    // Arrange
    const mockConfig: AuthConfig = {
      GITHUB_APP_ID: 'test-app-id',
      GITHUB_PRIVATE_KEY: 'test-key',
      GITHUB_INSTALLATION_ID: 'test-install-id'
    };

    const testError = new Error('Persistent failure');
    const mockFetchAllDependabotPRs = vi.fn().mockRejectedValue(testError);
    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    const { executeScheduledFetchWithRetry } = await import('../utils/functions/testImplementations.js');

    // Act
    await executeScheduledFetchWithRetry({
      config: mockConfig,
      owner: 'test-owner',
      repos: ['repo1'],
      onSuccess: mockOnSuccess,
      onError: mockOnError,
      maxRetries: 2
    }, mockFetchAllDependabotPRs);

    // Assert
    expect(mockFetchAllDependabotPRs).toHaveBeenCalledTimes(2);
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(testError);
  });

  it('should use default retry count when not specified', async () => {
    const mockConfig: AuthConfig = {
      GITHUB_APP_ID: 'test-app-id',
      GITHUB_PRIVATE_KEY: 'test-key',
      GITHUB_INSTALLATION_ID: 'test-install-id'
    };

    const testError = new Error('Always fails');
    const mockFetchAllDependabotPRs = vi.fn().mockRejectedValue(testError);
    const mockOnError = vi.fn();

    const { executeScheduledFetchWithRetry } = await import('../utils/functions/testImplementations.js');

    await executeScheduledFetchWithRetry({
      config: mockConfig,
      owner: 'test-owner',
      repos: ['repo1'],
      onError: mockOnError
    }, mockFetchAllDependabotPRs);

    expect(mockFetchAllDependabotPRs).toHaveBeenCalledTimes(3);
  });
});

describe('createScheduler', () => {
  it('should create a scheduler with the correct cron schedule', async () => {
    const mockSchedule = vi.fn().mockReturnValue({
      start: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn()
    });

    vi.doMock('node-cron', () => ({
      schedule: mockSchedule
    }));

    const { createScheduler } = await import('../utils/functions/testImplementations.js');

    const config = {
      cronSchedule: '0 7 * * *',
      auth: {
        GITHUB_APP_ID: 'test-app',
        GITHUB_PRIVATE_KEY: 'test-key',
        GITHUB_INSTALLATION_ID: 'test-install'
      },
      owner: 'test-owner',
      repos: ['repo1', 'repo2']
    };

    await createScheduler(config);

    expect(mockSchedule).toHaveBeenCalledWith(
      '0 7 * * *',
      expect.any(Function)
    );
  });

  it('should execute the scheduled task when cron triggers', async () => {
    // Reset modules first
    vi.resetModules();

    let cronCallback: (() => Promise<void>) | undefined;

    const mockTask = {
      start: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
    };

    const mockSchedule = vi
      .fn()
      .mockImplementation((schedule: string, callback: () => Promise<void>) => {
        cronCallback = callback;
        return mockTask;
      });

    const mockResult: FetchAllResult = {
      data: [],
      errors: [],
      count: 0,
    };

    const mockFetchAllDependabotPRs = vi.fn().mockResolvedValue(mockResult);
    const mockOnSuccess = vi.fn();

    // Mock both modules before importing
    vi.doMock('node-cron', () => ({
      schedule: mockSchedule,
    }));

    vi.doMock('../../src/utils/gitHubHelpers.js', () => ({
      fetchAllDependabotPRs: mockFetchAllDependabotPRs,
    }));

    // Import after mocking
    const { createScheduler } = await import(
      '../utils/functions/testImplementations.js'
    );

    const config = {
      cronSchedule: '0 7 * * *',
      auth: {
        GITHUB_APP_ID: 'test-app',
        GITHUB_PRIVATE_KEY: 'test-key',
        GITHUB_INSTALLATION_ID: 'test-install',
      },
      owner: 'test-owner',
      repos: ['repo1'],
      onSuccess: mockOnSuccess,
      maxRetries: 2,
    };

    await createScheduler(config);

    // Verify that cronCallback was set
    expect(cronCallback).toBeDefined();
    expect(typeof cronCallback).toBe('function');

    // Manually trigger the cron callback
    await cronCallback!();

    expect(mockFetchAllDependabotPRs).toHaveBeenCalledWith(
      config.auth,
      'test-owner',
      ['repo1'],
    );
    expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
  });
});
