import type { DependabotPR as TestDependabotPR, GitHubUser } from '../types/testTypes.js';

type MockPROverrides = {
  [K in keyof TestDependabotPR]?: K extends 'head' 
    ? TestDependabotPR[K] | null  // Allow null specifically for head
    : TestDependabotPR[K];
};

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

export function createMockPR(
  overrides: MockPROverrides = {}): TestDependabotPR {
  const baseDefaults = {
    id: 1,
    title: 'Mock PR',
    html_url: 'https://example.com/pr/1',
    url: 'https://api.github.com/repos/owner/repo/pulls/1',
    node_id: 'PR_node123',
    number: 1,
    state: 'open' as const,
    locked: false,
    user: createTestMockUser(),
    body: 'Mock PR body',
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2025-09-01T11:00:00Z',
    closed_at: null,
    merged_at: null,
    merge_commit_sha: null,
    assignee: null,
    assignees: [],
    requested_reviewers: [],
    requested_teams: [],
    head: {
      label: 'dependabot:npm/typescript-5.1.0',
      ref: 'npm/typescript-5.1.0',
      sha: 'abc123def456',
      user: {
        login: 'dependabot[bot]',
        id: 49699333,
        type: 'Bot' as const
      },
      repo: {
        id: 123456,
        name: 'mock-repo',
        full_name: 'owner/mock-repo',
        owner: {
          login: 'owner',
          id: 12345,
          type: 'User' as const
        },
        private: false,
        fork: false,
        archived: false,
        disabled: false
      }
    },
    base: {
      label: 'owner:main',
      ref: 'main',
      sha: 'def456abc123',
      user: {
        login: 'owner',
        id: 12345,
        type: 'User' as const
      },
      repo: {
        id: 123456,
        name: 'mock-repo',
        full_name: 'owner/mock-repo',
        owner: {
          login: 'owner',
          id: 12345,
          type: 'User' as const
        },
        private: false,
        fork: false,
        archived: false,
        disabled: false
      }
    },
    labels: [],
    milestone: null,
    draft: false
  };

  return {
    ...baseDefaults,
    ...overrides
  } as TestDependabotPR;
}