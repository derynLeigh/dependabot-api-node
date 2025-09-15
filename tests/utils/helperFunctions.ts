import type { DependabotPR } from '../../src/types/githubTypes.js';

type MockPROverrides = {
  [K in keyof DependabotPR]?: K extends 'head' 
    ? DependabotPR[K] | null  // Allow null specifically for head
    : DependabotPR[K];
};

type GitHubUser = NonNullable<DependabotPR['user']>;

export function createMockUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    name: null,
    email: null,
    login: 'dependabot[bot]',
    id: 49699333,
    node_id: 'MDM6Qm90NDk2OTkzMzM=',
    avatar_url: 'https://avatars.githubusercontent.com/in/29110?v=4',
    gravatar_id: null,
    url: 'https://api.github.com/users/dependabot%5Bbot%5D',
    html_url: 'https://github.com/apps/dependabot',
    followers_url: 'https://api.github.com/users/dependabot%5Bbot%5D/followers',
    following_url: 'https://api.github.com/users/dependabot%5Bbot%5D/following{/other_user}',
    gists_url: 'https://api.github.com/users/dependabot%5Bbot%5D/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/dependabot%5Bbot%5D/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/dependabot%5Bbot%5D/subscriptions',
    organizations_url: 'https://api.github.com/users/dependabot%5Bbot%5D/orgs',
    repos_url: 'https://api.github.com/users/dependabot%5Bbot%5D/repos',
    events_url: 'https://api.github.com/users/dependabot%5Bbot%5D/events{/privacy}',
    received_events_url: 'https://api.github.com/users/dependabot%5Bbot%5D/received_events',
    type: 'Bot' as const,
    site_admin: false,
    ...overrides
  };
}

export function createMockPR(
  overrides: MockPROverrides = {}): DependabotPR {
  const baseDefaults = {
    id: 1,
    title: 'Mock PR',
    html_url: 'https://example.com/pr/1',
    url: 'https://api.github.com/repos/owner/repo/pulls/1',
    node_id: 'PR_node123',
    number: 1,
    state: 'open' as const,
    locked: false,
    user: createMockUser(),
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
  } as DependabotPR;
}