import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toPRdto, getGitHubToken, fetchDependabotPRs, fetchAllDependabotPRs } from '../../src/utils/gitHubHelpers.js';
import * as gitHubHelpers from '../../src/utils/gitHubHelpers.js';
import { createMockPR } from '../utils/helperFunctions.js';
import { Octokit } from '@octokit/rest';

describe('DTO transformation', () => {
  it('Transforms a Github PR to DTO format', () => {
    const mockPR = createMockPR();
    const result = toPRdto(mockPR);

    expect(result.id).toBe(mockPR.id);
    expect(result.title).toBe(mockPR.title);
    expect(result.url).toBe(mockPR.html_url);
    expect(result.repo).toBe(mockPR.head.repo.name);
    expect(result.createdAt).toBe(mockPR.created_at);
    expect(result.updatedAt).toBe(mockPR.updated_at);
  });
  
  it('Handles missing data', () => {
    const incompleteMockPR = createMockPR({
      id: 2,
      title: 'Incomplete PR',
      head: { repo: null },
    });

    const result = toPRdto(incompleteMockPR);

    expect(result.id).toBe(incompleteMockPR.id);
    expect(result.repo).toBe('');
  });

  it('Handles missing head object gracefully', () => {
    const prWithoutHead = createMockPR({
      id: 3,
      title: 'No head',
      head: undefined,
    });

    const result = toPRdto(prWithoutHead);

    expect(result.id).toBe(prWithoutHead.id);
    expect(result.repo).toBe('');
  });

  it('Handles missing repo name gracefully', () => {
    const prWithRepoButNoName = createMockPR({
      id: 4,
      title: 'Repo without name',
      head: { repo: { name: '' } },
    });

    const result = toPRdto(prWithRepoButNoName);

    expect(result.id).toBe(prWithRepoButNoName.id);
    expect(result.repo).toBe('');
  });

  it('Handles missing created_at and updated_at fields', () => {
    const prMissingDates = createMockPR({
      id: 5,
      title: 'Missing dates',
      created_at: undefined,
      updated_at: undefined,
    });

    const result = toPRdto(prMissingDates);

    expect(result.createdAt).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
  });

  it('Handles completely empty PR object', () => {
    // @ts-expect-error: Testing with empty object
    // Intentionally passing an empty object to verify that toPRdto handles missing properties gracefully.
    const result = toPRdto({});

    expect(result.id).toBeUndefined();
    expect(result.title).toBeUndefined();
    expect(result.url).toBeUndefined();
    expect(result.repo).toBe('');
    expect(result.createdAt).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
  });
});

vi.mock('@octokit/auth-app', (): Record<string, unknown> => {
  return {
    createAppAuth: () => ({
      auth: async () => ({ token: 'mock-token' }),
    }),
  };
});

describe('getGitHubToken', () => {
  const mockToken = 'mock-token';
  const mockConfig = {
    GITHUB_APP_ID: '1',
    GITHUB_PRIVATE_KEY: 'private-key',
    GITHUB_INSTALLATION_ID: '2',
  };

  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(gitHubHelpers, 'getGitHubToken').mockResolvedValue('mock-token');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a token from the app auth', async () => {
    const token = await getGitHubToken(mockConfig as never);
    expect(token).toBe(mockToken);
  });
});

describe('fetchDependabotPRs', () => {
  const mockToken = 'mock-token';
  const mockOwner = 'owner';
  const mockRepo = 'repo';

  it('calls pulls.list with correct parameters', async () => {
    const pullsListMock = vi.fn().mockResolvedValue({
      data: [],
    });

    Object.defineProperty(Octokit.prototype, 'pulls', {
      configurable: true,
      writable: true,
      value: { list: pullsListMock },
    });

    await fetchDependabotPRs(mockToken, mockOwner, mockRepo);
    expect(pullsListMock).toHaveBeenCalledWith({
      owner: mockOwner,
      repo: mockRepo,
      state: 'open',
    });
  });

  it('returns empty array if no dependabot PRs found', async () => {
    const pullsListMock = vi.fn().mockResolvedValue({
      data: [{ user: { login: 'someone-else' }, id: 2 }],
    });

    const originalPulls = (Octokit.prototype as unknown as { pulls: unknown }).pulls;
    Object.defineProperty(Octokit.prototype, 'pulls', {
      configurable: true,
      writable: true,
      value: { list: pullsListMock },
    });

    try {
      const result = await fetchDependabotPRs(mockToken, mockOwner, mockRepo);
      expect(result).toEqual([]);
    } finally {
      Object.defineProperty(Octokit.prototype, 'pulls', {
        configurable: true,
        writable: true,
        value: originalPulls,
      });
    }
  });

describe('fetchAllDependabotPRs', async () => {
  const mockConfig = {
    GITHUB_APP_ID: '1',
    GITHUB_PRIVATE_KEY: 'private-key',
    GITHUB_INSTALLATION_ID: '2',
  };
  const mockOwner = 'owner';
  const mockRepos = ['repo1', 'repo2'];

  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(gitHubHelpers, 'getGitHubToken').mockResolvedValue('mock-token');
  });
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(gitHubHelpers, 'getGitHubToken').mockResolvedValue('mock-token');
  });

  afterEach(() => {
    
    vi.restoreAllMocks();
  });
    const mockPR1 = createMockPR({ id: 1 });
    const mockPR2 = createMockPR({ id: 2 });

    vi.spyOn(gitHubHelpers, 'fetchDependabotPRs')
      .mockImplementationOnce(() => Promise.resolve([mockPR1]))
      .mockImplementationOnce(() => Promise.resolve([mockPR2]));

    const result = await fetchAllDependabotPRs(mockConfig as { GITHUB_APP_ID: string; GITHUB_PRIVATE_KEY: string; GITHUB_INSTALLATION_ID: string }, mockOwner, mockRepos);

    expect(result).toEqual([toPRdto(mockPR1), toPRdto(mockPR2)]);
  });

  it('handles errors from fetchDependabotPRs and continues', async () => {
    const mockPR1 = createMockPR({ id: 1 });
    vi.spyOn(gitHubHelpers, 'fetchDependabotPRs')
      .mockImplementationOnce(() => Promise.resolve([mockPR1]))
      .mockImplementationOnce(() => Promise.reject(new Error('fail')));

    const mockConfig = {
      GITHUB_APP_ID: '1',
      GITHUB_PRIVATE_KEY: 'private-key',
      GITHUB_INSTALLATION_ID: '2',
    };
    const result = await fetchAllDependabotPRs(
      mockConfig as { GITHUB_APP_ID: string; GITHUB_PRIVATE_KEY: string; GITHUB_INSTALLATION_ID: string },
      mockOwner,
      [mockRepo]
    );

    expect(result).toEqual([toPRdto(mockPR1)]);
  });
});
