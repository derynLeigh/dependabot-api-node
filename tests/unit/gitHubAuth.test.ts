import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthConfig } from '../../src/types/auth.js';

describe('getGitHubToken', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('should create GitHub token with correct auth config', async () => {
    // Arrange
    const config: AuthConfig = {
      GITHUB_APP_ID: '12345',
      GITHUB_PRIVATE_KEY: 'private-key-content',
      GITHUB_INSTALLATION_ID: '67890'
    };
    
    const expectedToken = 'ghs_test_token';
    
    // Create mock functions
    const mockAuth = vi.fn().mockResolvedValue({ token: expectedToken });
    const mockCreateAppAuth = vi.fn().mockReturnValue(mockAuth);

    // Mock the module dynamically
    vi.doMock('@octokit/auth-app', () => ({
      createAppAuth: mockCreateAppAuth
    }));

    // Import the function after mocking
    const { getGitHubToken } = await import('../../src/utils/gitHubHelpers.js');

    // Act
    const result = await getGitHubToken(config);

    // Assert
    expect(mockCreateAppAuth).toHaveBeenCalledWith({
      appId: '12345',
      privateKey: 'private-key-content'
    });
    
    expect(mockAuth).toHaveBeenCalledWith({
      type: 'installation',
      installationId: '67890'
    });
    
    expect(result).toBe(expectedToken);
  });

  it('should propagate auth errors', async () => {
    // Arrange
    const config: AuthConfig = {
      GITHUB_APP_ID: '12345',
      GITHUB_PRIVATE_KEY: 'invalid-key',
      GITHUB_INSTALLATION_ID: '67890'
    };
    
    const mockAuth = vi.fn().mockRejectedValue(new Error('Invalid private key'));
    const mockCreateAppAuth = vi.fn().mockReturnValue(mockAuth);

    // Mock the module dynamically
    vi.doMock('@octokit/auth-app', () => ({
      createAppAuth: mockCreateAppAuth
    }));

    // Import the function after mocking
    const { getGitHubToken } = await import('../../src/utils/gitHubHelpers.js');

    // Act & Assert
    await expect(getGitHubToken(config)).rejects.toThrow('Invalid private key');
  });
});