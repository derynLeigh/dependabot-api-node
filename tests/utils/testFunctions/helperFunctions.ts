import type { DependabotPR as TestDependabotPR, GitHubUser } from '../types/testTypes.js';

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